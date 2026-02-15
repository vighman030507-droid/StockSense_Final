# PCB Inventory Management System

![Node.js](https://img.shields.io/badge/Node.js-16+-green)
![React](https://img.shields.io/badge/React-18.2-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

**Full-Stack Application for Automated PCB Inventory Management**

Built for **INVICTUS Hackathon 2026** by Team Vibe Coders

---

## 🎯 Overview

A comprehensive inventory management system designed for PCB manufacturing operations with automated stock tracking, Bill of Materials (BOM) management, multi-mode production entry, and real-time analytics.

### ✨ Key Features

- 🔐 **JWT Authentication** - Secure user authentication
- 📦 **Component Inventory** - Track components with low-stock alerts
- 🔧 **PCB Configuration** - Define PCBs with BOM mapping
- 🏭 **Production Entry** - Two modes:
  - PCB-based (quantity × BOM)
  - Component string ("BZ/IC1/VR1")
- 🔒 **Transaction Safety** - All-or-nothing inventory deduction
- 📊 **Analytics Dashboard** - Real-time insights with charts
- 📥 **Excel Integration** - Import/export functionality
- ⚠️ **Procurement Triggers** - Automatic alerts (< 20% threshold)
- 🔍 **Lot Traceability** - Complete production tracking

---

## 🏗 Tech Stack

### Backend
- **Runtime:** Node.js 16+
- **Framework:** Express.js
- **Database:** PostgreSQL 12+
- **Authentication:** JWT
- **Excel Processing:** XLSX

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Notifications:** React Hot Toast

---

## 📁 Project Structure
```
JR-75-Invictus/
├── backend/              # Node.js + Express API
│   ├── server.js        # Main server file
│   ├── config/          # Database & app config
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth & validation
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── sql/             # Database schemas
│
├── frontend/            # React + Vite UI
│   ├── src/
│   │   ├── api/        # API client (Axios)
│   │   ├── components/ # Reusable components
│   │   ├── context/    # Auth context
│   │   ├── pages/      # 7 main pages
│   │   └── App.jsx     # Main app
│   ├── public/         # Static assets
│   └── index.html      # Entry point
│
└── README.md           # This file
```

---

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:
- **Node.js** 16 or higher
- **npm** 8 or higher
- **PostgreSQL** 12 or higher
- **Git**

### Installation

#### 1️⃣ Clone Repository
```bash
git clone https://github.com/ISTE-VESIT-ORG/JR-75-Invictus.git
cd JR-75-Invictus
```

#### 2️⃣ Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create database
createdb stocksense

# Run database schema
psql -d stocksense -f sql/schema.sql

# Configure environment
cp .env.example .env
# Edit .env with your settings (see below)

# Start backend server
npm run dev
```

**Backend will run on:** `http://localhost:5001`

#### 3️⃣ Frontend Setup
```bash
# Open new terminal
# Navigate to frontend from project root
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend will run on:** `http://localhost:3000`

#### 4️⃣ Access Application

Open browser: **http://localhost:3000**

**Default Login:**
- Username: `admin`
- Password: `admin123`

---

## 🔧 Environment Variables

### Backend `.env`

Create `backend/.env` file:
```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_NAME=stocksense

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=24h

# Procurement Settings
PROCUREMENT_THRESHOLD_PERCENTAGE=20
```

### Frontend `.env` (Optional)

Create `frontend/.env` file:
```env
VITE_API_URL=http://localhost:5001
```

---

## 📚 Features Documentation

### 🏭 Production Entry Modes

#### Mode 1: PCB-Based Production
- Select a configured PCB
- Enter quantity produced
- System automatically deducts components based on BOM
- Example: Produce 10 PCBs → Deducts (component qty × 10) from each component

#### Mode 2: Component String
- Enter component codes as string: `"BZ/IC1/VR1/CX1"`
- System deducts 1 unit from each component
- Automatic duplicate removal
- Whitespace handling

### ⚠️ Procurement Triggers

- Automatically generated when stock < 20% of monthly requirement
- One pending trigger per component
- Manual resolution tracking
- Detailed component information

### 📥 Excel Import/Export

**Import Features:**
- Flexible column mapping
- Row-by-row validation
- Upsert support (insert or update)
- Detailed error reporting

**Export Features:**
- Complete inventory list
- Consumption history with filters
- Low stock report with recommendations

---

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/login          # User login
GET    /api/auth/me             # Get current user
```

### Components
```
GET    /api/components          # List all components
POST   /api/components          # Create component
PUT    /api/components/:id      # Update component
DELETE /api/components/:id      # Delete component
GET    /api/components/low-stock # Low stock items
```

### PCBs
```
GET    /api/pcbs                # List all PCBs
GET    /api/pcbs/:id            # Get PCB with BOM
POST   /api/pcbs                # Create PCB
POST   /api/pcbs/:id/components # Add component to BOM
DELETE /api/pcbs/mappings/:id   # Remove component from BOM
```

### Production
```
POST   /api/production          # Create production entry
GET    /api/production          # List production entries
GET    /api/production/:id      # Get production details
```

### Analytics
```
GET    /api/analytics/top-consumed           # Top consumed components
GET    /api/analytics/low-stock               # Low stock analytics
GET    /api/analytics/production-efficiency   # Efficiency metrics
```

### Excel
```
POST   /api/excel/import/components  # Bulk import
GET    /api/excel/export/inventory   # Export inventory
GET    /api/excel/export/consumption # Export consumption
GET    /api/excel/export/low-stock   # Export low stock
```

### Procurement
```
GET    /api/production/procurement/triggers          # List triggers
PUT    /api/production/procurement/triggers/:id/resolve # Resolve trigger
```

---

## 💻 Development

### Run Backend Only
```bash
cd backend
npm run dev
```

### Run Frontend Only
```bash
cd frontend
npm run dev
```

### Run Both Servers

Open two terminals:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

---

## 🐛 Troubleshooting

### Backend won't start

**Issue:** Database connection error
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Start PostgreSQL
sudo service postgresql start

# Verify database exists
psql -l | grep stocksense

# If missing, create it
createdb stocksense
psql -d stocksense -f backend/sql/schema.sql
```

### Frontend can't connect to backend

**Issue:** CORS or network error
```bash
# Check backend is running
curl http://localhost:5001/health

# Should return: {"status":"healthy"}
```

**Fix:** Ensure backend CORS allows `http://localhost:3000`

### Port already in use
```bash
# Kill process on port 5001 (backend)
lsof -ti:5001 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### npm install fails
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

---

## 📊 Database Schema

### Core Tables

- **users** - User accounts and authentication
- **components** - Component inventory
- **pcbs** - PCB definitions
- **pcb_component_mapping** - Bill of Materials
- **production_entries** - Production records
- **consumption_history** - Component usage tracking
- **procurement_triggers** - Low stock alerts

**Full schema:** [backend/sql/schema.sql](./backend/sql/schema.sql)

---

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing (bcrypt)
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS configuration
- ✅ Input validation
- ✅ Transaction safety

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

---

## 🚀 Production Deployment

### Backend Deployment
```bash
cd backend
npm run build
npm start
```

**Recommended platforms:**
- Heroku
- Railway
- Render
- AWS EC2

### Frontend Deployment
```bash
cd frontend
npm run build
```

Output: `dist/` folder

**Recommended platforms:**
- Vercel (Recommended)
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

**⚠️ Important:** Set environment variables in production!

---

## 📖 Pages Overview

### 1. Login Page
- JWT authentication
- Secure login form
- Token storage

### 2. Dashboard
- Total components count
- Total PCBs count
- Low stock alerts
- Recent production entries
- Quick action cards

### 3. Components Page
- List all components with search
- Create/Edit/Delete components
- Low stock highlighting
- Status badges

### 4. PCBs Page
- Grid view of PCBs
- Create PCB with BOM
- Add/Remove components
- View component mappings

### 5. Production Page
- Two production modes
- Real-time validation
- Stock deduction preview
- Success/error feedback

### 6. Analytics Page
- Top consumed components (Bar chart)
- Consumption distribution (Pie chart)
- Low stock table
- Production efficiency
- Date range filtering

### 7. Excel Management Page
- Import components (bulk)
- Export inventory
- Export consumption
- Export low stock report

### 8. Procurement Page
- View pending triggers
- View resolved triggers
- Mark as resolved
- Trigger statistics

---

## 🤝 Contributing

This is a hackathon project for educational purposes.

### Team Members

Vihaan Gandhi
Vaibhavi Singh
Shreya Kaulgud

**Team Vibe Coders**
- INVICTUS Hackathon 2025
- ISTE VESIT Organization

---

## 📄 License

MIT License

---

## 🏆 Project Status

✅ **Backend:** Production-ready (39 API endpoints)  
✅ **Frontend:** Production-ready (8 pages)  
✅ **Integration:** Fully tested  
✅ **Documentation:** Complete  
✅ **Security:** Implemented  
✅ **Deployment:** Ready  

---

## 📞 Support - vighman030507@gmail.com

For issues or questions:
- Check troubleshooting section above
- Review browser console (F12) for frontend errors
- Check backend logs for API errors
- Verify environment variables are set correctly

---

## 🎯 Achievements

- ✅ Complete full-stack application
- ✅ Transaction-safe inventory management
- ✅ Multi-mode production entry
- ✅ Real-time analytics dashboard
- ✅ Excel integration
- ✅ Procurement automation
- ✅ Comprehensive documentation
- ✅ Production-ready deployment

---
**Built with ❤️ for INVICTUS Hackathon 2026**

*Team Vibe Coders - ISTE VESIT Organization*

---

**Last Updated:** February 2026
