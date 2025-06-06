# FeedbackCoin
CS595 final project

Title: Anonymous Feedback

Team: Nathaniel Quisel

Abstract:
Currently, there is no system for students to anonymously and consistently provide feedback for their professors. At BU, there is an end of term evaluation, but feedback on individual lectures would allow the teacher to better understand what could be improved now. Also, students are often wary that anonymous feedback systems are anonymous, which leads to less honest opinions. Blockchain technologies guarantee anonymity through a relayer system, where students metamask accounts are not used to sign transactions.

Background:
Blockchain systems provide a good framework to provide anonymity. Once an account has been created, as long as no identity information was leaked, the user’s identity is simply their public key. Then using Alchemy as a relayer within the node.js backend, the MetaMask account stored in the .env file will be used to sign all student transactions. Thus, a student's MetaMask information would not be exposed on the blockchain within these transactions.

Project objectives:
Create a user interface for a student or professor to login with their MetaMask account, so the system will remember which classes they have joined. Teacher accounts can enter passwords as frequently as they like, and students can enter each password once to gain one balance for that clas. Students can then spend their balance and submit anonymous and encrypted feedback to the teachers. It will cost one balance for each feedback submission.

Methodology:
Create the FeedbackCoin that has all listed capabilities. Through the Ethereum Sepolia testnet, store messages that students have sent to teachers.

Scope and deliverables:
Each contract will store a merkle root that represents all of the students in this class. The merkle leaves are publicly available on the node.js backend, so students can make merkle proofs. The leaves of the merkle tree will be hashes of randomly generated private commitments. The student will keep track of what position they are in merkle tree and the private commitment they are assigned. This will serve as their identity to ensure anonymity. When a student uses either of the two submit buttons in their UI, they will receive a new private commitment that will become their new identity. The previous identity will be exposed to complete the transaction, so a new one must be generated. The stored merkle tree both in the node.js and the smart contract will be updated accordingly. 

Out of scope is all front-running attacks that could be performed against student initiated transactions.

Evaluation:
The project will be a success if the user interface allows students to easily login, increase their balance from a password, and spend that balance to send feedback messages. This also requires the user interface to allow teachers to login and enter passwords for students to use. Teachers should also be able to view their received messages in the UI by entering their private decryption key. 

Resources:
I will be using Ethereum Sepolia testnet to create the necessary smart contracts and I will be using React for the frontend UI. I will use Node.js for the backend.

Challenges:
I am inexperienced with using React to create user interfaces, and creating a system that both verifies a student/teacher is a student/teacher when creating an account and does not leak the identity of the user seems difficult.


