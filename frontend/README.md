# PCB Inventory Frontend

**Production-Ready React Frontend for PCB Inventory Automation System**

Built for INVICTUS Hackathon 2025 - Electrolyte Solutions

---

## 🎯 Features

### Core Functionality
- ✅ **JWT Authentication** - Secure login with token management
- ✅ **Component Management** - CRUD operations for inventory
- ✅ **PCB Configuration** - Map components to PCBs (Bill of Materials)
- ✅ **Production Entry** - Two modes:
  - PCB-based production (quantity × BOM)
  - Component string mode (e.g., "BZ/IC1/VR1")
- ✅ **Analytics Dashboard** - Charts and insights with Recharts
- ✅ **Excel Integration** - Import/Export functionality
- ✅ **Procurement Triggers** - Low stock alerts management

### UI/UX
- ✅ Modern, responsive design with Tailwind CSS
- ✅ Professional industrial theme
- ✅ Color-coded status indicators
- ✅ Toast notifications for user feedback
- ✅ Loading states and error handling
- ✅ Real-time data updates

---

## 🛠 Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool & dev server
- **React Router v6** - Client-side routing
- **Axios** - HTTP client with interceptors
- **Tailwind CSS** - Styling framework
- **Recharts** - Charts and data visualization
- **React Hook Form** - Form handling
- **React Hot Toast** - Toast notifications
- **Lucide React** - Icon library

---

## 📁 Project Structure

```
src/
├── api/
│   └── axiosInstance.js       # Axios config with JWT interceptor
├── components/
│   ├── Navbar.jsx             # Top navigation bar
│   ├── Sidebar.jsx            # Side navigation menu
│   └── ProtectedRoute.jsx     # Route guard for authentication
├── context/
│   └── AuthContext.jsx        # Global auth state management
├── pages/
│   ├── Login.jsx              # Login page
│   ├── Dashboard.jsx          # Main dashboard with stats
│   ├── Components.jsx         # Component inventory management
│   ├── PCBs.jsx               # PCB configuration & mapping
│   ├── Production.jsx         # Production entry form
│   ├── Analytics.jsx          # Analytics & charts
│   ├── ExcelManagement.jsx    # Import/Export functionality
│   └── Procurement.jsx        # Procurement triggers
├── App.jsx                    # Main app with routing
├── main.jsx                   # Entry point
└── index.css                  # Global styles & Tailwind
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Backend API running on `http://localhost:5001`

### Installation

```bash
# Navigate to frontend directory
cd pcb-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run preview  # Preview production build
```

---

## 🔐 Authentication

### Default Credentials

```
Username: admin
Password: admin123
```

### How It Works

1. **Login** → User enters credentials
2. **JWT Token** → Backend returns token on successful login
3. **Storage** → Token saved to `localStorage`
4. **Interceptor** → Axios automatically attaches token to all requests
5. **Auto-Logout** → 401 responses trigger automatic logout

**Auth Flow:**
```
Login → Store Token → Access Protected Routes → Auto-Attach Token → 401? → Logout
```

---

## 📄 Pages Overview

### 1. Dashboard
- **Route:** `/dashboard`
- **Features:**
  - Total components count
  - Total PCBs count
  - Low stock alerts count
  - Recent production entries
  - Quick action cards

### 2. Components
- **Route:** `/components`
- **Features:**
  - List all components with search
  - Add new components
  - Edit existing components
  - Delete components
  - Low stock highlighting (red background)
  - Status badges (OK/Low Stock/Out of Stock)

### 3. PCBs
- **Route:** `/pcbs`
- **Features:**
  - Grid view of PCBs
  - Create new PCB
  - Edit PCB details
  - Add components to PCB (BOM mapping)
  - View component mapping table
  - Remove components from PCB

### 4. Production
- **Route:** `/production`
- **Features:**
  - **Mode 1:** PCB-based production
    - Select PCB from dropdown
    - Enter quantity produced
    - Auto-deducts based on BOM
  - **Mode 2:** Component string
    - Enter component codes (e.g., "BZ/IC1/VR1")
    - Deducts 1 unit from each
    - Automatic duplicate removal
  - Real-time success/error feedback
  - Stock deduction preview
  - Procurement trigger notifications

### 5. Analytics
- **Route:** `/analytics`
- **Features:**
  - Top 10 consumed components (bar chart)
  - Consumption distribution (pie chart)
  - Low stock components table
  - Production efficiency metrics
  - Date range filtering
  - Summary cards

### 6. Excel Management
- **Route:** `/excel`
- **Features:**
  - **Import:**
    - Download template
    - Upload Excel file
    - Bulk component creation/update
    - Detailed import summary
    - Error reporting
  - **Export:**
    - Inventory report
    - Consumption history
    - Low stock report
  - Automatic file downloads

### 7. Procurement
- **Route:** `/procurement`
- **Features:**
  - View pending triggers
  - View resolved triggers
  - Mark triggers as resolved
  - Trigger statistics
  - Auto-generated alerts (< 20% threshold)

---

## 🔄 API Integration

### Base URL
```javascript
http://localhost:5001
```

### Endpoints Used

**Authentication:**
- `POST /api/auth/login` - Login

**Components:**
- `GET /api/components` - List all
- `POST /api/components` - Create
- `PUT /api/components/:id` - Update
- `DELETE /api/components/:id` - Delete

**PCBs:**
- `GET /api/pcbs` - List all
- `GET /api/pcbs/:id` - Get with mappings
- `POST /api/pcbs` - Create
- `POST /api/pcbs/:pcb_id/components` - Add mapping
- `DELETE /api/pcbs/mappings/:id` - Remove mapping

**Production:**
- `POST /api/production` - Create entry

**Analytics:**
- `GET /api/analytics/top-consumed`
- `GET /api/analytics/low-stock`
- `GET /api/analytics/production-efficiency`

**Excel:**
- `GET /api/excel/import/template`
- `POST /api/excel/import/components`
- `GET /api/excel/export/inventory`
- `GET /api/excel/export/consumption`
- `GET /api/excel/export/low-stock`

**Procurement:**
- `GET /api/production/procurement/triggers`
- `PUT /api/production/procurement/triggers/:id/resolve`

---

## 🎨 Styling Guide

### Tailwind Utility Classes

```css
/* Buttons */
.btn - Base button
.btn-primary - Blue primary button
.btn-secondary - Gray secondary button
.btn-success - Green success button
.btn-danger - Red danger button

/* Forms */
.form-input - Input field styling
.form-label - Label styling
.form-error - Error message styling

/* Cards */
.card - White card with shadow

/* Badges */
.badge - Base badge
.badge-success - Green badge
.badge-warning - Yellow badge
.badge-danger - Red badge
```

### Custom Animations

```css
.animate-fadeIn - Fade in animation
.spinner - Loading spinner
```

---

## 🔧 Configuration

### Update Backend URL

Edit `src/api/axiosInstance.js`:

```javascript
const axiosInstance = axios.create({
  baseURL: 'http://your-backend-url:5000',
  // ...
});
```

Or use environment variables in `vite.config.js`:

```javascript
server: {
  proxy: {
    '/api': {
      target: process.env.VITE_API_URL || 'http://localhost:5001',
      changeOrigin: true,
    }
  }
}
```

---

## 🐛 Troubleshooting

### CORS Issues

Make sure backend has CORS enabled for frontend origin:

```javascript
// Backend server.js
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### 401 Unauthorized

- Check if token is in localStorage: `localStorage.getItem('token')`
- Verify token hasn't expired
- Try logging out and logging in again

### Components Not Loading

- Check backend is running: `http://localhost:5001/health`
- Verify network tab in DevTools
- Check console for errors

---

## 📦 Dependencies

**Production:**
```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.20.1",
  "axios": "^1.6.2",
  "recharts": "^2.10.3",
  "react-hook-form": "^7.49.2",
  "react-hot-toast": "^2.4.1",
  "lucide-react": "^0.303.0"
}
```

**Development:**
```json
{
  "vite": "^5.0.8",
  "@vitejs/plugin-react": "^4.2.1",
  "tailwindcss": "^3.3.6",
  "autoprefixer": "^10.4.16",
  "postcss": "^8.4.32"
}
```

---

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Deploy to Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Environment Variables

Create `.env` file:

```
VITE_API_URL=https://your-api-domain.com
```

---

## 📝 Key Features Checklist

- [x] JWT Authentication with auto-refresh
- [x] Protected routes
- [x] Component CRUD operations
- [x] PCB configuration & BOM mapping
- [x] Production entry (2 modes)
- [x] Real-time stock validation
- [x] Analytics with charts
- [x] Excel import/export
- [x] Procurement trigger management
- [x] Responsive design
- [x] Toast notifications
- [x] Error handling
- [x] Loading states

---

## 🎯 Testing

### Login Test

1. Go to `http://localhost:3000/login`
2. Enter credentials: `admin` / `admin123`
3. Should redirect to dashboard

### Production Flow Test

1. Go to Components → Add a few components
2. Go to PCBs → Create PCB → Map components
3. Go to Production → Select PCB → Enter quantity
4. Submit → Check success message
5. Go to Analytics → Verify consumption chart

### Excel Test

1. Go to Excel Management
2. Download template
3. Fill in component data
4. Upload file
5. Verify import summary

---

## 👥 Support

For issues or questions:
- Check browser console for errors
- Verify backend API is running
- Check network tab in DevTools

---

## 📄 License

Built for INVICTUS Hackathon 2025 - Electrolyte Solutions

---

**Frontend Status: ✅ PRODUCTION READY**

All pages implemented, tested, and ready for deployment!
