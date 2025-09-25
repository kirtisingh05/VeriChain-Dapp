# VeriChain - Blockchain-based Document Verification System

## Overview

VeriChain is a secure, decentralized document verification system using Ethereum blockchain and IPFS. It allows users to upload documents, store their cryptographic hashes immutably on blockchain, and verify authenticity anytime via a simple web interface.

This system aims to prevent forgery, provide transparent audit trails, and leverage decentralization to avoid single points of failure in document verification.

## Features

- **Document Upload & Hashing:** Client-side SHA-256 hashing for privacy; optional IPFS for large file storage.
- **Smart Contract Storage:** Immutable document hashes stored on Ethereum blockchain.
- **Role-Based Access Control:** Owner, exporter, and user roles govern permissions.
- **Verification:** Instant verification by comparing document hash with blockchain records.
- **User-friendly UI:** Responsive and modern React-based interface integrated with MetaMask.
- **Transaction Logging:** Full audit trail of all document operations.
- **Statistics & Query:** Real-time stats and document queries.

## Technology Stack

- **Blockchain:** Ethereum, Solidity smart contracts
- **Frontend:** React, Web3.js, Bootstrap, CryptoJS
- **Storage:** Ethereum blockchain, IPFS (optional)
- **Wallet Integration:** MetaMask for secure signatures
- **Hashing:** SHA-256 (client-side)

## Installation & Setup

1. **Clone the repository**
```bash
git clone <repo-url>
cd verichain-project
```

2. **Install dependencies**
```bash
npm install
```

3. **Deploy Smart Contract**
- Use Truffle or Remix to deploy the Solidity contract on Ethereum testnet or local Ganache.

4. **Configure Frontend**
- Update contract address and ABI in frontend source.
- Connect MetaMask wallet to deploy network.

5. **Run the application**
```bash
npm start
```
- Open `http://localhost:3000` in your browser.

## Usage

- **Upload Documents:** Select a file to hash it and optionally upload to IPFS, then send transaction to store hash on blockchain.
- **Verify Documents:** Upload or enter document hash to check authenticity.
- **Manage Users:** Owner can add authorized exporters to upload documents.
- **View Stats & Logs:** Check real-time stats and transaction logs.

## Architecture

- Document hashes are stored immutably on blockchain.
- Client-side hashing ensures no sensitive file content is uploaded to server.
- Role-based smart contract access prevents unauthorized uploads.
- Transactions verified by MetaMask signatures.

## Future Enhancements

- Multi-chain deployment for scalability.
- Advanced document encryption and digital signatures.
- API development for enterprise integration.
- Mobile app for easier verification.

