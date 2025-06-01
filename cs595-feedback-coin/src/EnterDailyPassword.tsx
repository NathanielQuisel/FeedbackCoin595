// src/EnterDailyPassword.tsx
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { ethers } from "ethers";
import { keccak256 } from "js-sha3";

// Define your contract ABI
//WILL NEED TO CHANGE TO MATCH THE ACTUAL FUNCTION HEADER
const contractABI = [
    "function submitDailyPassword(string memory password) public"
];

const EnterDailyPassword: React.FC = () => {
    const [password, setPassword] = useState("");
    const location = useLocation();
    const classAddress = (location.state as { classAddress: string })?.classAddress;
  
    const handleSubmit = async () => {
      if (!password.trim()) {
        alert("Please enter a password.");
        return;
      }
  
      if (!classAddress) {
        alert("Missing class contract address.");
        return;
      }
  
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const hashedPassword = keccak256(password);
        const contract = new ethers.Contract(classAddress, contractABI, signer);
  
        const tx = await contract.submitDailyPassword(hashedPassword);
        await tx.wait();
  
        alert("✅ Password submitted to smart contract!");
      } catch (err) {
        console.error("Contract call failed:", err);
        alert("❌ Failed to submit password.");
      }
  
      setPassword("");
    };
  
    return (
      <div style={{ textAlign: "center", marginTop: "10vh" }}>
        <h2>Enter Daily Password</h2>
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

export default EnterDailyPassword;
