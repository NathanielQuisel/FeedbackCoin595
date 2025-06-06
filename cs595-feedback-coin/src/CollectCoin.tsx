import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { ethers } from "ethers";
import { keccak256 } from "js-sha3";
import { MerkleTree } from "merkletreejs";
import FeedbackCoinJson from "./FeedbackCoin.json";

const CollectCoin: React.FC = () => {
  const [password, setPassword] = useState("");
  const [oldCommitment, setOldCommitment] = useState("");
  const location = useLocation();
  const contractAddress = location.state?.contractAddress;
  const [secret, setSecret] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  
const handleSubmit = async () => {

    if (!password.trim()) {
      alert("Please enter the daily password.");
      return;
    }

    if (!oldCommitment.trim()) {
      alert("Please enter your old commitment.");
      return;
    }

    //prepare the new S/P commitment
    const array = new Uint32Array(8);
    window.crypto.getRandomValues(array);
    const secretBigInt = BigInt("0x" + Array.from(array).map(x => x.toString(16).padStart(8, "0")).join(""));
    const secretHex = "0x" + secretBigInt.toString(16);
  
    const hash = keccak256(ethers.getBytes(secretHex));
    const hashHex = "0x" + hash;
  
    setSecret(secretHex);
  
    try {
      // 1. Connect to MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum); 
      const signer = await provider.getSigner();
  
      // 2. Get contract
      const contract = new ethers.Contract(contractAddress, FeedbackCoinJson.abi, signer);
      const contractRoot = await contract.classRoot(); // might need to change this to the proper thing
  
      // 3. Get tree from backend
      const res = await fetch(`http://localhost:3001/api/get-tree/${contractRoot}`);
      const data = await res.json();
      const leaves = data.leaves;
      const hashedOldCommit = "0x" + keccak256(ethers.getBytes(oldCommitment));
      
      // 5. Replace old commitment
      const index = leaves.findIndex((leaf:string) => leaf === hashedOldCommit);
      if (index === -1) {
        alert("Old commitment not found in tree.");
        return;
      }
      leaves[index] = hashHex;

      // 6. Rebuild tree
      const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
      const newRoot = "0x" + tree.getRoot().toString("hex");
      const proof = tree.getHexProof(hashHex); 

      // 7. Submit to node.js backend which submits to contract
      const response = await fetch("http://localhost:3001/api/relay-collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          oldCommitment,
          newCommitment: hashHex,
          proof,
          newRoot,
          contractAddress,
          index,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert(`✅ Coin collected via relayer! Tx: ${result.txHash}`);
        setPassword("");
        setOldCommitment("");
      } else {
        alert("❌ Failed to collect coin via relayer: " + result.error);
        console.error("failed",result.error);
      }      
    } catch (err) {
      console.error("Error collecting coin:", err);
      alert("❌ Failed to collect coin");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "10vh" }}>
      <h2>Collect Daily Coin</h2>
      <input
        type="text"
        placeholder="Enter daily password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          width: "60%",
          padding: "1rem",
          fontSize: "1rem",
          marginTop: "1rem",
        }}
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
        style={{
          marginTop: "1rem",
          padding: "0.75rem 2rem",
          fontSize: "1.2rem",
          cursor: "pointer",
        }}
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

export default CollectCoin;
