import { Address, PublicKey } from "@emurgo/cardano-serialization-lib-asmjs";
import { Buffer } from "buffer";
import React from "react";
import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);
  const [walletApi, setWalletApi] = useState(null);
  const [payload, setPayload] = useState("");
  const [signature, setSignature] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [publicKey, setPublicKey] = useState("");

  const disconnect = () => {
    setWalletApi(null);
    setWalletAddress("");
    setPublicKey("");
    setSignature("");
    setPayload("");
  };

  return (
    <div
      style={{
        justifyContent: "center",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <h1>CIP-30 Wallet Payload Signer</h1>
      <p>
        This is a simple example of a Cardano wallet payload signer using the
        CIP-30 standard. It allows you to interact with Cardano wallets that
        support this standard.
      </p>
      <p>Available wallets</p>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "16px",
          justifyContent: "center",
        }}
      >
        {window.cardano &&
          Object.entries(window.cardano).map(([name, wallet]) => (
            <div key={name}>
              <h2>{name}</h2>
              <img
                style={{
                  width: "50px",
                  height: "50px",
                }}
                src={wallet.icon}
                alt={`${name} icon`}
              />
              <p>API Version:</p>
              <p>{wallet.apiVersion}</p>
              <button
                onClick={
                  walletApi
                    ? disconnect
                    : async () => {
                        const enabled = await wallet.enable({
                          extensions: [{ cip: 95 }],
                        });

                        // Payment address
                        const rawAddress = await enabled.getChangeAddress();
                        const addressFromBytes = Address.from_bytes(
                          Buffer.from(rawAddress, "hex")
                        );
                        const address = addressFromBytes.to_bech32(
                          addressFromBytes.network_id == 0
                            ? "addr"
                            : "addr_test"
                        );
                        setWalletAddress(address);

                        // Public key
                        const registeredPubStakeKeys =
                          await enabled.cip95.getRegisteredPubStakeKeys();
                        if (registeredPubStakeKeys.length < 1) {
                          console.error("No public stake keys registered");
                          return;
                        } else {
                          setPublicKey(
                            PublicKey.from_hex(registeredPubStakeKeys[0])
                              .hash()
                              .to_hex()
                          );
                        }

                        setWalletApi(enabled);
                        console.log(`${name} enabled`, enabled);
                      }
                }
              >
                {walletApi ? "disconnect" : `Enable ${name}`}
              </button>
            </div>
          ))}
      </div>
      {walletAddress && <p>Your wallet address: {walletAddress}</p>}
      {publicKey && <p>Your public key: {publicKey}</p>}
      {walletApi && publicKey && (
        <>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (walletApi) {
                try {
                  console.log({ payload, walletApi });
                  await walletApi.cip95
                    .signData(walletAddress, JSON.stringify(payload))
                    .then((signature) => {
                      console.log("Signature:", signature);
                      setSignature(signature);
                    });
                } catch (error) {
                  console.error("Something went wrong", error);
                }
              } else {
                console.error("No wallet API available");
              }
            }}
          >
            <textarea
              style={{ width: "100%", height: "200px" }}
              placeholder="Enter data to be signed here"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
            />
            <button type="submit">Sign Payload</button>
          </form>

          <p>
            Signature: <pre>{signature}</pre>
          </p>
        </>
      )}
    </div>
  );
}

export default App;
