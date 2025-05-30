/* eslint-disable @typescript-eslint/no-explicit-any */
import { Address, PublicKey } from "@emurgo/cardano-serialization-lib-asmjs";
import { Buffer } from "buffer";
import { useState } from "react";

interface Extension {
  cip: number;
}

export interface EnableExtensionPayload {
  extensions: Extension[];
}

export interface Protocol {
  block_id: number;
  coins_per_utxo_size: number;
  collateral_percent: number;
  committee_max_term_length: number;
  committee_min_size: number;
  cost_model_id: number;
  decentralisation: number;
  drep_activity: number;
  drep_deposit: number;
  dvt_committee_no_confidence: number;
  dvt_committee_normal: number;
  dvt_hard_fork_initiation: number;
  dvt_motion_no_confidence: number;
  dvt_p_p_economic_group: number;
  dvt_p_p_gov_group: number;
  dvt_p_p_network_group: number;
  dvt_p_p_technical_group: number;
  dvt_treasury_withdrawal: number;
  dvt_update_to_constitution: number;
  epoch_no: number;
  extra_entropy: any;
  gov_action_deposit: number;
  gov_action_lifetime: number;
  id: number;
  influence: number;
  key_deposit: number;
  max_bh_size: number;
  max_block_ex_mem: number;
  max_block_ex_steps: number;
  max_block_size: number;
  max_collateral_inputs: number;
  max_epoch: number;
  max_tx_ex_mem: number;
  max_tx_ex_steps: number;
  max_tx_size: number;
  max_val_size: number;
  min_fee_a: number;
  min_fee_b: number;
  min_pool_cost: number;
  min_utxo_value: number;
  monetary_expand_rate: number;
  nonce: string;
  optimal_pool_count: number;
  pool_deposit: number;
  price_mem: number;
  price_step: number;
  protocol_major: number;
  protocol_minor: number;
  pvt_committee_no_confidence: number;
  pvt_committee_normal: number;
  pvt_hard_fork_initiation: number;
  pvt_motion_no_confidence: number;
  treasury_growth_rate: number;
}

export interface CardanoApiWallet {
  experimental: any;
  cip95: {
    getPubDRepKey(): Promise<string>;
    getRegisteredPubStakeKeys(): Promise<string[]>;
    getUnregisteredPubStakeKeys(): Promise<string[]>;
    signData(address: string, payload: string): Promise<any>;
  };
  isEnabled(): Promise<boolean>;
  getBalance(): Promise<string>;
  getUtxos(): Promise<string[]>;
  getCollateral?(): Promise<string[]>;
  getUsedAddresses(): Promise<string[]>;
  getUnusedAddresses(): Promise<string[]>;
  getChangeAddress(): Promise<string>;
  getRewardAddresses(): Promise<string[]>;
  getNetworkId(): Promise<number>;
  signData(arg0: any, arg1?: any): Promise<any>;
  signTx(arg0: any, arg1?: any): Promise<any>;
  submitTx(arg0: any): Promise<any>;
  onAccountChange(arg0: (addresses: string) => void): Promise<void>;
  onNetworkChange(arg0: (network: number) => void): Promise<void>;
  getActivePubStakeKeys(): Promise<string[]>;
  getExtensions(): Promise<Extension[]>;
}

export interface CardanoBrowserWallet {
  apiVersion: string;
  enable(extensions?: EnableExtensionPayload): Promise<CardanoApiWallet>;
  icon: string;
  isEnabled(): Promise<boolean>;
  name: string;
  supportedExtensions: Extension[];
}

declare global {
  interface Window {
    cardano: {
      [key: string]: CardanoBrowserWallet;
    };
  }
}

function App() {
  const [walletApi, setWalletApi] = useState<CardanoApiWallet | null>(null);
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
                          addressFromBytes.network_id() == 0
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
                  const payloadHex = Buffer.from(payload, "utf-8").toString(
                    "hex"
                  );
                  await walletApi.cip95
                    .signData(publicKey, payloadHex)
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
