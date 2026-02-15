# Quick Setup Guide

**Get the PCB Inventory System running in 10 minutes!**

---

## Prerequisites

Before you begin, ensure you have:
- ✅ Node.js v16+ installed
- ✅ PostgreSQL v12+ installed and running
- ✅ Terminal access
- ✅ A text editor or IDE

---

## Step 1: PostgreSQL Setup (5 minutes)

### Start PostgreSQL Service

**macOS:**
```bash
brew services start postgresql
```

**Linux (Ubuntu):**
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
- Start PostgreSQL service from Services app
- Or use: `pg_ctl -D "C:\Program Files\PostgreSQL\14\data" start`

### Create Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE pcb_inventory;

# Exit
\q
```

### Import Schema

```bash
# From the project root
psql -U postgres -d pcb_inventory -f sql/schema.sql
```

**Expected Output:**
```
CREATE TABLE
CREATE TABLE
...
INSERT 0 5
```

### (Optional) Import Test Data

```bash
psql -U postgres -d pcb_inventory -f sql/test-data.sql
```

---

## Step 2: Backend Setup (3 minutes)

### Install Dependencies

```bash
npm install
```

**Expected packages:**
- express
- pg
- jsonwebtoken
- bcrypt
- cors
- dotenv
- multer
- xlsx

### Configure Environment

```bash
# Copy template
cp .env.example .env
```

**Edit `.env`:**
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=pcb_inventory
DB_USER=postgres
DB_PASSWORD=yourpassword    # Change this!

JWT_SECRET=hackathon-secret-key-2025    # Change this!
JWT_EXPIRES_IN=24h

PROCUREMENT_THRESHOLD_PERCENTAGE=20
```

---

## Step 3: Start the Server (1 minute)

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

**Expected Output:**
```
==================================================
PCB Inventory Automation System
==================================================
🚀 Server running on port 5000
🌍 Environment: development
📊 Database: pcb_inventory
🔗 API Base URL: http://localhost:5000
💚 Health Check: http://localhost:5000/health
==================================================
✓ Database connection established
```

---

## Step 4: Test the System (1 minute)

### Health Check

```bash
curl http://localhost:5000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-02-14T10:30:00.000Z",
  "database": "connected",
  "uptime": 5.2
}
```

### Get Auth Token

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Save the token:**
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5..."
```

### Test Components Endpoint

```bash
curl http://localhost:5000/api/components \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "components": [...],
    "total": 5
  }
}
```

✅ **System is working!**

---

## Step 5: Test Core Functionality (IMPORTANT)

### Test Automatic Stock Deduction

```bash
# 1. Check current stock
curl http://localhost:5000/api/components/1 \
  -H "Authorization: Bearer $TOKEN"

# Note the current_stock_quantity

# 2. Create production entry (produces 10 PCBs)
curl -X POST http://localhost:5000/api/production \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pcb_id": 1,
    "quantity_produced": 10,
    "lot_number": "LOT-TEST-001"
  }'

# 3. Check stock again
curl http://localhost:5000/api/components/1 \
  -H "Authorization: Bearer $TOKEN"

# Stock should be reduced!
```

### Test Procurement Trigger

```bash
# Check for low stock components
curl http://localhost:5000/api/components/low-stock \
  -H "Authorization: Bearer $TOKEN"

# Check procurement triggers
curl http://localhost:5000/api/production/procurement/triggers \
  -H "Authorization: Bearer $TOKEN"
```

---

## Common Issues & Solutions

### Issue: "Cannot connect to database"

**Solution:**
1. Check PostgreSQL is running:
   ```bash
   # macOS/Linux
   pg_isready
   
   # Should output: /tmp:5432 - accepting connections
   ```

2. Verify credentials in `.env`:
   ```bash
   psql -U postgres -d pcb_inventory -c "SELECT NOW();"
   ```

3. Check PostgreSQL logs:
   ```bash
   # macOS
   tail -f /usr/local/var/log/postgres.log
   
   # Linux
   sudo tail -f /var/log/postgresql/postgresql-*.log
   ```

---

### Issue: "Port 5000 already in use"

**Solution:**
1. Find process using port:
   ```bash
   lsof -i :5000
   ```

2. Kill process:
   ```bash
   kill -9 <PID>
   ```

3. Or change port in `.env`:
   ```env
   PORT=5001
   ```

---

### Issue: "Module not found"

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

### Issue: "Invalid token"

**Solution:**
1. Get a fresh token:
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```

2. Ensure `JWT_SECRET` in `.env` hasn't changed

---

### Issue: "Schema import fails"

**Solution:**
1. Drop and recreate database:
   ```bash
   psql -U postgres
   DROP DATABASE pcb_inventory;
   CREATE DATABASE pcb_inventory;
   \q
   ```

2. Import schema again:
   ```bash
   psql -U postgres -d pcb_inventory -f sql/schema.sql
   ```

---

## Next Steps

### 1. Explore the API
- See `API_TESTING.md` for complete endpoint documentation
- See `README.md` for detailed system architecture

### 2. Test Production Flow
```bash
# Create a PCB
curl -X POST http://localhost:5000/api/pcbs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pcb_name": "Test Board",
    "pcb_code": "PCB-TEST-001"
  }'

# Add components to PCB
curl -X POST http://localhost:5000/api/pcbs/1/components \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "component_id": 1,
    "quantity_per_pcb": 5
  }'

# Create production entry
curl -X POST http://localhost:5000/api/production \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pcb_id": 1,
    "quantity_produced": 10,
    "lot_number": "LOT-001"
  }'
```

### 3. Monitor Logs
```bash
# Server logs will show:
# - Database queries
# - API requests
# - Stock deductions
# - Procurement triggers
```

---

## Development Tips

### Use Postman/Thunder Client
1. Create a new collection
2. Set base URL: `http://localhost:5000`
3. Set authorization: Bearer Token
4. Import endpoints from `API_TESTING.md`

### Watch Database Changes
```bash
# Open another terminal
psql -U postgres -d pcb_inventory

# Watch components table
SELECT component_name, current_stock_quantity FROM components;

# Watch procurement triggers
SELECT * FROM procurement_triggers;
```

### Check Server Logs
- All requests logged with timestamp
- Database queries logged with duration
- Errors logged with stack traces

---

## File Structure Reference

```
pcb-inventory-system/
├── config/
│   └── database.js         # PostgreSQL connection
├── controllers/
│   ├── authController.js   # Login, register
│   ├── componentController.js # Component CRUD
│   ├── pcbController.js    # PCB & mapping CRUD
│   └── productionController.js # Production & deduction
├── middleware/
│   └── auth.js             # JWT authentication
├── routes/
│   ├── authRoutes.js
│   ├── componentRoutes.js
│   ├── pcbRoutes.js
│   └── productionRoutes.js
├── sql/
│   ├── schema.sql          # Database schema
│   └── test-data.sql       # Sample data
├── .env                     # Your config
├── .env.example            # Template
├── server.js               # Main entry point
├── package.json
├── README.md               # Full documentation
├── API_TESTING.md          # Testing guide
└── SETUP.md                # This file
```

---

## Security Notes

### Default Credentials
- **Username:** admin
- **Password:** admin123

**⚠️ Change these immediately in production!**

### JWT Secret
- Default secret is for development only
- Use a strong secret in production:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

---

## Support

**Issues during hackathon?**
1. Check this guide's "Common Issues" section
2. Review `README.md` for detailed documentation
3. Check server logs for error messages
4. Verify database connection with `psql`

**Contact:**
- Email: contact@electrolytesoln.com
- Hackathon Discord: #technical-support

---

## Success Checklist

Before starting development, verify:

- [x] PostgreSQL running
- [x] Database created and schema imported
- [x] `.env` configured
- [x] Dependencies installed (`npm install`)
- [x] Server starts successfully (`npm run dev`)
- [x] Health check returns "healthy"
- [x] Can login and get JWT token
- [x] Can fetch components
- [x] Can create production entry
- [x] Stock deduction works
- [x] Procurement triggers generate

**All checked? You're ready to build! 🚀**

---

**Good luck with the hackathon!**

*Built for INVICTUS 2025 by Electrolyte Solutions*
