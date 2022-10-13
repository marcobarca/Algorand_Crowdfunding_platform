  async function createApp(name, token, port, account, goal, durationInSeconds) {
    console.log("account -> " +account)
    return new Promise((resolve, reject) => {
      fetch('/api/createApp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name, token: token, port: port, account: account, goal: goal, durationInSeconds: durationInSeconds }),
      }).then((response) => {
        if (response.ok) {
            resolve(null)
        } else {
          response.json()
            .then((message) => { reject(message); })
            .catch(() => { reject({ error: 'Cannot parse server response' }) });
        }
      }).catch(() => { reject({ error: 'Cannot communicate with the server' }) });
    });
  }

  async function createAppFromTxn(name, account, setTxn) {
    const response = await fetch('/api/createApp?name=' + name + '&&account=' + account);
    const responseBody = await response.json();
    if (response.ok){
      console.log("Responsebody ->" + responseBody)
      setTxn(responseBody)
      return responseBody
    }
    else
      throw responseBody;
  }

  

  const API = {createApp, createAppFromTxn}
  
  export default API;