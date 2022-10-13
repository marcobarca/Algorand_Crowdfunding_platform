import algosdk from 'algosdk';
import { approval } from '../constants/Approval';
import { clear } from '../constants/Clear';
import { Buffer } from "buffer";


const compileTeal = async (client, tealFile) => {
    try {
        // Compile Program
        let encoder = new TextEncoder();
        let programBytes = encoder.encode(tealFile);
        let compileResponse = await client.compile(programBytes).do();
        let compiledBytes = new Uint8Array(Buffer.from(compileResponse.result, "base64"));
        console.log(compileResponse)
        return compiledBytes;
    } catch (err) {
        console.error(err)
    }
}

//CREATE APP
// create unsigned transaction
export async function signTxn(txn) {

    // var myBuffer = [];
    // var buffer = new Buffer(txn.toString(), 'utf16le');
    // for (var i = 0; i < buffer.length; i++) {
    //     myBuffer.push(buffer[i]);
    // }
    // console.log(myBuffer)

    // const string = JSON.stringify(txn) // convert Object to a String
    // const utf8Encode = new TextEncoder();
    // const byteArr = utf8Encode.encode(string);


    //console.log(JSON.parse(JSON.parse(JSON.stringify(txn)).txn))

    txn = JSON.parse(JSON.parse(JSON.stringify(txn)).txn)
    // txn.genesisHash = txn.genesisHash.toString("base64")

    //txn = new algosdk.makeApplicationCreateTxn()
    console.log(txn.appApprovalProgram)
    txn = algosdk.makeApplicationCreateTxn(txn.from, txn.suggestedParams, txn.OnApplicationComplete,
       txn.approvalProgram, txn.clearProgram,
      txn.numLocalInts, txn.numLocalByteSlices, txn.numGlobalInts, txn.numGlobalByteSlices, txn.appArgs
    );

    console.log(txn)
    //txn = algosdk.makeApplicationCallTxnFromObject(txn)
    // Use the AlgoSigner encoding library to make the transactions base64
    const txn_b64 = await AlgoSigner.encoding.msgpackToBase64(txn.toByte());

    return

    // Sign the transaction
    let signedTxs = await AlgoSigner.signTxn([{ txn: txn_b64 }]);
    console.log(signedTxs);

    // Get the base64 encoded signed transaction and convert it to binary
    let binarySignedTx = await AlgoSigner.encoding.base64ToMsgpack(
        signedTxs[0].blob
    );

}

export async function setupApp(client, appID, creator) {

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

export async function sendFunds(client, appID, funder, fundingAmount) {

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

export async function sendRefunds(client, appID, user) {

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

export async function closeCrowdfunding(client, appID, user) {

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

export async function optInApp(client, appID, user, fundingAmount) {

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
