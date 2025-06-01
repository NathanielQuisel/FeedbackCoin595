// src/CreateClass.tsx
import React, { useState } from "react";
import { MerkleTree } from "merkletreejs";
import { keccak256 } from "js-sha3";
import { useMetaMask } from "./MetaMaskContext"; // get user's address
import { BrowserProvider } from "ethers";
import { ContractFactory } from "ethers";
import FeedbackCoinJson from "./FeedbackCoin.json"; // Adjust path


const CreateClass: React.FC = () => {
  const [className, setClassName] = useState("");
  const [studentKeys, setStudentKeys] = useState("");
  const [merkleRoot, setMerkleRoot] = useState<string | null>(null);
  const { account } = useMetaMask(); // get connected account

  const handleCreateClass = async () => {
    const rawKeys = studentKeys
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k);
  
    if (!className.trim()) {
      alert("Please enter a class name.");
      return;
    }
  
    if (!account || !window.ethereum) {
      alert("Please connect MetaMask first.");
      return;
    }
  
    if (rawKeys.length === 0) {
      alert("Please enter at least one public key.");
      return;
    }
  
    try {
      // 🌳 Step 1: Build Merkle Tree
      const leaves = rawKeys.map((key) => keccak256(key.replace(/^0x/, "")));
      const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
      const root = tree.getHexRoot();
      setMerkleRoot(root);
  
      // 🔐 Step 2: Generate encryption keypair (using SubtleCrypto)
      const cryptoKeyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
      );
  
      const exportedPublicKey = await window.crypto.subtle.exportKey("spki", cryptoKeyPair.publicKey);
      const exportedPrivateKey = await window.crypto.subtle.exportKey("pkcs8", cryptoKeyPair.privateKey);
  
      const pubKeyB64 = btoa(String.fromCharCode(...new Uint8Array(exportedPublicKey)));
      const privKeyB64 = btoa(String.fromCharCode(...new Uint8Array(exportedPrivateKey)));
  
      // 🧾 Step 3: Deploy contract to Sepolia using ethers.js
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
  
      const factory = new ContractFactory(
        FeedbackCoinJson.abi,
        FeedbackCoinJson.bytecode,
        signer
      );
  
      const contract = await factory.deploy(root, pubKeyB64);
      await contract.waitForDeployment();

      const contractAddress = await contract.getAddress(); 
      console.log("Deployed to:", contractAddress);

  
      // ✅ Step 4: Store to backend (optional)
      await fetch("http://localhost:3001/api/store-tree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          className,
          root,
          leaves: leaves.map((leaf) => "0x" + leaf.toString()),
          creatorAddress: account,
        }),
      });
  
      await fetch("http://localhost:3001/api/add-user-class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: account,
          className,
          contractAddress: contractAddress,
          role: "teacher",
        }),
      });
  
      alert(`Class created!\n\nContract address: ${contractAddress}\n\nDecryption Private Key:\n${privKeyB64}`);
    } catch (err) {
      console.error("Error creating class:", err);
      alert("Error creating class. Check console.");
    }
  };
  

  return (
    <div style={{ textAlign: "center", marginTop: "10vh" }}>
      <h2>Create a New Class</h2>

      <input
        type="text"
        placeholder="Enter class name"
        value={className}
        onChange={(e) => setClassName(e.target.value)}
        style={{ width: "60%", padding: "0.75rem", fontSize: "1rem", marginBottom: "1rem" }}
      />
      <br />

      <textarea
        placeholder="Enter student public keys, separated by commas"
        value={studentKeys}
        onChange={(e) => setStudentKeys(e.target.value)}
        cols={100}
        style={{ width: "60%", height: "150px", fontSize: "1rem" }}
      />
      <br />

      <button
        onClick={handleCreateClass}
        style={{ marginTop: "1rem", padding: "0.75rem 2rem", fontSize: "1.2rem", cursor: "pointer" }}
      >
        Create Class
      </button>

      {merkleRoot && (
        <div style={{ marginTop: "2rem" }}>
          <p><strong>Merkle Root:</strong></p>
          <code>{merkleRoot}</code>
        </div>
      )}
    </div>
  );
};

export default CreateClass;
