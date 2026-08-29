# FindIt – Campus Lost Item Reporting and Recovery Platform

> **"Lost Something on Campus? Find It Faster."**

### 👥 Project Team
- **Sukesh R**
- **Thilak R P**

---

## 📌 Project Overview
**FindIt** is a centralized campus Lost & Found web platform engineered to help students, faculty, and administrative staff report lost and found belongings, browse/search active cases, and streamline verified ownership recovery.

This repository contains the **First Review Prototype**, structured with clean full-stack separation and modular architectural contracts designed for future AI-powered multimodal similarity search (Gemini 2.5 Flash + FAISS).

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS (with Dark Mode support)
- **Icons**: Lucide React
- **Routing**: React Router v6
- **HTTP Client**: Axios (with centralized interceptors & token injection)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with `bcryptjs` password hashing
- **Middleware**: CORS, Morgan logger, Role authorization (`student`, `staff`, `admin`), Centralized Error Handler

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB** (Local `mongod` service running or MongoDB Atlas connection string)

### 2. Environment Configuration
Backend `.env` file (`backend/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/findit
JWT_SECRET=findit_campus_super_secret_jwt_key_2026
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Frontend `.env` file (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Seed Database
Populate the database with demo users, realistic campus items across zones, claims, and notifications:
```bash
npm run seed
```

### 4. Start the Application

#### Option A: Start both independently
**Start Backend (Port 5000):**
```bash
cd backend
npm start
```

**Start Frontend (Port 5173):**
```bash
cd frontend
npm run dev
```

#### Option B: From Root Directory
```bash
npm run backend
npm run frontend
```

---

## 🔑 Demo Login Accounts

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@findit.campus.edu` | `Admin@123Password` | Full management of items, claims, users, & status |
| **Student** | `sukesh@campus.edu` | `Password@123` | Report lost/found, search, submit claims |
| **Student** | `thilak@campus.edu` | `Password@123` | Report lost/found, search, submit claims |
| **Staff** | `priya.staff@campus.edu` | `Password@123` | Report lost/found, search, submit claims |

---

## 📋 API Endpoints Summary

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` — Register student/staff account
- `POST /api/auth/login` — Authenticate and retrieve JWT token
- `GET /api/auth/me` — Retrieve logged-in profile
- `PUT /api/auth/profile` — Update name/phone

### 📦 Lost & Found Items (`/api/items`)
- `POST /api/items/lost` — Report a lost item
- `POST /api/items/found` — Report a found item
- `GET /api/items` — Browse items (supports `search`, `category`, `location`, `type`, `status`, `sortBy`, `page`)
- `GET /api/items/:id` — Retrieve item details & reporter information
- `PUT /api/items/:id` — Update report (owner / admin)
- `DELETE /api/items/:id` — Delete report (owner / admin)
- `GET /api/items/user/my-reports` — List current user's submitted reports
- `GET /api/items/stats/summary` — Public metric counters for landing page

### 🛡️ Claims (`/api/claims`)
- `POST /api/claims` — Submit ownership claim with proof
- `GET /api/claims` — List claims (User sees own; Admin sees all)
- `GET /api/claims/:id` — View specific claim details
- `PATCH /api/claims/:id/status` — Approve or reject claim (Admin only)

### 🔔 Notifications (`/api/notifications`)
- `GET /api/notifications` — Fetch user alerts
- `PATCH /api/notifications/:id/read` — Mark single notification as read
- `PATCH /api/notifications/read-all` — Mark all notifications as read

### ⚙️ Admin Console (`/api/admin`)
- `GET /api/admin/stats` — Executive dashboard statistics & distributions
- `GET /api/admin/users` — User list with search and role filters
- `PATCH /api/admin/users/:id/role` — Update user permissions (`student`/`staff`/`admin`)
- `DELETE /api/admin/users/:id` — Remove user account

---

## 🔮 Phase 2 Roadmap (Future AI Integration)
The architecture includes `backend/src/services/aiMatchingService.js` and frontend preview banners structured for:
1. **Multimodal Analysis**: Integrating Google Gemini 2.5 Flash to automatically detect attributes from photos.
2. **Embeddings & Vector Search**: Generating vector embeddings and indexing with FAISS for sub-second similarity matching between lost & found reports.
3. **Automated Alerts**: Email notifications via Nodemailer when high-confidence matches are found.
4. **Enhanced ID Verification**: Automated student ID optical recognition.
