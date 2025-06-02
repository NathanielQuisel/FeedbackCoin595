import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useMetaMask } from "./MetaMaskContext"; // Assuming you have this hook
import { keccak256 } from "js-sha3";
import { MerkleTree } from "merkletreejs";
import { ethers } from "ethers";
import FeedbackCoinJson from "./FeedbackCoin.json";

const SubmitFeedback: React.FC = () => {
  const { state } = useLocation();
  const contractAddress = state?.contractAddress;
  const { account, provider } = useMetaMask();
  const [feedback, setFeedback] = useState("");
  const [oldCommitment, setOldCommitment] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [commitment, setCommitment] = useState<string | null>(null);
  

  const handleSubmit = async () => {
    if (!feedback.trim() || !oldCommitment.trim() || !account || !provider || !contractAddress) {
      alert("Missing information.");
      return;
    }

    //prepare the new S/P commitment
    const array = new Uint32Array(8);
    window.crypto.getRandomValues(array);
    const secretBigInt = BigInt("0x" + Array.from(array).map(x => x.toString(16).padStart(8, "0")).join(""));
    const secretHex = "0x" + secretBigInt.toString(16);
  
    const hash = keccak256(secretHex); // REPLACE this with Poseidon if using Semaphore correctly
    const hashHex = "0x" + hash;
  
    setSecret(secretHex);
    setCommitment(hashHex);

    const newCommitmentBuf = Buffer.from(hashHex.replace(/^0x/, ""), "hex");

    try {
      // 1. Connect to the contract
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, FeedbackCoinJson.abi, signer);

      // 2. Fetch Merkle root from contract
      const contractRoot = await contract.classRoot(); // might need to change this to the proper thing

      // 3. Fetch Merkle tree data from backend
      const res = await fetch(`http://localhost:3001/api/get-tree/${contractRoot}`);
      const data = await res.json();
      // const treeData = trees.find((t: any) => t.root === contractRoot);
      // if (!treeData) throw new Error("Merkle tree not found on server");

      // 4. Reconstruct tree and generate proof
      const leaves: Buffer[] = data.leaves.map((leaf: string) =>
        Buffer.from(leaf.replace(/^0x/, ""), "hex")
      );
      // const leaves = treeData.leaves.map((addr: string) => keccak256(addr));
      const oldCommitmentBuf = Buffer.from(oldCommitment.replace(/^0x/, ""), "hex");
      const index = leaves.findIndex(leaf => leaf.equals(oldCommitmentBuf));
      if (index === -1) {
        alert("Old commitment not found in tree.");
        return;
      }
      leaves[index] = newCommitmentBuf;

      const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
      const newRoot = "0x" + tree.getRoot().toString("hex");
      const proof = tree.getHexProof(newCommitmentBuf);

      // 5. Sign the message
      // const messageHash = ethers.hashMessage(feedback);
      // const signature = await signer.signMessage(feedback);

      // 6. Encrypt the message
      const publicKey = await contract.encryptionPublicKey(); // Assumed function
      const encrypted = await window.ethereum.request({
        method: "eth_encrypt",
        params: [publicKey, JSON.stringify({ message: feedback })],
      });

      const response = await fetch("http://localhost:3001/api/relay-collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encrypted,
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
        setFeedback("");
        setOldCommitment("");
        setCommitment(null);
        setSecret(null);
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
    </div>
  );
};

export default SubmitFeedback;
