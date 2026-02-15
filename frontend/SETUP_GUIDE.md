# 🚀 StockSense Frontend Setup Guide

**Frontend configured for StockSense Backend on Port 5001**

---

## ✅ What's Configured

This frontend is **pre-configured** to work with your StockSense backend:

- ✅ Backend URL: `http://localhost:5001`
- ✅ Frontend runs on: `http://localhost:3000`
- ✅ All API calls automatically routed to port 5001
- ✅ JWT authentication integrated
- ✅ CORS proxy configured

---

## 📋 Prerequisites

- Node.js 16+ installed
- npm installed
- StockSense backend running on port 5001

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Extract and Navigate

```bash
# Extract the archive (wherever you downloaded it)
cd ~/Downloads  # or your download location
tar -xzf StockSense-Frontend-5001.tar.gz

# Navigate into the folder
cd StockSense-Frontend-5001
```

### Step 2: Install Dependencies

```bash
npm install
```

**Expected output:**
```
added 250 packages in 15s
```

### Step 3: Start Development Server

```bash
npm run dev
```

**Expected output:**
```
VITE v5.0.8  ready in 500 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

### Step 4: Access Application

Open your browser: **http://localhost:3000**

**Default Login:**
- Username: `admin`
- Password: `admin123` (or whatever you set in your backend)

---

## 🔧 Configuration Files (Already Updated)

These files are **already configured** for port 5001:

### 1. `vite.config.js`
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:5001',  // ✅ Configured
    changeOrigin: true,
  }
}
```

### 2. `src/api/axiosInstance.js`
```javascript
const axiosInstance = axios.create({
  baseURL: 'http://localhost:5001',  // ✅ Configured
});
```

### 3. `.env.example`
```
VITE_API_URL=http://localhost:5001  # ✅ Configured
```

**You don't need to change anything!** Just run `npm install` and `npm run dev`.

---

## 🧪 Testing the Integration

### Before Starting Frontend

**1. Make sure backend is running:**

```bash
# In your StockSense backend folder
cd ~/path/to/StockSense
npm run dev

# You should see:
# Server running on port 5001
```

**2. Test backend health:**

```bash
curl http://localhost:5001/health
# Should return: {"status":"healthy",...}
```

### After Starting Frontend

**1. Open browser:** http://localhost:3000

**2. Check browser console (F12):**
- Should NOT see CORS errors
- API calls should go to `http://localhost:5001`

**3. Test login:**
- Enter your credentials
- Should redirect to dashboard
- Dashboard should load data from backend

---

## 📁 Folder Structure

```
StockSense-Frontend-5001/
├── .gitignore
├── .env.example
├── index.html
├── package.json
├── vite.config.js          # ✅ Port 5001 configured
├── tailwind.config.js
├── postcss.config.js
├── README.md
├── INTEGRATION_GUIDE.md
├── SETUP_GUIDE.md          # ← You are here
├── public/
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── api/
    │   └── axiosInstance.js  # ✅ Port 5001 configured
    ├── components/
    │   ├── Navbar.jsx
    │   ├── Sidebar.jsx
    │   └── ProtectedRoute.jsx
    ├── context/
    │   └── AuthContext.jsx
    └── pages/
        ├── Login.jsx
        ├── Dashboard.jsx
        ├── Components.jsx
        ├── PCBs.jsx
        ├── Production.jsx
        ├── Analytics.jsx
        ├── ExcelManagement.jsx
        └── Procurement.jsx
```

---

## 🔗 Merging into StockSense Repository

### Option 1: Frontend Subfolder

```bash
# Navigate to your StockSense backend repo
cd ~/path/to/StockSense

# Create frontend folder
mkdir frontend

# Copy all files from this folder
cp -r ~/Downloads/StockSense-Frontend-5001/* frontend/

# Update .gitignore
echo "" >> .gitignore
echo "# Frontend" >> .gitignore
echo "frontend/node_modules" >> .gitignore
echo "frontend/dist" >> .gitignore
echo "frontend/.env" >> .gitignore

# Commit
git add .
git commit -m "feat: Add React frontend application"
git push origin main
```

### Option 2: Keep Separate (Recommended for Development)

```bash
# Just work with it as a separate folder during development
cd ~/Downloads/StockSense-Frontend-5001
npm run dev

# Deploy separately later
```

---

## 🐛 Troubleshooting

### Issue 1: "Cannot connect to backend"

**Check:**
```bash
# Is backend running?
curl http://localhost:5001/health

# If not, start it:
cd ~/path/to/StockSense
npm run dev
```

### Issue 2: CORS errors

**Solution:** Your backend should have CORS configured for `http://localhost:3000`

```javascript
// In your backend server.js
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### Issue 3: "Module not found"

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Issue 4: Port 3000 already in use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- --port 3001
```

---

## 📊 API Endpoints Used

This frontend expects these endpoints from your backend:

### Authentication ✅
- `POST /api/auth/login`

### Components ✅
- `GET /api/components`
- `POST /api/components`
- `PUT /api/components/:id`
- `DELETE /api/components/:id`

### PCBs ✅
- `GET /api/pcbs`
- `GET /api/pcbs/:id`
- `POST /api/pcbs`
- `POST /api/pcbs/:id/components`

### Production ✅
- `POST /api/production`
- `GET /api/production`

### Analytics (Optional) ⚠️
- `GET /api/analytics/top-consumed`
- `GET /api/analytics/low-stock`
- `GET /api/analytics/production-efficiency`

### Excel (Optional) ⚠️
- `GET /api/excel/import/template`
- `POST /api/excel/import/components`
- `GET /api/excel/export/inventory`

### Procurement (Optional) ⚠️
- `GET /api/production/procurement/triggers`

**Note:** Analytics, Excel, and Procurement features will only work if you've integrated those modules into your backend. Core features (Components, PCBs, Production) will work with your current backend.

---

## ✅ Quick Checklist

Before starting:
- [ ] Backend running on port 5001
- [ ] Database is set up
- [ ] Can access `http://localhost:5001/health`

After npm install:
- [ ] No installation errors
- [ ] `node_modules` folder created

After npm run dev:
- [ ] Vite starts on port 3000
- [ ] No compilation errors
- [ ] Can access `http://localhost:3000`

After login:
- [ ] Login successful
- [ ] Redirects to dashboard
- [ ] Dashboard loads data
- [ ] No errors in browser console

---

## 🎯 Next Steps

1. **Start both servers:**
   ```bash
   # Terminal 1: Backend
   cd ~/path/to/StockSense
   npm run dev

   # Terminal 2: Frontend
   cd ~/path/to/StockSense-Frontend-5001
   npm run dev
   ```

2. **Test all features:**
   - Login
   - View components
   - Create PCB
   - Enter production
   - View analytics (if available)

3. **Merge into your repo** (see Option 1 above)

4. **Deploy** (when ready):
   - Frontend → Vercel/Netlify
   - Backend → Heroku/Railway

---

## 📞 Need Help?

**Common Issues:**

1. **Can't login** → Check backend `/api/auth/login` endpoint
2. **CORS errors** → Check backend CORS config allows localhost:3000
3. **Data not loading** → Check backend endpoints return correct data structure
4. **404 errors** → Check backend routes match frontend API calls

**Debug Mode:**

```bash
# Check what port backend is actually running on
lsof -i :5001

# Check if frontend can reach backend
curl http://localhost:5001/api/components
```

---

**This frontend is ready to use with your StockSense backend on port 5001!** 🚀

Just run `npm install` and `npm run dev` and you're good to go!
