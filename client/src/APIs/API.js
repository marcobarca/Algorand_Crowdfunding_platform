export async function getUnsignedTxn(creatorAddress, goal, durationInSeconds) {
    const response = await fetch('/api/createApp?creator=' + creatorAddress + "&goal=" + goal + "&duration=" + durationInSeconds);
    const responseBody = await response.json();
    if (response.ok) {
      return responseBody;
    }
    else
      throw responseBody;
  }

  export function postSignedTxn(signed_txn) {
    return new Promise((resolve, reject) => {
      fetch('/api/createApp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ signed_txn: signed_txn }),
      }).then((response) => {
        if (response.ok) {
          resolve(null);
        } else {
          response.json()
            .then((message) => { reject(message); })
            .catch(() => { reject({ error: 'Cannot parse server response' }) });
        }
      }).catch(() => { reject({ error: 'Cannot communicate with the server' }) });
    });
  }
