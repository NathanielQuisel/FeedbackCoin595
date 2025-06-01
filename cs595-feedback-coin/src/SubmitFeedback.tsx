import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useMetaMask } from "./MetaMaskContext"; // Assuming you have this hook
import { keccak256 } from "js-sha3";
import { MerkleTree } from "merkletreejs";
import { ethers } from "ethers";
// import abi from "./abis/YourContract.json"; // Replace with actual path

const SubmitFeedback: React.FC = () => {
  const { state } = useLocation();
  const contractAddress = state?.contractAddress;
  const { account, provider } = useMetaMask();
  const [feedback, setFeedback] = useState("");

  const handleSubmit = async () => {
    if (!feedback.trim() || !account || !provider || !contractAddress) {
      alert("Missing information.");
      return;
    }

    try {
      // 1. Connect to the contract
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, "hello", signer);
      //NEED to replace the "hello" with the ABI, or the function headers of the contract

      // 2. Fetch Merkle root from contract
      const onChainRoot = await contract.merkleRoot();

      // 3. Fetch Merkle tree data from backend
      const res = await fetch("http://localhost:3001/api/get-trees");
      const trees = await res.json();
      const treeData = trees.find((t: any) => t.root === onChainRoot);
      if (!treeData) throw new Error("Merkle tree not found on server");

      // 4. Reconstruct tree and generate proof
      const leaves = treeData.leaves.map((addr: string) => keccak256(addr));
      const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
      const leaf = keccak256(account);
      const proof = tree.getHexProof(leaf);

      // 5. Sign the message
      const messageHash = ethers.hashMessage(feedback);
      const signature = await signer.signMessage(feedback);

      // 6. Encrypt the message
      const publicKey = await contract.encryptKey(); // Assumed function
      const encrypted = await window.ethereum.request({
        method: "eth_encrypt",
        params: [publicKey, JSON.stringify({ message: feedback })],
      });

      // 7. Submit to the smart contract
      const tx = await contract.sendFeedback(encrypted, proof, signature);
      await tx.wait();

      alert("✅ Feedback sent!");
      setFeedback("");
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
      <button
        onClick={handleSubmit}
        style={{ marginTop: "1rem", padding: "0.75rem 2rem", fontSize: "1.2rem", cursor: "pointer" }}
      >
        Submit
      </button>
    </div>
  );
};

export default SubmitFeedback;
