const algosdk = require('algosdk');
const approval = require('./Approval');
const fs = require('fs');
const path = require('path');
const clear = require('./Clear');
const { domainToASCII } = require('url');


const compileTeal = async (client, tealFile) => {
    try {
        // Compile Program
        let encoder = new TextEncoder();
        let programBytes = encoder.encode(tealFile);
        let compileResponse = await client.compile(programBytes).do();
        let compiledBytes = new Uint8Array(Buffer.from(compileResponse.result, "base64"));
        return compiledBytes;
    } catch (err) {
        console.error(err)
    }
}

//CREATE APP
// create unsigned transaction
async function createApp(token, port, creator, goal, duration) {
    token = { 'X-API-Key': 'zvsBatXQRL7r4JBuKRYtY9ekvGpQa0gl93vsHvur' }
    const algodServer = "https://testnet-algorand.api.purestake.io/ps2/";
    const client = new algosdk.Algodv2(token, algodServer, port);

    if (client !== null) {
        client
            .healthCheck()
            .do()
            .then((d) => {
                console.log("HealthCheck successfully completed");
            })
            .catch((e) => {
                console.log("Error in algodClient healthCheck");
            });
    }

    goal *= 1000000
    const localInts = 1;
    const localBytes = 1;
    const globalInts = 14;
    const globalBytes = 1;

    const startTime = new Date().getTime()
    const endTime = startTime + duration * 1000
    //create list of bytes for app args
    let appArgs = [];
    if (creator !== undefined) {
        console.log(appArgs.push(
            algosdk.decodeAddress(creator).publicKey,
            algosdk.bigIntToBytes(startTime, 8),
            algosdk.bigIntToBytes(endTime, 8),
            algosdk.bigIntToBytes(goal, 8),
        ))
    }

    // app_args = [
    //     encoding.decode_address(creator),
    //     startTime.to_bytes(8, "big"),
    //     endTime.to_bytes(8, "big"),
    //     goal.to_bytes(8, "big"),
    // ]

    const filePathApproval = path.join(__dirname, 'approval.teal');
    const approval = fs.readFileSync(filePathApproval);
    let approvalProgram = await compileTeal(client, approval)

    const filePathClear = path.join(__dirname, 'clear.teal');
    const clear = fs.readFileSync(filePathClear);
    let clearProgram = await compileTeal(client, clear)

    const onComplete = algosdk.OnApplicationComplete.NoOpOC;

    let params = await client.getTransactionParams().do()
    params.fee = 1000;
    params.flatFee = true;

    let txn = algosdk.makeApplicationCreateTxn(creator, params, onComplete,
        approvalProgram, clearProgram,
        localInts, localBytes, globalInts, globalBytes, appArgs);

    return txn
    //let txId = txn.txID().toString();

    // Use the AlgoSigner encoding library to make the transactions base64
    const txn_b64 = await AlgoSigner.encoding.msgpackToBase64(txn.toByte());

    // Sign the transaction
    let signedTxs = await AlgoSigner.signTxn([{ txn: txn_b64 }]);
    console.log(signedTxs);

    // Get the base64 encoded signed transaction and convert it to binary
    let binarySignedTx = await AlgoSigner.encoding.base64ToMsgpack(
        signedTxs[0].blob
    );

    let txId = txn.txID().toString();

    // Send the transaction through the SDK client
    console.log("Attempting to send transaction")
    await client.sendRawTransaction(binarySignedTx).do();
    console.log("Tx id: " + JSON.stringify(txId))

    // Wait for transaction to be confirmed
    let confirmedTxn = await algosdk.waitForConfirmation(client, txId, 4);
    console.log("confirmed" + confirmedTxn)

    //Get the completed Transaction
    console.log("Transaction " + txId + " confirmed in round " + confirmedTxn["confirmed-round"]);

    // display results
    let transactionResponse = await client.pendingTransactionInformation(txId).do()
    let appId = transactionResponse['application-index'];
    console.log("Response: " + JSON.stringify(transactionResponse))
    console.log("Created new app-id: ", appId);

}

 async function setupApp(client, appID, creator) {

    const appAddr = algosdk.getApplicationAddress(appID)
    let params = await client.getTransactionParams().do();
    const fundingAmount = (
        // min account balance
        100000
        // 3 * min txn fee
        + 3 * 1000
    )

    let fundAppTxn = algosdk.makePaymentTxnWithSuggestedParams(creator, appAddr, fundingAmount, undefined, new Uint8Array(0), params)
    let fundAppTxnId = fundAppTxn.txID().toString();
    console.log("Fund app txn id: " + fundAppTxnId)

    // fundAppTxn = transaction.PaymentTxn(
    //     sender=sender.getAddress(),
    //     receiver=appAddr,
    //     amt=fundingAmount,
    //     sp=suggestedParams,
    // )

    const onComplete = algosdk.OnApplicationComplete.NoOpOC;
    const options = {
        from: creator,
        suggestedParams: params,
        appIndex: appID,
        onComplete: onComplete,
        appArgs: [new Uint8Array(Buffer.from("setup"))]
    }

    let setupTxn = algosdk.makeApplicationCallTxnFromObject({ ...options })
    let setupTxnId = setupTxn.txID().toString();
    console.log("Setup app txn id: " + setupTxnId)

    algosdk.assignGroupID([fundAppTxn, setupTxn])

    let binaryTxs = [fundAppTxn.toByte(), setupTxn.toByte()];
    let base64Txs = binaryTxs.map((binary) => AlgoSigner.encoding.msgpackToBase64(binary));

    let signedTxs = await AlgoSigner.signTxn([
        {
            txn: base64Txs[0],
        },
        {
            txn: base64Txs[1],
        },
    ]);

    console.log(signedTxs);
    console.log("Txs signed")

    // Get the base64 encoded signed transaction and convert it to binary
    let binarySignedTxs = signedTxs.map((tx) => AlgoSigner.encoding.base64ToMsgpack(tx.blob));

    const sendTxs = await client.sendRawTransaction(binarySignedTxs).do();
    console.log("Tx sent: " + JSON.stringify(sendTxs))

    let confirmedTxn = await algosdk.waitForConfirmation(client, signedTxs[0]["txID"], 4);
    console.log("confirmed" + JSON.stringify(confirmedTxn["confirmed-round"]))

    confirmedTxn = await algosdk.waitForConfirmation(client, signedTxs[1]["txID"], 4);
    console.log("confirmed" + JSON.stringify(confirmedTxn["confirmed-round"]))

}

 async function sendFunds(client, appID, funder, fundingAmount) {

    const appAddr = algosdk.getApplicationAddress(appID)
    let params = await client.getTransactionParams().do();

    fundingAmount *= 1000000

    let payTxn = algosdk.makePaymentTxnWithSuggestedParams(funder, appAddr, fundingAmount, undefined, new Uint8Array(0), params)
    let payTxnId = payTxn.txID().toString();
    console.log("Pay app txn id: " + payTxnId)

    const onComplete = algosdk.OnApplicationComplete.NoOpOC;
    const options = {
        from: funder,
        suggestedParams: params,
        appIndex: appID,
        onComplete: onComplete,
        appArgs: [new Uint8Array(Buffer.from("fund"))]
    }

    let appCallTxn = algosdk.makeApplicationCallTxnFromObject({ ...options })
    let appCallTxnId = appCallTxn.txID().toString();
    console.log("App call txn id: " + appCallTxnId)

    algosdk.assignGroupID([payTxn, appCallTxn])

    let binaryTxs = [payTxn.toByte(), appCallTxn.toByte()];
    let base64Txs = binaryTxs.map((binary) => AlgoSigner.encoding.msgpackToBase64(binary));

    let signedTxs = await AlgoSigner.signTxn([
        {
            txn: base64Txs[0],
        },
        {
            txn: base64Txs[1],
        },
    ]);


    // Get the base64 encoded signed transaction and convert it to binary
    let binarySignedTxs = signedTxs.map((tx) => AlgoSigner.encoding.base64ToMsgpack(tx.blob));

    const sendTxs = await client.sendRawTransaction(binarySignedTxs).do();
    console.log("Tx sent: " + JSON.stringify(sendTxs))

    let confirmedTxn = await algosdk.waitForConfirmation(client, signedTxs[0]["txID"], 4);
    console.log("confirmed" + confirmedTxn["confirmed-round"])

    confirmedTxn = await algosdk.waitForConfirmation(client, appCallTxnId, 4);
    console.log("confirmed" + confirmedTxn["confirmed-round"])

}

 async function sendRefunds(client, appID, user) {

    let params = await client.getTransactionParams().do();

    const onComplete = algosdk.OnApplicationComplete.NoOpOC;
    const options = {
        from: user,
        suggestedParams: params,
        appIndex: appID,
        onComplete: onComplete,
        appArgs: [new Uint8Array(Buffer.from("refund"))]
    }

    let refundTxn = algosdk.makeApplicationCallTxnFromObject({ ...options })

    // Use the AlgoSigner encoding library to make the transactions base64
    const txn_b64 = await AlgoSigner.encoding.msgpackToBase64(refundTxn.toByte());

    // Sign the transaction
    let signedTx = await AlgoSigner.signTxn([{ txn: txn_b64 }]);
    console.log(signedTx);

    // Get the base64 encoded signed transaction and convert it to binary
    let binarySignedTx = await AlgoSigner.encoding.base64ToMsgpack(
        signedTx[0].blob
    );

    // Send the transaction through the SDK client
    console.log("Attempting to send transaction")
    await client.sendRawTransaction(binarySignedTx).do();

    // Wait for transaction to be confirmed
    let confirmedTxn = await algosdk.waitForConfirmation(client, signedTx[0]["txID"], 4);
    console.log("confirmed" + confirmedTxn["confirmed-round"])

}

 async function closeCrowdfunding(client, appID, user) {

    let params = await client.getTransactionParams().do();

    const options = {
        from: user,
        suggestedParams: params,
        appIndex: appID,
    }

    let deleteTxn = algosdk.makeApplicationDeleteTxnFromObject({ ...options })

    // Use the AlgoSigner encoding library to make the transactions base64
    const txn_b64 = await AlgoSigner.encoding.msgpackToBase64(deleteTxn.toByte());

    // Sign the transaction
    let signedTx = await AlgoSigner.signTxn([{ txn: txn_b64 }]);
    console.log(signedTx);

    // Get the base64 encoded signed transaction and convert it to binary
    let binarySignedTx = await AlgoSigner.encoding.base64ToMsgpack(
        signedTx[0].blob
    );

    // Send the transaction through the SDK client
    console.log("Attempting to send transaction")
    await client.sendRawTransaction(binarySignedTx).do();

    // Wait for transaction to be confirmed
    let confirmedTxn = await algosdk.waitForConfirmation(client, signedTx[0]["txID"], 4);
    console.log("confirmed" + confirmedTxn["confirmed-round"])

}

 async function optInApp(client, appID, user, fundingAmount) {

    fundingAmount *= 1000000
    const note = algosdk.bigIntToBytes(fundingAmount, 8)
    let params = await client.getTransactionParams().do();

    const options = {
        from: user,
        note: note,
        suggestedParams: params,
        appIndex: appID,
    }

    let optInTxn = algosdk.makeApplicationOptInTxnFromObject({ ...options })

    // Use the AlgoSigner encoding library to make the transactions base64
    const txn_b64 = await AlgoSigner.encoding.msgpackToBase64(optInTxn.toByte());

    // Sign the transaction
    let signedTx = await AlgoSigner.signTxn([{ txn: txn_b64 }]);
    console.log(signedTx);

    // Get the base64 encoded signed transaction and convert it to binary
    let binarySignedTx = await AlgoSigner.encoding.base64ToMsgpack(
        signedTx[0].blob
    );

    // Send the transaction through the SDK client
    console.log("Attempting to send transaction")
    await client.sendRawTransaction(binarySignedTx).do();

    // Wait for transaction to be confirmed
    let confirmedTxn = await algosdk.waitForConfirmation(client, signedTx[0]["txID"], 4);
    console.log("confirmed" + confirmedTxn["confirmed-round"])

}

module.exports = { createApp };