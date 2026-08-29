# FindIt – Campus Lost & Found Platform

FindIt is a web-based campus Lost & Found platform designed to simplify the reporting, discovery, matching, and recovery of lost belongings.

The platform provides a centralized system for students and staff to report lost or found items, search available reports, submit claims, and securely recover belongings. It also incorporates AI-powered image analysis and similarity-based matching to help identify potential matches between lost and found items.

## Features

* Lost and found item reporting
* Search and filtering
* User authentication and role-based access
* Item and claim management
* Administrative dashboard
* AI-powered item analysis
* Similarity-based item matching
* Notifications for potential matches
* Secure ownership verification

## Tech Stack

**Frontend:** React.js, Tailwind CSS
**Backend:** Node.js, Express.js
**Database:** MongoDB
**AI:** Gemini 2.5 Flash, Embeddings, FAISS
**Services:** Cloudinary, Nodemailer

## Architecture

```text
React + Tailwind CSS
        ↓
Node.js + Express.js
        ↓
      MongoDB
        ↓
AI Processing
        ↓
Gemini → Embeddings → FAISS
        ↓
Potential Match
        ↓
Notification & Verification
```

## Project Structure

```text
FindIt/
├── frontend/
├── backend/
├── .gitignore
└── README.md
```

## Getting Started

```bash
git clone <repository-url>
cd FindIt
```

Install dependencies:

```bash
cd frontend
npm install
```

```bash
cd ../backend
npm install
```

Configure the required environment variables and start the frontend and backend servers.

## Project

**FindIt – Campus Lost & Found Platform**

Developed as an academic project at **Bannari Amman Institute of Technology**.
