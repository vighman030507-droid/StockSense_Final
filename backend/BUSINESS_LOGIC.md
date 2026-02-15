# Core Business Logic Implementation

**Transaction-Safe Multi-Component Production System**

---

## 🎯 Features Implemented

### 1️⃣ Automated Multi-Component String Parser

**Feature:** Parse component strings like `"BZ/IC1/VR1/CX1/EC1"` and deduct exactly 1 unit from each component.

**Input Format:**
```json
{
  "component_string": "BZ/IC1/VR1/CX1/EC1",
  "lot_number": "LOT-2025-001",
  "notes": "Optional notes"
}
```

**Processing Steps:**
1. Split string by "/" delimiter
2. Trim whitespace from each component code
3. Remove duplicate codes using Set
4. Validate ALL components exist in database
5. Validate ALL components have sufficient stock (≥1 unit)
6. Deduct exactly 1 unit from each unique component

**Example:**
```
Input:  "BZ/IC1/BZ/VR1/IC1/EC1"
Parse:  ["BZ", "IC1", "BZ", "VR1", "IC1", "EC1"]
Unique: ["BZ", "IC1", "VR1", "EC1"]
Action: Deduct 1 unit from: BZ, IC1, VR1, EC1
```

---

### 2️⃣ Hard-Stop Inventory Integrity Guard

**Feature:** Transaction-safe stock deduction with pre-validation and automatic rollback.

**Transaction Flow:**
```
BEGIN TRANSACTION
    ↓
Validate ALL Components Exist
    ↓ (if any missing)
    ROLLBACK → Error: "Component(s) not found: X, Y"
    ↓ (all exist)
Validate ALL Stock Availability
    ↓ (if any insufficient)
    ROLLBACK → Error: "Insufficient stock for production"
    ↓ (all sufficient)
Deduct Stock for Each Component
    ↓
Record Consumption History
    ↓
Generate Procurement Triggers (if needed)
    ↓
COMMIT TRANSACTION
    ↓
Return Success
```

**Key Principles:**
- ✅ **All-or-Nothing**: Either ALL components deducted or NONE
- ✅ **Pre-Validation**: Check EVERYTHING before changing ANYTHING
- ✅ **Atomic Operations**: PostgreSQL transactions ensure consistency
- ✅ **No Partial State**: System never in invalid state

---

### 3️⃣ PCB-Component Mapping Deduction

**Feature:** Deduct components based on PCB Bill of Materials (existing functionality, enhanced with transaction safety).

**Input Format:**
```json
{
  "pcb_id": 1,
  "quantity_produced": 10,
  "lot_number": "LOT-2025-001",
  "notes": "Optional notes"
}
```

**Processing Steps:**
1. Fetch PCB-component mapping from database
2. Calculate required quantity: `quantity_per_pcb × quantity_produced`
3. Validate ALL mapped components have sufficient stock
4. Deduct calculated quantities from each component
5. Record consumption history with lot-level tracking

**Example:**
```
PCB: Arduino Uno Clone
Mapping:
  - Capacitor 10µF × 5 per PCB
  - Resistor 1kΩ × 10 per PCB
  - LED Red × 2 per PCB

Production: 10 units
Deduction:
  - Capacitor: 5 × 10 = 50 units
  - Resistor: 10 × 10 = 100 units
  - LED: 2 × 10 = 20 units
```

---

### 4️⃣ Procurement Trigger Logic

**Feature:** Automatically generate procurement alerts when stock falls below 20% of monthly requirement.

**Trigger Condition:**
```javascript
if (current_stock < (monthly_required_quantity × 0.20)) {
    CREATE procurement_trigger
}
```

**Behavior:**
- ✅ Checks threshold after EACH component deduction
- ✅ Creates trigger with status='pending'
- ✅ Prevents duplicate triggers (one pending trigger per component)
- ✅ Includes stock level, requirement, and threshold percentage
- ✅ Can be resolved by admin with notes

**Example:**
```
Component: Microcontroller ATmega328
Monthly Requirement: 500 units
Threshold (20%): 100 units

Before Production: 105 units (21% - OK)
After Production: 95 units (19% - LOW)
Action: Generate procurement trigger
```

---

## 🏗 Architecture

### Service Layer Pattern

**File Structure:**
```
services/
└── productionService.js    # All business logic

controllers/
└── productionController.js  # HTTP handling only

routes/
└── productionRoutes.js      # Endpoint definitions
```

**Separation of Concerns:**
- **Service Layer**: Business logic, validation, transactions
- **Controller Layer**: HTTP request/response, error mapping
- **Route Layer**: Endpoint configuration, middleware

---

## 📊 Transaction Flow Diagrams

### Component String Production

```
POST /api/production
{
  "component_string": "BZ/IC1/VR1"
}
    ↓
Controller receives request
    ↓
Calls productionService.processProduction()
    ↓
Service identifies: component_string mode
    ↓
BEGIN TRANSACTION
    ↓
Parse: "BZ/IC1/VR1" → ["BZ", "IC1", "VR1"]
    ↓
Query database for components
    ↓
All found? ────NO────> ROLLBACK
    │                      ↓
   YES              Error: "Component(s) not found: X"
    ↓
Check stock: BZ≥1, IC1≥1, VR1≥1
    ↓
All sufficient? ──NO──> ROLLBACK
    │                       ↓
   YES               Error: "Insufficient stock"
    ↓
Create production_entry record
    ↓
For each component:
  - UPDATE components SET stock = stock - 1
  - INSERT into consumption_history
  - Check procurement trigger threshold
    ↓
COMMIT TRANSACTION
    ↓
Return success with:
  - production entry
  - consumption records
  - procurement triggers
```

### PCB-Based Production

```
POST /api/production
{
  "pcb_id": 1,
  "quantity_produced": 10
}
    ↓
Service identifies: pcb_id mode
    ↓
BEGIN TRANSACTION
    ↓
Query PCB-component mapping
    ↓
Mapping exists? ──NO──> ROLLBACK
    │                       ↓
   YES               Error: "No components mapped"
    ↓
Calculate quantities needed:
  Component1: 5 × 10 = 50
  Component2: 10 × 10 = 100
    ↓
Check all stock sufficient?
    ↓
   NO ──> ROLLBACK
    │         ↓
   YES   Error: "Insufficient stock"
    ↓     with insufficientStock array
Create production_entry
    ↓
For each component:
  - Deduct calculated quantity
  - Record consumption
  - Check trigger
    ↓
COMMIT TRANSACTION
    ↓
Return success
```

---

## 🔐 Data Integrity Guarantees

### Database Level

**Constraints:**
```sql
-- Prevent negative stock
CHECK (current_stock_quantity >= 0)

-- Ensure positive requirements
CHECK (monthly_required_quantity > 0)

-- Prevent duplicate PCB-component mappings
UNIQUE(pcb_id, component_id)

-- Referential integrity
FOREIGN KEY constraints on all relationships
```

### Application Level

**Transaction Management:**
- All production operations wrapped in PostgreSQL transactions
- Explicit BEGIN/COMMIT/ROLLBACK
- Isolation ensures concurrent safety

**Validation Order:**
1. Input validation (required fields, types)
2. Business rule validation (stock, mapping)
3. Database operations
4. Post-operation checks (triggers)

---

## 🧪 Error Handling

### Validation Errors (400 Bad Request)

```json
// Missing required fields
{
  "success": false,
  "error": "Either pcb_id or component_string must be provided"
}

// Invalid input
{
  "success": false,
  "error": "Cannot specify both pcb_id and component_string"
}

// Component not found
{
  "success": false,
  "error": "Component(s) not found: XYZ, ABC"
}

// No PCB mapping
{
  "success": false,
  "error": "No components mapped to this PCB"
}
```

### Insufficient Stock (400 Bad Request)

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

### Server Errors (500 Internal Server Error)

```json
{
  "success": false,
  "error": "Failed to create production entry"
}
```

---

## 📝 Code Examples

### Service Layer Function

```javascript
// services/productionService.js

const processComponentStringProduction = async (
  componentString,
  productionData,
  userId
) => {
  return await transaction(async (client) => {
    // 1. Parse component string
    const codes = parseComponentString(componentString);
    // ["BZ", "IC1", "VR1"]
    
    // 2. Validate all exist
    const components = await validateAndFetchComponents(codes, client);
    
    // 3. Check all stock
    const insufficient = validateStockForComponents(components, 1);
    if (insufficient.length > 0) {
      throw new Error('Insufficient stock');
    }
    
    // 4. Create production entry
    const entry = await client.query('INSERT INTO production_entries...');
    
    // 5. Deduct each component
    for (const component of components) {
      await deductComponentStock(component, 1, entry.id, lotNumber, client);
      await checkAndCreateProcurementTrigger(component, newStock, client);
    }
    
    return result;
  });
};
```

### Controller Function

```javascript
// controllers/productionController.js

const createProductionEntry = async (req, res) => {
  try {
    const result = await productionService.processProduction(
      req.body,
      req.user.id
    );
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error.message === 'Insufficient stock for production') {
      return res.status(400).json({
        success: false,
        error: error.message,
        insufficientStock: error.insufficientStock
      });
    }
    // Handle other errors...
  }
};
```

---

## 🎯 API Endpoints

### Create Production Entry

**Endpoint:** `POST /api/production`

**Authentication:** Required (JWT Bearer token)

**Authorization:** Admin role required

**Request Body (Component String Mode):**
```json
{
  "component_string": "BZ/IC1/VR1/CX1/EC1",
  "lot_number": "LOT-2025-001",
  "production_date": "2025-02-14",
  "notes": "Optional production notes"
}
```

**Request Body (PCB Mode):**
```json
{
  "pcb_id": 1,
  "quantity_produced": 10,
  "lot_number": "LOT-2025-001",
  "production_date": "2025-02-14",
  "notes": "Optional production notes"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "productionEntry": {
      "id": 123,
      "pcb_id": null,
      "quantity_produced": 1,
      "production_date": "2025-02-14",
      "lot_number": "LOT-2025-001",
      "notes": "Component string: BZ/IC1/VR1/CX1/EC1",
      "created_at": "2025-02-14T10:30:00Z"
    },
    "consumptionRecords": [
      {
        "id": 456,
        "component_id": 18,
        "component_name": "Buzzer 5V",
        "part_number": "BZ",
        "quantity_consumed": 1,
        "stock_before": 500,
        "stock_after": 499,
        "lot_number": "LOT-2025-001"
      }
      // ... more consumption records
    ],
    "procurementTriggers": [
      {
        "id": 789,
        "component_id": 20,
        "component_name": "Variable Resistor",
        "part_number": "VR1",
        "current_stock": 49,
        "monthly_requirement": 250,
        "threshold_percentage": 20.00,
        "status": "pending"
      }
    ],
    "componentsParsed": ["BZ", "IC1", "VR1", "CX1", "EC1"]
  },
  "message": "Production entry created successfully"
}
```

---

## 📈 Performance Considerations

### Database Optimization

**Indexes Used:**
- `components(part_number)` - Fast component lookup by code
- `pcb_component_mapping(pcb_id, component_id)` - Fast BOM retrieval
- `production_entries(lot_number)` - Fast lot tracking
- `consumption_history(component_id, consumption_date)` - Fast history queries

**Query Optimization:**
- Use `ANY($1::text[])` for batch component lookups
- Single query to fetch all components (no N+1 problem)
- Transaction isolation prevents race conditions

### Concurrent Safety

**PostgreSQL Row-Level Locking:**
- UPDATE statements acquire row locks
- Prevents concurrent deductions from same component
- Serializable isolation ensures consistency

**Connection Pooling:**
- Pool size: 20 connections
- Handles burst traffic
- Automatic connection recycling

---

## 🔍 Testing Strategy

### Unit Tests (Service Layer)
- ✅ Component string parsing (with duplicates, whitespace)
- ✅ Component validation (found/not found)
- ✅ Stock validation (sufficient/insufficient)
- ✅ Procurement trigger conditions

### Integration Tests (Full Flow)
- ✅ Complete production with component string
- ✅ Complete production with PCB ID
- ✅ Transaction rollback on validation error
- ✅ Transaction rollback on insufficient stock
- ✅ Concurrent production requests

### End-to-End Tests (API)
- ✅ All test cases in COMPONENT_STRING_TESTING.md
- ✅ Error scenarios
- ✅ Edge cases

---

## 🚀 Production Deployment Checklist

- [x] Service layer implements all business logic
- [x] Controller layer handles HTTP concerns only
- [x] All operations wrapped in transactions
- [x] Stock validation before ANY deduction
- [x] Complete rollback on ANY error
- [x] Procurement triggers auto-generated
- [x] Consumption history recorded
- [x] Error messages are descriptive
- [x] API documentation complete
- [x] Test cases documented
- [x] Code commented

---

## 📚 Related Documentation

- **COMPONENT_STRING_TESTING.md** - Comprehensive test scenarios
- **API_TESTING.md** - General API testing guide
- **README.md** - Complete system documentation
- **schema.sql** - Database structure

---

**Implementation Status: ✅ COMPLETE**

All core business logic features are implemented, tested, and production-ready.
