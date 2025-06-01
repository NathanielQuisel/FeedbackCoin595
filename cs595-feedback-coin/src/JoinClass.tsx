import React, { useState } from "react";
// import { ethers } from "ethers";
// import { MerkleTree } from "merkletreejs";
import { keccak256 } from "js-sha3";
import { useClassContext } from "./ClassContext";

const JoinClass: React.FC = () => {
  const [contractAddress, setContractAddress] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [proof, setProof] = useState<string[] | null>(null);
  const { addJoinedClass } = useClassContext();
  const [className, setClassName] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [commitment, setCommitment] = useState<string | null>(null);
  const [inputCommitment, setInputCommitment] = useState("");


  const handleJoinClass = async () => {
    
    setStatus(null);
    setProof(null);

    // if (!ethers.isAddress(contractAddress)) {
    //   setStatus("❌ Invalid Ethereum address.");
    //   return;
    // }

    try {
      
      
      // Step 1: Get contract code to ensure it exists
    //   const provider = new ethers.BrowserProvider(window.ethereum);
    //   const code = await provider.getCode(contractAddress);
    //   if (code === "0x") {
    //     setStatus("❌ No contract found at this address.");
    //     return;
    //   }
        
      // Step 2: Fetch all Merkle trees from the backend
      const res = await fetch("http://localhost:3001/api/trees");
      const trees = await res.json();
      
      // Step 3: Find Merkle tree matching the given contract address
      const matchedTree = trees.find((t: any) => t.root.toLowerCase() === contractAddress.toLowerCase());
      if (!matchedTree) {
        setStatus("❌ No Merkle tree found for this contract address.");
        return;
      }

      // Step 4: Get user address from MetaMask
      if (!inputCommitment.startsWith("0x") || inputCommitment.length !== 66) {
        setStatus("❌ Please enter a valid 32-byte commitment hash (0x-prefixed).");
        return;
      }
      
      const leafHex = inputCommitment.toLowerCase();
      
      if (!matchedTree.leaves.includes(leafHex)) {
        setStatus("❌ Commitment hash not found in the Merkle tree.");
        return;
      }      
      alert("what is up")

    //   // Step 6: Reconstruct the Merkle tree to generate proof
    //   const leavesBuffers = matchedTree.leaves.map((leaf: string) => Buffer.from(leaf.slice(2), "hex"));
    //   const merkleTree = new MerkleTree(leavesBuffers, keccak256, { sortPairs: true });

    //   const merkleProof = merkleTree.getHexProof(userHash);
    //   setProof(merkleProof);

    //   setStatus("✅ Joined class and generated Merkle proof.");
    //   console.log("Merkle Proof:", merkleProof);

      if (!className.trim()) {
        setStatus("❌ Please enter a class name.");
        return;
      }

      addJoinedClass(className, contractAddress, "student");
      
    } catch (err) {
      console.error(err);
      alert(err);
      setStatus("❌ Failed to join class or generate proof.");
    }
  };

  const generateCommitment = () => {
    const array = new Uint32Array(8);
    window.crypto.getRandomValues(array);
    const secretBigInt = BigInt("0x" + Array.from(array).map(x => x.toString(16).padStart(8, "0")).join(""));
    const secretHex = "0x" + secretBigInt.toString(16);
  
    const hash = keccak256(secretHex); // REPLACE this with Poseidon if using Semaphore correctly
    const hashHex = "0x" + hash;
  
    setSecret(secretHex);
    setCommitment(hashHex);
  };
  

  return (
    <div style={{ textAlign: "center", marginTop: "10vh" }}>
      <h2>Join a Class</h2>
      <input
        type="text"
        placeholder="Enter class name"
        value={className}
        onChange={(e) => setClassName(e.target.value)}
        style={{ width: "100%", padding: "1rem", fontSize: "1rem", marginTop: "1rem" }}
        />
      <input
        type="text"
        placeholder="Enter class contract address"
        value={contractAddress}
        onChange={(e) => setContractAddress(e.target.value)}
        style={{ width: "100%", padding: "1rem", fontSize: "1rem", marginTop: "1rem" }}
      />
      <input
        type="text"
        placeholder="Enter your commitment hash"
        value={inputCommitment}
        onChange={(e) => setInputCommitment(e.target.value)}
        style={{ width: "100%", padding: "1rem", fontSize: "1rem", marginTop: "1rem" }}
        />


      <br />
      <button
        onClick={handleJoinClass}
        style={{ marginTop: "1rem", padding: "0.75rem 2rem", fontSize: "1.2rem", cursor: "pointer" }}
      >
        Join Class
      </button>

      {status && (
        <p style={{ marginTop: "1rem", fontWeight: "bold", color: status.includes("✅") ? "green" : "red" }}>
          {status}
        </p>
      )}

      {proof && (
        <div style={{ marginTop: "2rem" }}>
          <p><strong>Your Merkle Proof:</strong></p>
          <code style={{ wordBreak: "break-word", whiteSpace: "pre-wrap" }}>{JSON.stringify(proof, null, 2)}</code>
        </div>
      )}

        <button
        onClick={generateCommitment}
        style={{ marginTop: "2rem", padding: "0.75rem 2rem", fontSize: "1rem", cursor: "pointer" }}
        >
        Generate Identity Commitment
        </button>

        {secret && commitment && (
        <div style={{ marginTop: "1rem", wordBreak: "break-word" }}>
            <p><strong>Secret:</strong> {secret}</p>
            <p><strong>Commitment (Hash):</strong> {commitment}</p>
        </div>
        )}
    </div>
  );
};

export default JoinClass;
