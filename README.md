# FeedbackCoin
CS595 final project

Title: Anonymous Feedback

Team: Nathaniel Quisel

Abstract:
Currently, there is no system for students to anonymously and consistently provide feedback for their professors. At BU, there is an end of term evaluation, but feedback on individual lectures would allow the teacher to better understand what could be improved now. Also, students are often wary that anonymous feedback systems are anonymous, which leads to less honest opinions. Blockchain technologies guarantee anonymity, and they allow for a voting system to prevent inappropriate messages. Students should be honest, but not hateful. All teachers and some students who have accrued trust should be able to vote to ban users for egregious messages.

Background:
Blockchain systems provide a good framework to provide anonymity. Once an account has been created, as long as no identity information was leaked, the user’s identity is simply their public key.

Project objectives:
Create a user interface for a student or professor to create an account by providing proof they are affiliated with the university. Teacher accounts can create QRcodes for students to scan and gain FeedbackCoin. Students can spend FeedbackCoin to send encrypted messages. Teachers can initiate a ban vote if they deem a message is inappropriate. Teachers and select students can vote on banning that user.

Methodology:
Create the FeedbackCoin that has all listed capabilities. Through the Ethereum testnet, store messages that students have sent to teachers. Have a system for students and teachers to create anonymous accounts. 

Scope and deliverables:
A working demo of a user interface for students and teachers to create accounts. Prove that the student accounts are anonymous and cannot be tracked back to individual students. Zero-knowledge proofs will be used to prove students/teachers are actually students/teachers at that university. At the end of each day, the hashes of all feedback messages will be stored in a merkle tree, and teachers will receive the index and content of the messages they received. They can prove they know a message from the merkle tree to initiate a vote to ban a user.
Potentially out of scope would be the voting to ban process. Depending on time, this might be deemed out of scope.

Evaluation:
The project will be a success if the user interface allows students to easily create accounts, receive coins from a QRcode/link, and spend that coin to send feedback messages. This also requires the user interface to allow teachers to create an account and create QRcodes/links for students to use. Teachers should also be able to view their received messages in the UI. 

Resources:
I will be using Ethereum testnet to create the necessary smart contracts and I will be using React for the frontend UI.

Challenges:
I am inexperienced with using React to create user interfaces, and creating a system that both verifies a student/teacher is a student/teacher when creating an account and does not leak the identity of the user seems difficult.

Ethics:
If students and teachers are allowed to vote to ban users, it seems hard to ensure that only bad messages are voted out. However, without this feature it seems impossible to guarantee teachers would not be harassed. 


