import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { keccak256 } from "js-sha3";
import { MerkleTree } from "merkletreejs";
import { ethers } from "ethers";
import FeedbackCoinJson from "./FeedbackCoin.json";

const SubmitFeedback: React.FC = () => {
  const { state } = useLocation();
  const contractAddress = state?.contractAddress;
  const [feedback, setFeedback] = useState("");
  const [oldCommitment, setOldCommitment] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  

  const handleSubmit = async () => {
    if (!feedback.trim() || !oldCommitment.trim() || !contractAddress) {
      alert("Missing information.");
      return;
    }

    // 1. Prepare the new private/public commitment
    const array = new Uint32Array(8);
    window.crypto.getRandomValues(array);
    const secretBigInt = BigInt("0x" + Array.from(array).map(x => x.toString(16).padStart(8, "0")).join(""));
    const secretHex = "0x" + secretBigInt.toString(16);
  
    const hash = keccak256(ethers.getBytes(secretHex));
    const hashHex = "0x" + hash;
  
    setSecret(secretHex);

    try {
      // 2. Connect to the contract
      const provider = new ethers.BrowserProvider(window.ethereum); 
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, FeedbackCoinJson.abi, signer);

      // 3. Fetch Merkle root from contract
      const contractRoot = await contract.classRoot();

      // 4. Fetch Merkle tree data from backend
      const res = await fetch(`http://localhost:3001/api/get-tree/${contractRoot}`);
      const data = await res.json();

      // 5. Reconstruct tree and generate proof
      const leaves = data.leaves;
      const hashedOldCommit = "0x" + keccak256(ethers.getBytes(oldCommitment));
      const index = leaves.findIndex((leaf: string) => leaf === hashedOldCommit);
      if (index === -1) {
        alert("Old commitment not found in tree.");
        return;
      }
      leaves[index] = hashHex;
      const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
      const newRoot = "0x" + tree.getRoot().toString("hex");
      const proof = tree.getHexProof(hashHex);

      // 6. Starting to encrypt the message
      const publicKey = await contract.encryptionPublicKey();
      function base64ToArrayBuffer(b64: string): ArrayBuffer {
        const binaryString = atob(b64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
      }
      
      // 7. Import public key
      const publicKeyBuffer = base64ToArrayBuffer(publicKey);
      const cryptoKey = await window.crypto.subtle.importKey(
        "spki",
        publicKeyBuffer,
        {
          name: "RSA-OAEP",
          hash: "SHA-256",
        },
        false,
        ["encrypt"]
      );
      
      // 8. Encrypt
      const encoder = new TextEncoder();
      const encoded = encoder.encode(feedback);
      
      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: "RSA-OAEP",
        },
        cryptoKey,
        encoded
      );

      function arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      }
      
      const encryptedBase64 = arrayBufferToBase64(encrypted);

      const response = await fetch("http://localhost:3001/api/relay-send-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: encryptedBase64,
          oldCommitment,
          newCommitment: hashHex,
          proof,
          newRoot,
          contractAddress,
          index
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert(`✅ Message submitted via relayer!! Tx: ${result.txHash}`);
        setFeedback("");
        setOldCommitment("");
      } else {
        alert("❌ Failed to collect coin via relayer: " + result.error);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Failed to submit feedback.");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "10vh" }}>
      <h2>Submit Feedback</h2>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Write your feedback here..."
        style={{ width: "60%", height: "150px", fontSize: "1rem", marginTop: "1rem" }}
      />
      <br />
      <input
        type="text"
        placeholder="Enter old commitment"
        value={oldCommitment}
        onChange={(e) => setOldCommitment(e.target.value)}
        style={{
          width: "60%",
          padding: "1rem",
          fontSize: "1rem",
          marginTop: "1rem",
        }}
      />
      <br />
      <button
        onClick={handleSubmit}
        style={{ marginTop: "1rem", padding: "0.75rem 2rem", fontSize: "1.2rem", cursor: "pointer" }}
      >
        Submit
      </button>
      {secret && (
      <div style={{ marginTop: "1.5rem" }}>
        <button
          onClick={() => setShowSecret((prev) => !prev)}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "1rem",
            cursor: "pointer",
            marginBottom: "1rem",
          }}
        >
          {showSecret ? "Hide Secret" : "Show Secret"}
        </button>

        {showSecret && (
          <input
            type="text"
            readOnly
            value={secret}
            style={{
              width: "80%",
              padding: "0.8rem",
              fontSize: "1rem",
              backgroundColor: "#f0f0f0",
              border: "1px solid #ccc",
              borderRadius: "5px",
            }}
          />
        )}
      </div>
    )}

    </div>
  );
};

export default SubmitFeedback;
