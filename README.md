# FundKosh — Cash Management & Speed-Bump Reflection Engine

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Local-green.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**FundKosh** is a premium cash management and real-time **Speed-Bump Intercept Reflection Engine** designed to prevent impulsive digital transactions (e.g. UPI) before funds leave a user's account. By enforcing custom cooldown periods and budget buffers, it provides a crucial cognitive reflection window for users.

---

## Technical Architecture & Core System Design

FundKosh is designed around a **Client-Server Architecture** with a local Node.js Express backend and MongoDB database, falling back to a mock memory store if MongoDB is offline.

```
+-----------------------------------------------------------------------+
|                    Premium Mobile Client Interface                    |
|                            (src/App.tsx)                              |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                   Payment State Machine & Verification                |
|                    (src/controllers/PaymentController)                |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                 Backend REST API Server (Port 5000)                   |
|                        (server/index.js)                              |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                     MongoDB Database Collection                       |
|                          (fundkosh DB)                                |
+-----------------------------------------------------------------------+
```

---

## Database Schema & Seed Profiles

### Database Tables (MongoDB Collections)
1. **Entities**: Tracks accounts (types: `user`, `family`, `merchant`, `gig_platform`, `financial_institution`) with name, balance, UPI ID, and phone number.
2. **Liabilities**: Upcoming fixed bills (rent, EMIs) to deduct from the daily spending limits.
3. **Transactions**: Log of all completed, speed-bumped, or cancelled transfers.
4. **Vaults**: Automated round-up settings and savings cache.
5. **SpeedBumpRules**: ML parameters and limits governing cooldown interventions.

### Seed Dataset Profiles
The database seeds the following profiles upon clicking **Reset / Seed DB** in the Developer Sandbox:

| ID | Name | Type | UPI ID | Phone Number | Initial Balance |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `usr_01` | Ramesh Kumar | `user` | `rameshkumar@upi` | `+91 98290 12345` | ₹45,000.00 |
| `usr_02` | Sunita Devi | `family` | `sunitadevi@upi` | `+91 94140 54321` | ₹15,000.00 |
| `mer_01` | Balaji Stores (Grocery) | `merchant` | `balajistores@upi` | `+91 98870 99887` | ₹120,000.00 |
| `mer_02` | Khurana Oil Co. (Petrol Pump) | `merchant` | `khuranaoil@upi` | `+91 94600 11223` | ₹500,000.00 |
| `mer_03` | Pink City Sabji Bhandar | `merchant` | `pinkcitysabji@upi` | `+91 99280 44556` | ₹5,000.00 |
| `mer_04` | Rawat Pyaaz Kachori Shop | `merchant` | `rawatkachori@upi` | `+91 98280 77889` | ₹35,000.00 |
| `mer_05` | Sahu Tea Stall | `merchant` | `sahuteastall@upi` | `+91 94130 99001` | ₹12,000.00 |

---

## Core Features & Interfaces

### 1. One-Step Profile Onboarding
- When the app is launched without a session, the user is presented with a **Choose Your Profile** onboarding screen to login as **Ramesh Kumar** or **Sunita Devi**.

### 2. Recipient Verification Flow
- Clicking any payment action opens the **Payment Modal**.
- Entering a contact phone number or UPI ID and clicking **Verify** validates the contact details.
- Valid users reveal a verified checkmark card before unlocking the amount inputs.

### 3. Payment Status Screen
- Displays a **Payment Successful** page upon transaction confirmation, showing Date, Time, Payee details, paid bank source, and scratch card rewards.
- Displays a **Payment Failed** page if the transaction is cancelled or fails constraints.

### 4. Developer Sandbox Panel
- A collapsible bottom tray toggled by the floating `?` support button on the bottom right.
- Houses options to reset database seeds, adjust local weather conditions, or set local event vectors to stress test the spending propensity models.

---

## Getting Started

### Installation

```bash
# Install root node dependencies
npm install

# Install server backend dependencies
cd server
npm install
cd ..
```

### Running Locally

You will need to run both the API backend and Vite client frontend:

1. **Start the API Server**:
   ```bash
   node .\server\index.js
   ```
   (Runs on http://localhost:5000)

2. **Start the Vite Frontend**:
   ```bash
   npm run dev
   ```
   (Runs on http://localhost:5173 or configured dev port)
