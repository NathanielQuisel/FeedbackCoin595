// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const port = 3001;

let storedTrees = [];

app.use(cors());
app.use(bodyParser.json());

const userClasses = {}; // In-memory { [address]: [{ id, name, role }] }

const { ethers } = require("ethers");
const FeedbackCoinJson = require("../src/FeedbackCoin.json");

const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const relayerWallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);

app.post("/api/relay-collect", async (req, res) => {
  const {
    password,
    oldCommitment,
    newCommitment,
    proof,
    newRoot,
    contractAddress,
    index
  } = req.body;

  try {
    const contract = new ethers.Contract(contractAddress, FeedbackCoinJson.abi, relayerWallet);

    const tx = await contract.claim(
      password,
      proof,
      oldCommitment,
      newCommitment,
      newRoot
    );

    await tx.wait();

    const tree = storedTrees.find(t => t.classAddress === contractAddress);
    if (!tree) {
      return res.status(404).json({ error: "Merkle tree not found for contract" });
    }

    if (index < 0 || index >= tree.leaves.length) {
      return res.status(400).json({ error: "Invalid index" });
    }

    tree.leaves[index] = newCommitment;
    tree.root = newRoot;

    console.log(`Updated Merkle Tree for ${contractAddress}`);
    res.status(200).json({ message: "Success", txHash: tx.hash });
  } catch (err) {
    console.error("Relayer error:", err);
    res.status(500).json({ error: err.message });
  }
});


app.post("/api/relay-send-feedback", async (req, res) => {
  const { message, oldCommitment, newCommitment, proof, newRoot, contractAddress, index } = req.body;

  try {
    const contract = new ethers.Contract(contractAddress, FeedbackCoinJson.abi, relayerWallet);
    
    const tx = await contract.sendFeedback(
      message,
      proof,
      oldCommitment,
      newCommitment,
      newRoot
    );

    await tx.wait();
    const tree = storedTrees.find(t => t.classAddress === contractAddress);
    if (!tree) {
      return res.status(404).json({ error: "Merkle tree not found for contract" });
    }

    if (index < 0 || index >= tree.leaves.length) {
      return res.status(400).json({ error: "Invalid index" });
    }

    tree.leaves[index] = newCommitment;
    tree.root = newRoot;

    console.log(`Updated Merkle Tree for ${contractAddress}`);
    res.status(200).json({ message: "Success", txHash: tx.hash });
  } catch (err) {
    console.error("Relayer error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/add-user-class", (req, res) => {
    const { address, className, contractAddress, role } = req.body;

    if (!address || !className || !contractAddress || !role) {
        return res.status(400).json({ error: "Missing address, className, contractAddress, or role" });
    }

    if (!userClasses[address]) {
        userClasses[address] = [];
    }

    userClasses[address].push({
      id: Date.now(),
      name: className,
      contractAddress,
      role,
    });

    console.log(`Added class for ${address}:`, className);
    res.status(200).json({ message: "Class added successfully" });
});
  

app.get("/api/get-user-classes", (req,res) => {
    res.json(userClasses)
});

app.get("/api/get-user-classes/:address", (req, res) => {
  const address = req.params.address;
  res.json(userClasses[address] || []);
});

app.get("/", (req, res) => {
    res.send("Welcome to the Merkle Tree backend!");
  });  

app.post("/api/store-tree", (req, res) => {
  const { root, leaves, classAddress } = req.body;

  if (!root || !Array.isArray(leaves) || !classAddress) {
    return res.status(400).json({ error: "Invalid data" });
  }

  storedTrees.push({
    root,
    leaves,
    classAddress,
    timestamp: Date.now(),
  });

  console.log("Stored Merkle Tree:", { root, leaves, classAddress });
  res.status(200).json({ message: "Merkle tree stored successfully" });
});
  

app.get("/api/trees", (req, res) => {
  res.json(storedTrees);
});

app.get("/api/get-tree/:root", (req, res) => {
    const { root } = req.params;
    const tree = storedTrees.find(tree => tree.root === root);
  
    if (!tree) {
      return res.status(404).json({ error: "Merkle tree not found" });
    }
  
    res.status(200).json(tree);
  });
  

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
