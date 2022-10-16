import Button from 'react-bootstrap/Button';
import {useState} from "react";




function ConnectButton() {

    const [connected, setConnected] = useState(false);

    const ConnectAlgoSigner = async () => {
          if (typeof AlgoSigner !== 'undefined') {
            try{
                /*global AlgoSigner*/
                await AlgoSigner.connect();
                const account = await AlgoSigner.accounts({
                    //TODO: change to mainnet
                    ledger: "TestNet",
                  });
                  console.log("Connected account: " + account[0]["address"]);
                setConnected(true);
            } catch (e) {
            }
          } else {
            setConnected(false);
          }
      };
      

    return (
        <Button onClick={ConnectAlgoSigner}> {connected ? "Connected" : "Connect AlgoSigner"}</Button>
    );
}

export default ConnectButton;