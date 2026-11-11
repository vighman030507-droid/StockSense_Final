# StockSense — PCB Inventory Automation System

![Node.js](https://img.shields.io/badge/Node.js-16%2B-green)
![React](https://img.shields.io/badge/React-18%2B-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

**Full-Stack Application for Automated PCB Inventory and Production Management**

Built for **INVICTUS Hackathon 2026** by Team Vibe Coders.

---

## 🌐 Live Deployment

**Live Application:**  
https://stock-sense-final.vercel.app/login

**Production API:**  
https://stocksense-final.onrender.com

**GitHub Repository:**  
https://github.com/vighman030507-droid/StockSense_Final

---

## 🏗️ Production Architecture

```text
                         StockSense
                             |
                             v
                  React + Vite Frontend
                             |
                       HTTPS REST API
                             |
                             v
                  Node.js + Express API
                             |
                             v
                    PostgreSQL Database
                             |
                             v
                       Neon PostgreSQL
```

### Production Deployment

```text
User Browser
     |
     v
Vercel
     |
     v
StockSense React Frontend
     |
     | HTTPS API Requests
     v
Render
     |
     v
StockSense Node.js / Express Backend
     |
     v
Neon PostgreSQL
```

The production system uses:

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** Neon PostgreSQL
- **Source Control:** GitHub

Production authentication, database connectivity, CORS, and frontend-to-backend API communication have been successfully verified.

---

# 📋 Project Overview

StockSense is a full-stack PCB inventory automation and production management system designed to digitize and centralize PCB component inventory, PCB records, production tracking, analytics, authentication, and Excel-based data operations.

The system replaces fragmented spreadsheet-based workflows with a centralized web application backed by PostgreSQL.

---

# 🎯 Key Objectives

- Centralize PCB component inventory
- Track PCB and BOM information
- Monitor production activity
- Track component consumption
- Identify stock shortages
- Provide inventory and production analytics
- Support Excel-based data operations
- Provide authenticated access
- Create a scalable foundation for future inventory intelligence

---

# ✨ Features

## 🔐 Authentication

- JWT-based authentication
- User login
- User registration
- Current-user authentication
- bcrypt password hashing
- Role information
- Protected API routes

---

## 📦 Component Inventory

Manage PCB components and their inventory information.

Capabilities include:

- Component records
- Inventory quantities
- Component identification
- Stock management
- Inventory updates
- Component-related operations

---

## 🖥️ PCB Management

Manage PCB-related records and BOM information.

The PCB module provides functionality for:

- PCB records
- BOM-related information
- Component associations
- PCB inventory relationships
- PCB management operations

---

## 🏭 Production Management

Track PCB production activity through the production module.

Production functionality includes:

- Production records
- Production quantities
- Production status
- Component requirements
- Production-related inventory operations

---

## 📊 Analytics

StockSense includes analytics functionality for monitoring inventory and production activity.

The analytics system provides the foundation for:

- Inventory analysis
- Production analysis
- Stock trends
- Component usage
- Production metrics

---

## 📑 Excel Operations

StockSense supports Excel-based data operations using:

- **Multer** for file uploads
- **xlsx** for spreadsheet processing

This allows spreadsheet-based inventory workflows to be integrated into the application.

---

# 🛠️ Technology Stack

## Frontend

- React 18
- Vite 7 (optimized manual chunking for lightning-fast loads)
- Tailwind CSS 3 with full Dark & Light theme engine
- Recharts (theme-adaptive data visualizations)
- Lucide React iconography
- React Hot Toast
- React Router 6
- Axios client with JWT interceptor

## Backend

- Node.js
- Express.js
- PostgreSQL with connection pooling (`pg`)
- Helmet (security headers)
- Express Rate Limit (DDoS & brute force mitigation)
- JWT Authentication & bcrypt hashing
- Multer & xlsx for spreadsheet processing
- CORS with Vercel origin whitelisting

## Database

- Neon PostgreSQL (AWS Asia Pacific Singapore)
- SSL connection pooling with automated migration scripts

## Deployment

- **Frontend:** Vercel (Continuous Deployment from `main`)
- **Backend:** Render (Web Service from `main`)
- **Database:** Neon PostgreSQL (Cloud Lakebase)
- **Source Control:** GitHub

---

# 🗄️ Database Setup & Non-Destructive Migrations

### For Fresh Deployments:
Execute [`backend/sql/schema.sql`](file:///Users/vighman/Desktop/StockSense_Final/backend/sql/schema.sql) in your PostgreSQL or Neon console.

### For Existing Live Deployments:
**DO NOT re-run `schema.sql` on an existing database**, as it contains `DROP TABLE CASCADE` which will wipe existing inventory and user passwords!

Instead, execute the safe additive migration in [`backend/sql/migration_pcb_id_nullable.sql`](file:///Users/vighman/Desktop/StockSense_Final/backend/sql/migration_pcb_id_nullable.sql):

```sql
-- Run this in Neon SQL Editor to allow Component-String production runs:
ALTER TABLE production_entries ALTER COLUMN pcb_id DROP NOT NULL;
```
This migration is non-destructive, instant, and preserves all your live data, users, passwords, and logs.

---

# 🔌 API Structure

The backend is organized into modular API route groups:

```text
/api/auth
/api/components
/api/pcbs
/api/production
/api/analytics
/api/excel
```

Health check:

```text
/health
```

Production API:

```text
https://stocksense-final.onrender.com
```

---

# 📁 Project Structure

```text
StockSense_Final/
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── sql/
│   │   └── schema.sql
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axiosInstance.js
│   │   └── ...
│   ├── package.json
│   └── ...
│
└── README.md
```

The exact project structure may evolve as development continues.

---

# 🚀 Local Development

## Prerequisites

Install the following:

- Node.js
- npm
- Git
- PostgreSQL or access to a PostgreSQL database

---

# 1. Clone Repository

```bash
git clone https://github.com/vighman030507-droid/StockSense_Final.git
cd StockSense_Final
```

---

# 2. Backend Setup

```bash
cd backend
npm install
```

Create:

```text
backend/.env
```

Configure:

```env
NODE_ENV=development

DB_HOST=your_database_host
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

FRONTEND_URL=http://localhost:3000
```

Start the backend:

```bash
npm run dev
```

or:

```bash
npm start
```

---

# 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Create:

```text
frontend/.env.local
```

For local development:

```env
VITE_API_URL=http://localhost:5001
```

Start the frontend:

```bash
npm run dev
```

The Vite development server will provide the local frontend URL.

---

# 🔑 Authentication

The production system uses JWT authentication.

The authentication flow is:

```text
User
 |
 | username + password
 v
POST /api/auth/login
 |
 v
Express Backend
 |
 v
PostgreSQL / Neon
 |
 v
bcrypt password verification
 |
 v
JWT generated
 |
 v
Frontend stores authentication state
```

Authentication endpoint:

```text
POST /api/auth/login
```

Current development/admin account:

```text
Username: admin
Password: admin123
```

Do not use default credentials in a real production environment.

---

# 🌍 Production Deployment

StockSense is currently deployed as a full-stack production application.

## Frontend — Vercel

- **Platform:** Vercel
- **Repository:** `vighman030507-droid/StockSense_Final`
- **Root Directory:** `frontend`
- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

Production environment variable:

```env
VITE_API_URL=https://stocksense-final.onrender.com
```

Live frontend:

https://stock-sense-final.vercel.app/login

---

## Backend — Render

- **Platform:** Render
- **Service:** `stocksense-backend`
- **Repository:** `vighman030507-droid/StockSense_Final`
- **Branch:** `main`
- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

Production API:

https://stocksense-final.onrender.com

Render supplies the production `PORT` environment variable.

---

## Database — Neon

StockSense uses PostgreSQL hosted on Neon.

Current production database configuration:

```text
Project: StockSense
Database: neondb
Branch: production
Region: AWS Asia Pacific Singapore
```

The backend connects to Neon using PostgreSQL and SSL configuration.

---

# 🔐 Production Environment Variables

Frontend:

```env
VITE_API_URL=https://stocksense-final.onrender.com
```

Backend uses environment variables for:

```text
NODE_ENV
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
JWT_SECRET
JWT_EXPIRES_IN
FRONTEND_URL
```

Sensitive credentials must never be committed to GitHub.

Do not commit:

```text
.env
.env.local
database passwords
JWT secrets
API keys
private credentials
```

---

# 🔒 CORS

Production frontend origin:

```text
https://stock-sense-final.vercel.app
```

Local development frontend:

```text
http://localhost:3000
```

The backend is configured to allow the required frontend origins.

Production CORS should remain restricted to trusted application origins.

---

# 🗄️ Database

The database schema is located at:

```text
backend/sql/schema.sql
```

The production PostgreSQL database uses Neon.

Before modifying the production database:

1. Review the existing schema.
2. Check foreign-key relationships.
3. Check existing constraints.
4. Check dependencies in the backend.
5. Prefer controlled migrations.
6. Avoid deleting production tables without explicit planning.

---

# 📈 Current Production Status

| Component | Status |
|---|---|
| React frontend | ✅ Deployed |
| Vite production build | ✅ Working |
| Vercel deployment | ✅ Working |
| Node.js backend | ✅ Deployed |
| Render deployment | ✅ Working |
| PostgreSQL database | ✅ Configured |
| Neon connection | ✅ Working |
| JWT authentication | ✅ Working |
| Production CORS | ✅ Configured |
| Frontend → Backend API | ✅ Working |
| Production login | ✅ Verified |
| Excel integration | ✅ Implemented |
| Inventory management | ✅ Implemented |
| PCB/BOM management | ✅ Implemented |
| Production tracking | ✅ Implemented |
| Analytics | ✅ Implemented |

---

# 🧪 Development & Testing

Development should follow:

```text
Code Change
     ↓
Local Testing
     ↓
API Testing
     ↓
Database Verification
     ↓
Frontend Build
     ↓
Git Commit
     ↓
Git Push
     ↓
Vercel / Render Deployment
     ↓
Production Verification
```

Major changes should not be deployed without testing the affected functionality locally.

---

# 🛣️ Development Roadmap

The production deployment is now the baseline for continued development.

## Phase 1 — Technical Audit

- Complete frontend component/page mapping
- Complete backend route mapping
- Complete controller mapping
- Complete middleware mapping
- Complete database schema mapping
- Review API request/response contracts
- Identify duplicate code
- Identify unused code
- Identify technical debt
- Review project dependencies

---

## Phase 2 — Reliability

Improve:

- API error handling
- Frontend validation
- Loading states
- Empty states
- Error messages
- Database error handling
- Excel validation
- Duplicate handling
- Transaction handling
- Edge-case handling

---

## Phase 3 — Security

Potential improvements:

- Role-based authorization
- Stronger access controls
- Rate limiting
- Input validation
- File upload validation
- File size restrictions
- Security headers
- Audit logging
- Improved authentication handling
- Production secret management

---

## Phase 4 — UI/UX

Potential improvements:

- Modern dashboard
- Better navigation
- Improved data tables
- Search
- Filtering
- Pagination
- Better forms
- Better validation feedback
- Loading indicators
- Empty states
- Confirmation dialogs
- Toast notifications
- Responsive design

---

## Phase 5 — Inventory Intelligence

Potential improvements:

- Low-stock detection
- Reorder indicators
- Component consumption history
- Stock movement tracking
- Supplier management
- Inventory trends
- Component usage analytics
- Stock forecasting

---

## Phase 6 — Production Intelligence

Potential improvements:

- Production status tracking
- Planned vs completed production
- Component shortage detection
- Production history
- Production efficiency
- Component consumption per PCB
- Production trend analysis

---

## Phase 7 — Advanced Analytics

Potential improvements:

- Inventory KPIs
- Production KPIs
- Stock trend dashboards
- Component consumption analytics
- Shortage analysis
- Production performance
- Exportable reports
- Advanced filtering
- Historical comparisons

---

## Phase 8 — Advanced Features

Potential future additions:

- Role-based permissions
- Audit logs
- Barcode/QR integration
- Notifications
- Supplier management
- Intelligent reorder recommendations
- Predictive analytics
- Automated alerts

Advanced AI/ML functionality should only be added after the underlying inventory and production data are reliable and sufficiently structured.

---

# 🧠 Development Philosophy

StockSense is being developed incrementally.

The current production deployment provides the foundation:

```text
Working Production System
          ↓
Technical Audit
          ↓
Reliability Improvements
          ↓
Security Improvements
          ↓
UI/UX Improvements
          ↓
Inventory Intelligence
          ↓
Production Intelligence
          ↓
Advanced Analytics
```

The goal is to evolve StockSense from a functional project into a polished, reliable PCB inventory and production management platform.

---

# 🤝 Contributing

Before making major changes:

1. Understand the existing architecture.
2. Inspect the affected frontend code.
3. Inspect the corresponding backend routes/controllers.
4. Inspect database dependencies.
5. Avoid breaking existing API contracts.
6. Test locally.
7. Build the frontend.
8. Verify the affected production workflow after deployment.

Do not rewrite working modules unnecessarily.

---

# 📜 License

Add the project's intended license here if/when one is selected.

---

# 👨‍💻 Project

**StockSense — PCB Inventory Automation System**

GitHub:  
https://github.com/vighman030507-droid/StockSense_Final

Live Application:  
https://stock-sense-final.vercel.app/login

Production API:  
https://stocksense-final.onrender.com