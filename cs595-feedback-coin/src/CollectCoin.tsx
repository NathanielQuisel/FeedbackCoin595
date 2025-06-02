import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { ethers } from "ethers";
import { keccak256 } from "js-sha3";
import { MerkleTree } from "merkletreejs";
import FeedbackCoinJson from "./FeedbackCoin.json";

//NEED TO CHANGE TO ACTUAL FUNCTION HEADER
// const contractABI = ["/* insert your contract ABI here */"];

const CollectCoin: React.FC = () => {
  const [password, setPassword] = useState("");
  const [oldCommitment, setOldCommitment] = useState("");
  const location = useLocation();
  const contractAddress = location.state?.contractAddress;
  //still need to display the new secret at the bottom after the transaction is successful
  const [secret, setSecret] = useState<string | null>(null);
  const [commitment, setCommitment] = useState<string | null>(null);

  
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
    // const generateCommitment = () => {
    const array = new Uint32Array(8);
    window.crypto.getRandomValues(array);
    const secretBigInt = BigInt("0x" + Array.from(array).map(x => x.toString(16).padStart(8, "0")).join(""));
    const secretHex = "0x" + secretBigInt.toString(16);
  
    const hash = keccak256(secretHex); // REPLACE this with Poseidon if using Semaphore correctly
    const hashHex = "0x" + hash;
  
    setSecret(secretHex);
    setCommitment(hashHex);

    const newCommitmentBuf = Buffer.from(hashHex.replace(/^0x/, ""), "hex");
  // };
  
    try {
      // 1. Connect to MetaMask
      //SHOULD probably change this to use the metamaskContext file to be consistent across files
      const provider = new ethers.BrowserProvider(window.ethereum); 
      const signer = await provider.getSigner();
      // const userAddress = await signer.getAddress();
      // const hashedAddress = keccak256(userAddress.replace(/^0x/, ""));
  
      // 2. Hash the password
      const hashedPassword = keccak256(password);
  
      // 3. Get contract
      const contract = new ethers.Contract(contractAddress, FeedbackCoinJson.abi, signer);
      const contractRoot = await contract.classRoot(); // might need to change this to the proper thing
  
      // 4. Get tree from backend
      const res = await fetch(`http://localhost:3001/api/get-tree/${contractRoot}`);
      const data = await res.json();
  
      const leaves: Buffer[] = data.leaves.map((leaf: string) =>
        Buffer.from(leaf.replace(/^0x/, ""), "hex")
      );      // const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
      const oldCommitmentBuf = Buffer.from(oldCommitment.replace(/^0x/, ""), "hex");
  
      // 6. Replace old commitment
      const index = leaves.findIndex(leaf => leaf.equals(oldCommitmentBuf));
      if (index === -1) {
        alert("Old commitment not found in tree.");
        return;
      }
      leaves[index] = newCommitmentBuf;

      // 7. Rebuild tree
      const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
      const newRoot = "0x" + tree.getRoot().toString("hex");
      const proof = tree.getHexProof(newCommitmentBuf);

      // 8. Submit to contract
      const response = await fetch("http://localhost:3001/api/relay-collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          oldCommitment,
          newCommitment: commitment,
          proof,
          newRoot,
          contractAddress,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert(`✅ Coin collected via relayer! Tx: ${result.txHash}`);
        setPassword("");
        setOldCommitment("");
        setCommitment(null);
        setSecret(null);
      } else {
        alert("❌ Failed to collect coin via relayer: " + result.error);
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
    </div>
  );
};

export default CollectCoin;
