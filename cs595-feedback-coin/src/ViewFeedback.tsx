// src/ViewFeedback.tsx
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { ethers } from "ethers";
import CryptoJS from "crypto-js"; // Make sure to install with `npm install crypto-js`
import FeedbackCoinJson from "./FeedbackCoin.json";

const ViewFeedback: React.FC = () => {
  const location = useLocation();
  const { contractAddress } = location.state || {};

  const [secretKey, setSecretKey] = useState("");
  const [decryptedFeedback, setDecryptedFeedback] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRetrieve = async () => {
    if (!contractAddress || !secretKey) {
      setError("Contract address or decryption key missing.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        FeedbackCoinJson.abi,
        signer
      );

      const feedbackCount = await contract.getFeedbackCount();
      const encryptedFeedbacks = [];

      for (let i = 0; i < feedbackCount; i++) {
        const fb = await contract.getFeedback(i); // Assume this returns an encrypted string
        encryptedFeedbacks.push(fb);
      }

      const decrypted = encryptedFeedbacks.map((cipherText) => {
        //probably need to do a different form of decryption
        try {
          const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
          const originalText = bytes.toString(CryptoJS.enc.Utf8);
          return originalText || "[Decryption failed]";
        } catch (err) {
          return "[Decryption error]";
        }
      });

      setDecryptedFeedback(decrypted);
    } catch (err) {
      console.error("Error retrieving or decrypting feedback:", err);
      setError("Error fetching or decrypting feedback. Check the key and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!contractAddress) {
    return <p>Error: No contract address provided.</p>;
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Feedback for Contract</h1>
      <p><strong>Address:</strong> {contractAddress}</p>

      <div style={{ marginTop: "2rem" }}>
        <input
          type="password"
          placeholder="Enter decryption key"
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
          style={{ width: "100%", padding: "0.5rem", fontSize: "1rem" }}
        />
        <button
          onClick={handleRetrieve}
          style={{
            marginTop: "1rem",
            padding: "0.6rem 1.2rem",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Retrieve & Decrypt Feedback
        </button>
      </div>

      {loading && <p>Loading feedback...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {decryptedFeedback.length > 0 && (
        <ul style={{ marginTop: "2rem" }}>
          {decryptedFeedback.map((fb, idx) => (
            <li key={idx} style={{ marginBottom: "1rem" }}>
              {fb}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ViewFeedback;
