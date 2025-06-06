import React, { useState } from "react";
import { MerkleTree } from "merkletreejs";
import { keccak256 } from "js-sha3";
import { useMetaMask } from "./MetaMaskContext";
import { BrowserProvider, ContractFactory } from "ethers";
import FeedbackCoinJson from "./FeedbackCoin.json";

const CreateClass: React.FC = () => {
  const [className, setClassName] = useState("");
  const [studentKeys, setStudentKeys] = useState("");
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const { account } = useMetaMask();

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
      // 1. Build Merkle Tree
      const tree = new MerkleTree(rawKeys, keccak256, { sortPairs: true });
      const root = tree.getHexRoot();

      // 2. Generate encryption keypair
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

      // 3. Deploy contract
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const factory = new ContractFactory(
        FeedbackCoinJson.abi,
        FeedbackCoinJson.bytecode,
        signer
      );

      const contract = await factory.deploy(root, pubKeyB64);
      await contract.waitForDeployment();
      const deployedAddress = await contract.getAddress();
      
      setContractAddress(deployedAddress);
      setSecretKey(privKeyB64);

      // 4. Store to backend
      await fetch("http://localhost:3001/api/store-tree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          className,
          root,
          leaves: rawKeys,
          classAddress: deployedAddress,
        }),
      });

      await fetch("http://localhost:3001/api/add-user-class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: account,
          className,
          contractAddress: deployedAddress,
          role: "teacher",
        }),
      });

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

      {contractAddress && (
        <div style={{ marginTop: "2rem" }}>
          <p><strong>Contract Address:</strong></p>
          <code>{contractAddress}</code>
        </div>
      )}

      {secretKey && (
        <div style={{ marginTop: "2rem" }}>
          <button
            onClick={() => setShowSecret(!showSecret)}
            style={{ padding: "0.5rem 1rem", fontSize: "1rem", cursor: "pointer" }}
          >
            {showSecret ? "Hide" : "Show"} Decryption Private Key
          </button>
          {showSecret && (
            <textarea
              readOnly
              value={secretKey}
              style={{ marginTop: "1rem", width: "60%", height: "150px", fontSize: "0.9rem" }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default CreateClass;
