# 🎯 START HERE - StockSense Frontend

**Pre-configured React Frontend for Your StockSense Backend (Port 5001)**

---

## 📦 What You Have

This is a **complete React frontend** pre-configured to work with your StockSense backend running on **port 5001**.

**Features:**
- ✅ JWT Authentication
- ✅ Component Inventory Management
- ✅ PCB Configuration & BOM Mapping
- ✅ Production Entry (2 modes: PCB-based & Component String)
- ✅ Analytics Dashboard with Charts
- ✅ Excel Import/Export
- ✅ Procurement Trigger Management

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Start Frontend

```bash
npm run dev
```

### Step 3: Open Browser

Go to: **http://localhost:3000**

**Login:** Use your StockSense credentials (default: admin / admin123)

---

## ✅ Pre-Configured Settings

**You don't need to configure anything!** These are already set:

- Backend API: `http://localhost:5001` ✅
- Frontend Port: `3000` ✅
- CORS Proxy: Configured ✅
- JWT Auth: Configured ✅

---

## 📚 Documentation

1. **SETUP_GUIDE.md** - Detailed setup instructions
2. **COPY_GUIDE.md** - How to merge into your StockSense repo
3. **INTEGRATION_GUIDE.md** - Full integration details
4. **README.md** - Complete feature documentation

---

## 🔧 Verify Configuration (Optional)

Run the verification script:

```bash
./verify-config.sh
```

This checks:
- Port 5001 configuration
- All files are correctly set up
- Backend connectivity

---

## 📁 What's Inside

```
StockSense-Frontend-5001/
├── START_HERE.md          ← You are here
├── SETUP_GUIDE.md         ← Read this next
├── COPY_GUIDE.md          ← Merge into backend repo
├── verify-config.sh       ← Check configuration
├── package.json
├── vite.config.js         ✅ Port 5001 configured
├── src/
│   ├── api/
│   │   └── axiosInstance.js  ✅ Port 5001 configured
│   ├── pages/            ← 7 complete pages
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Components.jsx
│   │   ├── PCBs.jsx
│   │   ├── Production.jsx
│   │   ├── Analytics.jsx
│   │   ├── ExcelManagement.jsx
│   │   └── Procurement.jsx
│   └── ...
└── ...
```

---

## ⚡ Quick Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Verify configuration
./verify-config.sh
```

---

## 🎯 Next Steps

### Option 1: Use as Standalone (Quick Test)

```bash
npm install
npm run dev
# Test it out!
```

### Option 2: Merge into StockSense Repo

See **COPY_GUIDE.md** for detailed instructions on:
- Copying into your StockSense backend repo
- Setting up as a subfolder
- Git commit and push

---

## 🆘 Troubleshooting

### "Cannot connect to backend"

**Make sure your backend is running:**
```bash
cd ~/path/to/StockSense
npm run dev
# Should start on port 5001
```

### "Port 3000 already in use"

```bash
# Kill the process
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- --port 3001
```

### CORS errors

Your backend should allow `http://localhost:3000`:
```javascript
// In your backend
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

---

## 📊 Pages Overview

1. **Dashboard** - Overview with stats
2. **Components** - Inventory CRUD with search
3. **PCBs** - PCB configuration & BOM mapping
4. **Production** - Production entry (PCB mode + Component string mode)
5. **Analytics** - Charts and insights with Recharts
6. **Excel Management** - Import/Export functionality
7. **Procurement** - Low stock trigger management

---

## 🎨 Tech Stack

- React 18
- Vite (Fast build tool)
- React Router v6
- Axios (HTTP client)
- Tailwind CSS
- Recharts (Charts)
- React Hot Toast (Notifications)
- Lucide React (Icons)

---

## ✅ Configuration Checklist

Automatically configured:
- [x] Backend URL: http://localhost:5001
- [x] Frontend port: 3000
- [x] CORS proxy setup
- [x] JWT authentication
- [x] All 7 pages implemented
- [x] All API endpoints integrated
- [x] Responsive design

**Nothing to configure - just run it!**

---

## 🚀 Ready to Go!

Your frontend is **100% ready** to work with your StockSense backend.

**Just run:**
```bash
npm install
npm run dev
```

**Then open:** http://localhost:3000

---

**Questions?** Check the other documentation files:
- SETUP_GUIDE.md - Detailed setup
- COPY_GUIDE.md - Merge into repo
- INTEGRATION_GUIDE.md - Full integration details

**Happy coding! 🎉**
