# PCB Inventory Automation System

**Core Inventory Engine for PCB Manufacturing**

A robust backend system for automating component inventory management, PCB production tracking, and procurement alerts for Electrolyte Solutions.

---

## 🎯 Overview

This system provides the core inventory engine that:
- ✅ Automatically deducts component stock based on PCB production
- ✅ Tracks component consumption history with lot-level tagging
- ✅ Identifies low-stock components
- ✅ Generates procurement triggers when stock falls below 20% threshold
- ✅ Prevents negative inventory values
- ✅ Maintains data integrity with PostgreSQL transactions

---

## 🛠 Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Relational database
- **pg** - PostgreSQL client (no ORM)
- **JWT** - Authentication
- **bcrypt** - Password hashing

---

## 📁 Project Structure

```
pcb-inventory-system/
├── config/
│   └── database.js           # PostgreSQL connection pool
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── componentController.js # Component management
│   ├── pcbController.js      # PCB & mapping management
│   └── productionController.js # Production & stock deduction
├── services/
│   └── productionService.js  # Production business logic ⭐
├── middleware/
│   └── auth.js               # JWT authentication middleware
├── routes/
│   ├── authRoutes.js         # Auth endpoints
│   ├── componentRoutes.js    # Component endpoints
│   ├── pcbRoutes.js          # PCB endpoints
│   └── productionRoutes.js   # Production endpoints
├── sql/
│   ├── schema.sql            # Database schema & seed data
│   ├── test-data.sql         # Sample test data
│   └── component-string-test-data.sql # Component string tests
├── .env.example              # Environment variables template
├── package.json              # Dependencies
├── server.js                 # Main application entry
├── README.md                 # Complete documentation
├── SETUP.md                  # Quick setup guide
├── API_TESTING.md            # API testing reference
├── BUSINESS_LOGIC.md         # Business logic documentation ⭐
└── COMPONENT_STRING_TESTING.md # Component string feature tests ⭐
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### 1. Clone and Install

```bash
cd pcb-inventory-system
npm install
```

### 2. Database Setup

```bash
# Create database
psql -U postgres
CREATE DATABASE pcb_inventory;
\q

# Run schema
psql -U postgres -d pcb_inventory -f sql/schema.sql
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=pcb_inventory
DB_USER=postgres
DB_PASSWORD=yourpassword

JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=24h

PROCUREMENT_THRESHOLD_PERCENTAGE=20
```

### 4. Start Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will run at: **http://localhost:5000**

---

## 🗄 Database Schema

### Core Tables

#### 1. **users**
```sql
- id (SERIAL PRIMARY KEY)
- username (VARCHAR, UNIQUE)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- role (VARCHAR, default: 'admin')
- created_at, updated_at (TIMESTAMP)
```

#### 2. **components**
```sql
- id (SERIAL PRIMARY KEY)
- component_name (VARCHAR)
- part_number (VARCHAR, UNIQUE)
- current_stock_quantity (INTEGER, CHECK >= 0)
- monthly_required_quantity (INTEGER, CHECK > 0)
- unit_of_measure (VARCHAR)
- description (TEXT)
- created_at, updated_at (TIMESTAMP)
```

#### 3. **pcbs**
```sql
- id (SERIAL PRIMARY KEY)
- pcb_name (VARCHAR)
- pcb_code (VARCHAR, UNIQUE)
- description (TEXT)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

#### 4. **pcb_component_mapping**
```sql
- id (SERIAL PRIMARY KEY)
- pcb_id (FK -> pcbs)
- component_id (FK -> components)
- quantity_per_pcb (INTEGER, CHECK > 0)
- UNIQUE(pcb_id, component_id)
```

#### 5. **production_entries**
```sql
- id (SERIAL PRIMARY KEY)
- pcb_id (FK -> pcbs)
- quantity_produced (INTEGER, CHECK > 0)
- production_date (DATE)
- lot_number (VARCHAR)
- notes (TEXT)
- created_by (FK -> users)
- created_at (TIMESTAMP)
```

#### 6. **consumption_history**
```sql
- id (SERIAL PRIMARY KEY)
- production_entry_id (FK -> production_entries)
- component_id (FK -> components)
- quantity_consumed (INTEGER)
- stock_before (INTEGER)
- stock_after (INTEGER)
- lot_number (VARCHAR)  # Lot-level tagging
- consumption_date (TIMESTAMP)
```

#### 7. **procurement_triggers**
```sql
- id (SERIAL PRIMARY KEY)
- component_id (FK -> components)
- triggered_at (TIMESTAMP)
- current_stock (INTEGER)
- monthly_requirement (INTEGER)
- threshold_percentage (DECIMAL)
- status (VARCHAR: 'pending' | 'resolved')
- resolved_at (TIMESTAMP)
- notes (TEXT)
```

### Key Indexes
- All foreign keys indexed
- `components.part_number` (unique)
- `pcbs.pcb_code` (unique)
- `production_entries.production_date`
- `consumption_history.consumption_date`
- `procurement_triggers.status`

---

## 🔐 Authentication

All protected endpoints require JWT authentication.

### Get Token

```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@electrolytesoln.com",
      "role": "admin"
    }
  }
}
```

### Use Token

Include in all subsequent requests:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📡 API Endpoints

### Health Check

```bash
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-02-14T10:30:00.000Z",
  "database": "connected",
  "uptime": 3600.5
}
```

---

### Components

#### Get All Components
```bash
GET /api/components
Authorization: Bearer {token}
```

#### Get Low Stock Components
```bash
GET /api/components/low-stock
Authorization: Bearer {token}
```

#### Get Component by ID
```bash
GET /api/components/:id
Authorization: Bearer {token}
```

#### Create Component (Admin)
```bash
POST /api/components
Authorization: Bearer {token}
Content-Type: application/json

{
  "component_name": "Capacitor 22µF",
  "part_number": "CAP-22UF-001",
  "current_stock_quantity": 2000,
  "monthly_required_quantity": 8000,
  "unit_of_measure": "pieces",
  "description": "Ceramic capacitor 22µF 50V"
}
```

#### Update Component (Admin)
```bash
PUT /api/components/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "current_stock_quantity": 2500,
  "monthly_required_quantity": 9000
}
```

#### Delete Component (Admin)
```bash
DELETE /api/components/:id
Authorization: Bearer {token}
```

---

### PCBs

#### Get All PCBs
```bash
GET /api/pcbs
Authorization: Bearer {token}
```

#### Get PCB with Components
```bash
GET /api/pcbs/:id
Authorization: Bearer {token}
```

**Response includes component mapping:**
```json
{
  "success": true,
  "data": {
    "pcb": {
      "id": 1,
      "pcb_name": "Arduino Uno Clone",
      "pcb_code": "PCB-ARDUINO-UNO",
      "components": [
        {
          "mapping_id": 1,
          "component_id": 1,
          "component_name": "Capacitor 10µF",
          "part_number": "CAP-10UF-001",
          "quantity_per_pcb": 5,
          "current_stock_quantity": 1000
        }
      ]
    }
  }
}
```

#### Create PCB (Admin)
```bash
POST /api/pcbs
Authorization: Bearer {token}
Content-Type: application/json

{
  "pcb_name": "Sensor Board V2",
  "pcb_code": "PCB-SENSOR-V2",
  "description": "Multi-sensor interface board"
}
```

#### Add Component to PCB (Admin)
```bash
POST /api/pcbs/:pcb_id/components
Authorization: Bearer {token}
Content-Type: application/json

{
  "component_id": 1,
  "quantity_per_pcb": 5
}
```

#### Update Component Mapping (Admin)
```bash
PUT /api/pcbs/mappings/:mapping_id
Authorization: Bearer {token}
Content-Type: application/json

{
  "quantity_per_pcb": 8
}
```

#### Remove Component from PCB (Admin)
```bash
DELETE /api/pcbs/mappings/:mapping_id
Authorization: Bearer {token}
```

---

### Production (Core Engine)

#### Create Production Entry (Admin)
**This is the core functionality - automatic stock deduction**

**Two modes are supported:**

**Mode 1: PCB-Based Production** (deducts based on BOM)
```bash
POST /api/production
Authorization: Bearer {token}
Content-Type: application/json

{
  "pcb_id": 1,
  "quantity_produced": 10,
  "production_date": "2025-02-14",
  "lot_number": "LOT-2025-02-14-001",
  "notes": "Morning shift production"
}
```

**Mode 2: Component String Production** (deducts 1 unit from each component)
```bash
POST /api/production
Authorization: Bearer {token}
Content-Type: application/json

{
  "component_string": "BZ/IC1/VR1/CX1/EC1",
  "lot_number": "LOT-2025-02-14-001",
  "production_date": "2025-02-14",
  "notes": "Component assembly production"
}
```

**Component String Format:**
- Delimiter: `/` (forward slash)
- Example: `"BZ/IC1/VR1/CX1/EC1"`
- Duplicates are automatically removed
- Whitespace is automatically trimmed
- Deducts exactly 1 unit from each unique component

**Success Response:**
```json
{
  "success": true,
  "data": {
    "productionEntry": {
      "id": 1,
      "pcb_id": 1,
      "quantity_produced": 10,
      "lot_number": "LOT-2025-02-14-001"
    },
    "consumptionRecords": [
      {
        "id": 1,
        "component_id": 1,
        "quantity_consumed": 50,
        "stock_before": 1000,
        "stock_after": 950,
        "lot_number": "LOT-2025-02-14-001"
      }
    ],
    "procurementTriggers": [
      {
        "id": 1,
        "component_id": 4,
        "component_name": "Microcontroller",
        "current_stock": 190,
        "monthly_requirement": 500,
        "threshold_percentage": 20.00,
        "status": "pending"
      }
    ]
  }
}
```

**Insufficient Stock Error:**
```json
{
  "success": false,
  "error": "Insufficient stock for production",
  "insufficientStock": [
    {
      "component_name": "Capacitor 10µF",
      "part_number": "CAP-10UF-001",
      "required": 50,
      "available": 30,
      "shortage": 20
    }
  ]
}
```

#### Get All Production Entries
```bash
GET /api/production?limit=50&offset=0
Authorization: Bearer {token}
```

#### Get Production Entry with Details
```bash
GET /api/production/:id
Authorization: Bearer {token}
```

#### Get Consumption History
```bash
GET /api/production/consumption/history?component_id=1&start_date=2025-02-01
Authorization: Bearer {token}
```

#### Get Procurement Triggers
```bash
GET /api/production/procurement/triggers?status=pending
Authorization: Bearer {token}
```

#### Resolve Procurement Trigger (Admin)
```bash
PUT /api/production/procurement/triggers/:id/resolve
Authorization: Bearer {token}
Content-Type: application/json

{
  "notes": "Purchase order PO-2025-001 created"
}
```

---

## 🔄 Core Business Logic

### Automatic Stock Deduction Flow

The system supports **two production modes**:

#### Mode 1: PCB-Based Production

1. **Request Production Entry**
   - User submits PCB ID and quantity

2. **Get Component Requirements**
   - System fetches all components needed for the PCB from `pcb_component_mapping`

3. **Stock Validation**
   - For each component, calculate: `required = quantity_per_pcb × quantity_produced`
   - Check if `current_stock_quantity >= required`
   - If ANY component has insufficient stock, **transaction is blocked**

4. **Atomic Transaction**
   - Create production entry record
   - For each component:
     - Deduct stock: `new_stock = current_stock - consumed`
     - Update `components.current_stock_quantity`
     - Create consumption history record with lot number

5. **Procurement Trigger Check**
   - For each component, after deduction:
   - If `new_stock < (monthly_required_quantity × 0.20)`:
     - Create procurement trigger (if one doesn't already exist)
     - Mark status as 'pending'

6. **Return Response**
   - Production entry details
   - All consumption records
   - Any new procurement triggers

#### Mode 2: Component String Production 🆕

1. **Request Production Entry**
   - User submits component string (e.g., `"BZ/IC1/VR1/CX1/EC1"`)

2. **Parse Component String**
   - Split by "/" delimiter
   - Remove duplicates: `["BZ", "IC1", "BZ", "VR1"]` → `["BZ", "IC1", "VR1"]`
   - Trim whitespace from each code

3. **Stock Validation**
   - Validate ALL components exist in database
   - Check if EACH component has at least 1 unit in stock
   - If ANY component missing or insufficient, **transaction is blocked**

4. **Atomic Transaction**
   - Create production entry record
   - For each unique component:
     - Deduct exactly 1 unit
     - Update `components.current_stock_quantity`
     - Create consumption history record with lot number

5. **Procurement Trigger Check**
   - Same as Mode 1

6. **Return Response**
   - Production entry details
   - All consumption records
   - Any new procurement triggers
   - List of components parsed from string

**Key Feature:** Transaction safety ensures either ALL components are deducted or NONE. No partial deductions allowed.

### Procurement Threshold Logic

```javascript
threshold = monthly_required_quantity × 20%

if (current_stock < threshold) {
  // Create procurement trigger
}
```

**Example:**
- Monthly requirement: 5000 units
- Threshold (20%): 1000 units
- Current stock: 950 units
- **Trigger created** ✅

---

## 🧪 Testing the System

### 1. Create Admin User

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 2. Create Components

```bash
TOKEN="your_jwt_token"

curl -X POST http://localhost:5000/api/components \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "component_name": "Capacitor 10µF",
    "part_number": "CAP-10UF-001",
    "current_stock_quantity": 1000,
    "monthly_required_quantity": 5000
  }'
```

### 3. Create PCB

```bash
curl -X POST http://localhost:5000/api/pcbs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pcb_name": "Test Board",
    "pcb_code": "PCB-TEST-001"
  }'
```

### 4. Map Components to PCB

```bash
curl -X POST http://localhost:5000/api/pcbs/1/components \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "component_id": 1,
    "quantity_per_pcb": 5
  }'
```

### 5. Create Production Entry (Test Automatic Deduction)

```bash
curl -X POST http://localhost:5000/api/production \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pcb_id": 1,
    "quantity_produced": 10,
    "lot_number": "LOT-TEST-001"
  }'
```

### 6. Check Low Stock

```bash
curl -X GET http://localhost:5000/api/components/low-stock \
  -H "Authorization: Bearer $TOKEN"
```

### 7. Check Procurement Triggers

```bash
curl -X GET http://localhost:5000/api/production/procurement/triggers \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔒 Data Integrity Features

### Transaction Safety
- All stock deductions use PostgreSQL transactions
- Either ALL components deducted or NONE (atomicity)
- Prevents partial production entries

### Constraints
- **No negative stock**: `CHECK (current_stock_quantity >= 0)`
- **Positive requirements**: `CHECK (monthly_required_quantity > 0)`
- **Unique mappings**: One component per PCB (unique constraint)
- **Foreign key protection**: Cannot delete components in use

### Audit Trail
- Every stock change recorded in `consumption_history`
- Tracks: before stock, after stock, quantity consumed
- Lot-level tagging for traceability
- Timestamps on all records

---

## 📊 Key Features

✅ **Automatic Stock Deduction**
- Real-time inventory updates on production entry
- Prevents manual errors

✅ **Procurement Automation**
- 20% threshold monitoring
- Automatic low-stock alerts
- No duplicate triggers for same component

✅ **Data Consistency**
- PostgreSQL transactions ensure atomicity
- Foreign key constraints prevent orphaned records
- Check constraints prevent invalid data

✅ **Lot-Level Tracking**
- Full traceability of component consumption
- Historical analysis by lot number

✅ **Scalable Architecture**
- Connection pooling for performance
- Indexed queries for fast lookups
- Modular controller structure

---

## 🚧 Not Implemented (As Per Requirements)

- ❌ Analytics Dashboard (frontend)
- ❌ Excel Import/Export
- ❌ Advanced forecasting / AI/ML
- ❌ Cloud deployment configuration
- ❌ ERP integrations

---

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_NAME` | Database name | pcb_inventory |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET` | JWT signing key | - |
| `JWT_EXPIRES_IN` | Token expiry | 24h |
| `PROCUREMENT_THRESHOLD_PERCENTAGE` | Low stock threshold | 20 |

---

## 🐛 Troubleshooting

### Database Connection Errors
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U postgres -d pcb_inventory -c "SELECT NOW();"
```

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Permission Denied on Schema Creation
```bash
# Grant privileges
psql -U postgres
GRANT ALL PRIVILEGES ON DATABASE pcb_inventory TO postgres;
```

---

## 👨‍💻 Development

### Running Tests
```bash
npm test  # (not implemented yet)
```

### Code Structure Guidelines
- Controllers: Business logic
- Routes: HTTP endpoint definitions
- Middleware: Cross-cutting concerns (auth, logging)
- Config: Application configuration

---

## 📄 License

ISC License - Electrolyte Solutions

---

## 🤝 Contributing

This project was developed for the INVICTUS Hackathon by ISTE-VESIT.

For questions or support, contact: contact@electrolytesoln.com

---

**Built with ❤️ for INVICTUS Hackathon 2025**
