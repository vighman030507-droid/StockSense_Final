# 📋 Quick Copy Guide - Merge into StockSense Repo

**One-Command Setup for Merging Frontend into Your Backend Repo**

---

## 🎯 Option 1: Copy into StockSense as Subfolder (Recommended)

### Step 1: Extract This Archive

```bash
# Go to wherever you downloaded the archive
cd ~/Downloads

# Extract
tar -xzf StockSense-Frontend-5001.tar.gz

# You now have: StockSense-Frontend-5001/
```

### Step 2: Copy into Your StockSense Repo

```bash
# Navigate to your StockSense backend repo
cd ~/path/to/StockSense

# Create frontend folder
mkdir -p frontend

# Copy all files
cp -r ~/Downloads/StockSense-Frontend-5001/* frontend/
cp ~/Downloads/StockSense-Frontend-5001/.gitignore frontend/
cp ~/Downloads/StockSense-Frontend-5001/.env.example frontend/

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Step 3: Update Backend .gitignore

```bash
# Add frontend ignores to your backend .gitignore
cat >> .gitignore << 'EOF'

# Frontend
frontend/node_modules/
frontend/dist/
frontend/.env
EOF
```

### Step 4: Test It Works

```bash
# Terminal 1: Start backend (from StockSense root)
npm run dev

# Terminal 2: Start frontend (from StockSense/frontend)
cd frontend
npm run dev
```

Open browser: http://localhost:3000

### Step 5: Commit to Git

```bash
# From StockSense root directory
git add .
git commit -m "feat: Add React frontend application

- React 18 + Vite frontend
- Pre-configured for port 5001 backend
- 7 pages: Dashboard, Components, PCBs, Production, Analytics, Excel, Procurement
- Tailwind CSS styling
- Full JWT authentication
- Complete integration with backend API"

git push origin main
```

---

## 🎯 Option 2: Keep as Separate Folder (Development)

### Just Work With It Separately

```bash
# Extract to wherever you want
cd ~/Desktop  # or ~/Documents or wherever
tar -xzf ~/Downloads/StockSense-Frontend-5001.tar.gz
cd StockSense-Frontend-5001

# Install and run
npm install
npm run dev
```

**Benefits:**
- Easier to work with during development
- Can push to separate repo (StockSense-Frontend)
- Merge later when ready

---

## 🎯 Option 3: Replace Existing StockSense_Frontend

### If You Already Have a Frontend Folder

```bash
# Backup your current frontend
cd ~/path/to/StockSense
mv frontend frontend_backup_$(date +%Y%m%d)

# Copy new frontend
mkdir frontend
cp -r ~/Downloads/StockSense-Frontend-5001/* frontend/
cp ~/Downloads/StockSense-Frontend-5001/.gitignore frontend/
cp ~/Downloads/StockSense-Frontend-5001/.env.example frontend/

# Install
cd frontend
npm install
```

---

## 📁 Final Repository Structure

After copying, your StockSense repo should look like:

```
StockSense/
├── backend/                 # Your existing backend
│   ├── server.js
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── ...
├── frontend/                # New frontend
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── ...
├── .gitignore              # Updated with frontend ignores
└── README.md               # Main repo README
```

---

## 🚀 Start Commands

### Start Backend
```bash
cd ~/path/to/StockSense
npm run dev
# Backend runs on http://localhost:5001
```

### Start Frontend
```bash
cd ~/path/to/StockSense/frontend
npm run dev
# Frontend runs on http://localhost:3000
```

### Start Both (Create this script)

Save as `start_all.sh` in StockSense root:

```bash
#!/bin/bash

echo "🚀 Starting StockSense Full Stack"
echo "================================"

# Start backend in background
echo "Starting backend on port 5001..."
npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "Starting frontend on port 3000..."
cd frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers started!"
echo "Backend: http://localhost:5001"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
```

Make it executable:
```bash
chmod +x start_all.sh
./start_all.sh
```

---

## ✅ Verification Checklist

After copying and installing:

- [ ] Frontend folder exists in StockSense repo
- [ ] `frontend/node_modules` folder created after npm install
- [ ] `frontend/.gitignore` exists
- [ ] Backend .gitignore updated to ignore `frontend/node_modules`
- [ ] Backend starts on port 5001
- [ ] Frontend starts on port 3000
- [ ] Can login at http://localhost:3000
- [ ] No CORS errors in browser console
- [ ] Dashboard loads data from backend

---

## 🎁 Bonus: Create Root README

Update your main `StockSense/README.md`:

```markdown
# StockSense - PCB Inventory Management System

Full-stack application for automated PCB inventory management.

## 🏗 Structure

- **Backend**: Node.js + Express API (Port 5001)
- **Frontend**: React + Vite UI (Port 3000)

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL 12+

### Setup

```bash
# Clone repo
git clone https://github.com/vighman030507-droid/StockSense.git
cd StockSense

# Backend setup
npm install
# Configure database (see backend README)
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

### Access
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001
- Login: admin / admin123

## 📚 Documentation
- [Frontend Guide](./frontend/SETUP_GUIDE.md)
- [Integration Guide](./frontend/INTEGRATION_GUIDE.md)
- [API Documentation](./backend/API_DOCUMENTATION.md)
```

---

**That's it! Your frontend is now integrated into your StockSense repository.** 🎉
