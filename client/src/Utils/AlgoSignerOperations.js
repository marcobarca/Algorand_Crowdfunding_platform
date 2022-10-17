
export async function signTransaction(txn) {

    console.log(txn)

    // TODO = improve this
    let txn_array = []

    let i = 0;
    while (txn[i] !== undefined) {
        txn_array.push(txn[i]);
        i++;
    }

    let txn_uint8 = new Uint8Array(txn_array);

    /*global AlgoSigner*/
    // Use the AlgoSigner encoding library to make the transactions base64
    const txn_b64 = await AlgoSigner.encoding.msgpackToBase64(txn_uint8);

    // Sign the transaction
    let signed_txn = await AlgoSigner.signTxn([{ txn: txn_b64 }]);

    // Get the base64 encoded signed transaction and convert it to binary
    let binary_signed_txn = await AlgoSigner.encoding.base64ToMsgpack(
        signed_txn[0].blob
    );

    console.log(binary_signed_txn)

    return binary_signed_txn
}
