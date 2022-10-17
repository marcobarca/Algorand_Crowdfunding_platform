export async function getUnsignedTxn(creatorAddress, goal, startDate, endDate) {
    const response = await fetch('/api/createApp/Algorand?creator=' + creatorAddress + "&goal=" + goal + "&startDate=" + startDate + "&endDate=" + endDate);
    const responseBody = await response.json();
    if (response.ok) {
      return responseBody;
    }
    else
      throw responseBody;
  }

  //FIXME = add token as first parameter
  export function postSignedTxn(txnID, signed_txn) {
    return new Promise((resolve, reject) => {
      fetch('/api/createApp/Algorand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({txnID: txnID, signed_txn: signed_txn }),
      }).then((response) => {
        if (response.ok) {
          resolve("Application created");
        } else {
          response.json()
            .then((message) => { reject(message); })
            .catch(() => { reject({ error: 'Cannot parse server response' }) });
        }
      }).catch(() => { reject({ error: 'Cannot communicate with the server' }) });
    });
  }
