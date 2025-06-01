// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract FeedbackCoin {
    
    bytes32 public classRoot;
    address public owner;
    string public encryptionPublicKey;

    // Password logic
    bytes32 public currentPasswordHash;
    uint256 public currentDay;
    mapping(bytes32 => uint256) public lastClaimedDay;

    // Commitment-based balances
    mapping(bytes32 => uint256) public balances;

    //for storing the ciphertexts
    string[] public feedbackCiphertexts;

    constructor(bytes32 _classMerkleRoot, string memory _encryptionPublicKey) {
        owner = msg.sender;
        classRoot = _classMerkleRoot;
        encryptionPublicKey = _encryptionPublicKey;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function setDailyPassword(bytes32 passwordHash) external onlyOwner {
        currentDay += 1;
        currentPasswordHash = passwordHash;
    }

    /// @notice Claim a feedback coin using a class membership proof and identity commitments
    /// @param password The teacher's daily password
    /// @param classProof Merkle proof for user's class membership
    /// @param oldCommitment Identity commitment of student before claim
    /// @param newCommitment New identity commitment to transition to
    /// @param newRoot Merkle root that contains `newCommitment`
    /// @param newProof Merkle proof that proves `newCommitment` is in `newRoot`
    function claim(
        string memory password,
        bytes32[] calldata classProof,
        bytes32 oldCommitment,
        bytes32 newCommitment,
        bytes32 newRoot,
        bytes32[] calldata newProof
    ) external {

        bytes32 hashedOldCommitment = keccak256(abi.encodePacked(oldCommitment));
        require(lastClaimedDay[hashedOldCommitment] < currentDay, "Already claimed");
        require(keccak256(abi.encodePacked(password)) == currentPasswordHash, "Bad password");

        // Verify user is in class
        // bytes32 classLeaf = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(classProof, classRoot, hashedOldCommitment), "Not in class");

        // Verify the new commitment is in the new Merkle root
        // bytes32 newLeaf = keccak256(abi.encodePacked(newCommitment));
        require(MerkleProof.verify(newProof, newRoot, newCommitment), "Invalid new commitment proof");

        lastClaimedDay[newCommitment] = currentDay;
        classRoot = newRoot;

        // Add 1 coin + transfer balance
        uint256 oldBalance = balances[hashedOldCommitment];
        balances[newCommitment] += oldBalance + 1;

        // Clear old commitment
        delete balances[oldCommitment];
        delete lastClaimedDay[oldCommitment];
    }

    function sendFeedback(
        string memory ciphertext,
        bytes32[] calldata classProof,
        bytes32 oldCommitment,
        bytes32 newCommitment,
        bytes32 newRoot,
        bytes32[] calldata newProof
    ) external {
        // Ensure user is in class
        bytes32 hashedOldCommitment = keccak256(abi.encodePacked(oldCommitment));
        require(MerkleProof.verify(classProof, classRoot, hashedOldCommitment), "Not in class");

        // Ensure new commitment is valid in new Merkle root
        require(MerkleProof.verify(newProof, newRoot, newCommitment), "Invalid new commitment proof");

        uint256 oldBalance = balances[hashedOldCommitment];
        require(oldBalance >= 1, "Insufficient balance");

        // Transfer balance minus 1 to new commitment
        balances[newCommitment] += oldBalance - 1;
        classRoot = newRoot;

        // Clear old commitment
        delete balances[hashedOldCommitment];

        // Save feedback
        feedbackCiphertexts.push(ciphertext);
    }
}
