# Frontend-Backend Integration Guide

**Complete integration instructions for PCB Inventory System**

---

## 🎯 Overview

This guide explains how to run both frontend and backend together.

**Backend:** Node.js + Express + PostgreSQL (Port 5001)  
**Frontend:** React + Vite (Port 3000)

---

## 📋 Prerequisites

- Node.js 16+
- PostgreSQL 12+
- npm or yarn

---

## 🚀 Step-by-Step Setup

### 1. Backend Setup

```bash
# Navigate to backend directory
cd pcb-inventory-system

# Install dependencies
npm install

# Setup database
psql -U postgres
CREATE DATABASE pcb_inventory;
\q

# Run schema
psql -U postgres -d pcb_inventory -f sql/schema.sql

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Start backend server
npm run dev
```

**Backend should be running on:** `http://localhost:5001`

**Verify:** Open `http://localhost:5001/health` in browser

---

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd pcb-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend should be running on:** `http://localhost:3000`

**Verify:** Open `http://localhost:3000` in browser

---

## 🔐 First Login

1. Go to `http://localhost:3000/login`
2. Use default credentials:
   - **Username:** `admin`
   - **Password:** `admin123`
3. You should be redirected to dashboard

---

## ✅ Testing the Integration

### Test 1: Component Management

1. Click **Components** in sidebar
2. Click **Add Component**
3. Fill in:
   - Part Number: `TEST-001`
   - Component Name: `Test Component`
   - Current Stock: `100`
   - Monthly Required: `500`
4. Click **Create**
5. Component should appear in table

### Test 2: PCB Configuration

1. Click **PCBs** in sidebar
2. Click **Add PCB**
3. Fill in:
   - PCB Code: `PCB-TEST-001`
   - PCB Name: `Test PCB`
4. Click **Create**
5. Click on the PCB card to open details
6. Click **Add Component**
7. Select the test component
8. Enter quantity per PCB: `5`
9. Click **Add**
10. Component mapping should appear

### Test 3: Production Entry

1. Click **Production** in sidebar
2. Select **PCB-Based Production** mode
3. Select your test PCB
4. Enter quantity produced: `2`
5. Enter lot number: `LOT-TEST-001`
6. Click **Create Production Entry**
7. Success message should appear
8. Stock should be deducted: 100 - (5 × 2) = 90

### Test 4: Analytics

1. Click **Analytics** in sidebar
2. You should see:
   - Top consumed components chart
   - Production efficiency table
3. Data should reflect the production entry

### Test 5: Excel Export

1. Click **Excel Management** in sidebar
2. Click **Export Inventory**
3. File should download: `inventory_YYYY-MM-DD.xlsx`
4. Open in Excel to verify data

---

## 🔧 Troubleshooting

### Backend Not Starting

**Error:** `ECONNREFUSED`

**Solution:**
```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Start PostgreSQL
sudo service postgresql start

# Verify database exists
psql -U postgres -l | grep pcb_inventory
```

---

### Frontend Can't Connect to Backend

**Error:** Network Error / CORS

**Solution 1 - Check backend CORS:**
```javascript
// In backend server.js
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

**Solution 2 - Check backend URL in frontend:**
```javascript
// In frontend src/api/axiosInstance.js
baseURL: 'http://localhost:5001',  // Make sure this matches backend
```

---

### 401 Unauthorized

**Error:** Token expired / Invalid token

**Solution:**
```bash
# In browser console
localStorage.removeItem('token')
localStorage.removeItem('user')
# Then refresh page and login again
```

---

### Port Already in Use

**Error:** Port 3000 already in use

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- --port 3001
```

---

## 🌐 API Endpoints Reference

### Working Endpoints

**GET /health** → Server health check  
**POST /api/auth/login** → Login  
**GET /api/components** → Get all components  
**POST /api/production** → Create production entry  
**GET /api/analytics/top-consumed** → Analytics data  

See `backend/API_DOCUMENTATION.md` for complete list.

---

## 📊 Data Flow

```
User Action (Frontend)
    ↓
Axios Request (with JWT token)
    ↓
Backend API Endpoint
    ↓
Database Query (PostgreSQL)
    ↓
Response JSON
    ↓
Frontend Updates UI
```

---

## 🔐 Security Notes

### JWT Token Management

1. **Storage:** Token stored in `localStorage`
2. **Expiry:** 24 hours (configurable in backend)
3. **Auto-attach:** Axios interceptor adds to all requests
4. **Auto-logout:** 401 responses trigger logout

### Production Security

**Backend:**
- Change default admin password
- Use environment variables for secrets
- Enable HTTPS
- Set proper CORS origin

**Frontend:**
- Use HTTPS in production
- Don't commit .env files
- Sanitize user inputs

---

## 📱 Running on Different Ports

### Change Backend Port

```javascript
// backend/.env
PORT=5001
```

```javascript
// frontend/src/api/axiosInstance.js
baseURL: 'http://localhost:5001',
```

### Change Frontend Port

```bash
npm run dev -- --port 3001
```

---

## 🚀 Production Deployment

### Backend (e.g., Heroku)

```bash
# In backend directory
heroku create pcb-inventory-api
git push heroku main
heroku config:set DATABASE_URL=postgres://...
```

### Frontend (e.g., Vercel)

```bash
# In frontend directory
vercel

# Set environment variable in Vercel dashboard
VITE_API_URL=https://your-api.herokuapp.com
```

---

## 📦 Complete Setup Script

```bash
#!/bin/bash

# Setup backend
cd pcb-inventory-system
npm install
createdb pcb_inventory
psql -U postgres -d pcb_inventory -f sql/schema.sql
cp .env.example .env
npm run dev &

# Setup frontend
cd ../pcb-frontend
npm install
npm run dev &

echo "✅ Both servers started!"
echo "Backend: http://localhost:5001"
echo "Frontend: http://localhost:3000"
```

Save as `setup.sh` and run: `chmod +x setup.sh && ./setup.sh`

---

## 🎯 Success Checklist

- [ ] PostgreSQL running
- [ ] Backend server running on port 5001
- [ ] Frontend server running on port 3000
- [ ] Can access login page
- [ ] Can login with admin credentials
- [ ] Dashboard loads with data
- [ ] Can create component
- [ ] Can create PCB
- [ ] Can create production entry
- [ ] Analytics page shows charts
- [ ] Excel export works

---

## 📞 Support

**Common issues:**
- CORS errors → Check backend CORS configuration
- 401 errors → Clear localStorage and re-login
- Database errors → Check PostgreSQL is running
- Port conflicts → Use different ports

**Debug mode:**
```bash
# Backend
DEBUG=* npm run dev

# Frontend
npm run dev
# Then open browser DevTools → Network tab
```

---

**Integration Status: ✅ COMPLETE**

Both frontend and backend are ready to run together!
