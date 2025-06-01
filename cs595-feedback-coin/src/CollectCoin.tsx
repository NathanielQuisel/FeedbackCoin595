import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { ethers } from "ethers";
import { keccak256 } from "js-sha3";
import { MerkleTree } from "merkletreejs";

//NEED TO CHANGE TO ACTUAL FUNCTION HEADER
const contractABI = ["/* insert your contract ABI here */"];

const CollectCoin: React.FC = () => {
  const [password, setPassword] = useState("");
  const location = useLocation();
  const contractAddress = location.state?.contractAddress;

  
const handleSubmit = async () => {
    if (!password.trim()) {
      alert("Please enter the daily password.");
      return;
    }
  
    try {
      // 1. Connect to MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const hashedAddress = keccak256(userAddress.replace(/^0x/, ""));
  
      // 2. Hash the password
      const hashedPassword = keccak256(password);
  
      // 3. Get contract
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const contractRoot = await contract.merkleRoot(); // Or whatever the getter is
  
      // 4. Get tree from backend
      const res = await fetch(`http://localhost:3001/api/get-tree/${contractRoot}`);
      const data = await res.json();
  
      const leaves = data.leaves.map((leaf: string) => Buffer.from(leaf.replace(/^0x/, ""), "hex"));
      const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  
      // 5. Find user leaf
      //this definitely might not work right now
      const userLeaf = Buffer.from(hashedAddress, "hex");
      const proof = tree.getHexProof(userLeaf);
  
      // 6. Submit to contract
      const tx = await contract.collectCoin(hashedPassword, proof);
      await tx.wait();
  
      alert("✅ Coin collected!");
      setPassword("");
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
