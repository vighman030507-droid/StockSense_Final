# API Testing Guide

Quick reference for testing all endpoints during development.

## Setup

```bash
# Set your token as an environment variable
export TOKEN="your_jwt_token_here"

# Or set base URL
export API_URL="http://localhost:5000"
```

---

## 1. Health Check & Auth

### Health Check
```bash
curl http://localhost:5000/health
```

### Login (Get Token)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Save the token from response:**
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Get Current User
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## 2. Component Management

### Get All Components
```bash
curl http://localhost:5000/api/components \
  -H "Authorization: Bearer $TOKEN"
```

### Get Low Stock Components
```bash
curl http://localhost:5000/api/components/low-stock \
  -H "Authorization: Bearer $TOKEN"
```

### Get Component by ID
```bash
curl http://localhost:5000/api/components/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Create Component
```bash
curl -X POST http://localhost:5000/api/components \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "component_name": "Capacitor 47µF",
    "part_number": "CAP-47UF-001",
    "current_stock_quantity": 500,
    "monthly_required_quantity": 2000,
    "unit_of_measure": "pieces",
    "description": "Electrolytic capacitor 47µF 25V"
  }'
```

### Update Component Stock
```bash
curl -X PUT http://localhost:5000/api/components/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_stock_quantity": 1500
  }'
```

### Delete Component
```bash
curl -X DELETE http://localhost:5000/api/components/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 3. PCB Management

### Get All PCBs
```bash
curl http://localhost:5000/api/pcbs \
  -H "Authorization: Bearer $TOKEN"
```

### Get PCB with Components
```bash
curl http://localhost:5000/api/pcbs/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Create PCB
```bash
curl -X POST http://localhost:5000/api/pcbs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pcb_name": "Custom Sensor Board",
    "pcb_code": "PCB-CUSTOM-001",
    "description": "Temperature and humidity sensor board",
    "is_active": true
  }'
```

### Update PCB
```bash
curl -X PUT http://localhost:5000/api/pcbs/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description",
    "is_active": false
  }'
```

### Add Component to PCB (Create Mapping)
```bash
curl -X POST http://localhost:5000/api/pcbs/1/components \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "component_id": 1,
    "quantity_per_pcb": 5
  }'
```

### Update Component Mapping Quantity
```bash
curl -X PUT http://localhost:5000/api/pcbs/mappings/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity_per_pcb": 8
  }'
```

### Remove Component from PCB
```bash
curl -X DELETE http://localhost:5000/api/pcbs/mappings/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4. Production & Inventory Engine

### Create Production Entry (CORE FEATURE)
**This automatically deducts stock and generates procurement triggers**

```bash
curl -X POST http://localhost:5000/api/production \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pcb_id": 1,
    "quantity_produced": 10,
    "production_date": "2025-02-14",
    "lot_number": "LOT-2025-02-14-001",
    "notes": "Production run for customer order #123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "productionEntry": { ... },
    "consumptionRecords": [
      {
        "component_id": 1,
        "quantity_consumed": 50,
        "stock_before": 1000,
        "stock_after": 950,
        "lot_number": "LOT-2025-02-14-001"
      }
    ],
    "procurementTriggers": [
      {
        "component_name": "Microcontroller",
        "current_stock": 190,
        "threshold_percentage": 20.00,
        "status": "pending"
      }
    ]
  }
}
```

### Test Insufficient Stock Error
```bash
# Try to produce more than available stock
curl -X POST http://localhost:5000/api/production \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pcb_id": 1,
    "quantity_produced": 1000,
    "lot_number": "LOT-TEST-FAIL"
  }'
```

**Expected Error:**
```json
{
  "success": false,
  "error": "Insufficient stock for production",
  "insufficientStock": [
    {
      "component_name": "Capacitor 10µF",
      "required": 5000,
      "available": 1000,
      "shortage": 4000
    }
  ]
}
```

### Get All Production Entries
```bash
curl http://localhost:5000/api/production?limit=50&offset=0 \
  -H "Authorization: Bearer $TOKEN"
```

### Get Production Entry Details
```bash
curl http://localhost:5000/api/production/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Get Consumption History
```bash
# All consumption
curl http://localhost:5000/api/production/consumption/history \
  -H "Authorization: Bearer $TOKEN"

# Filter by component
curl http://localhost:5000/api/production/consumption/history?component_id=1 \
  -H "Authorization: Bearer $TOKEN"

# Filter by date range
curl http://localhost:5000/api/production/consumption/history?start_date=2025-02-01&end_date=2025-02-14 \
  -H "Authorization: Bearer $TOKEN"
```

### Get Procurement Triggers
```bash
# Pending triggers
curl http://localhost:5000/api/production/procurement/triggers?status=pending \
  -H "Authorization: Bearer $TOKEN"

# Resolved triggers
curl http://localhost:5000/api/production/procurement/triggers?status=resolved \
  -H "Authorization: Bearer $TOKEN"
```

### Resolve Procurement Trigger
```bash
curl -X PUT http://localhost:5000/api/production/procurement/triggers/1/resolve \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Purchase order PO-2025-001 created for 5000 units"
  }'
```

---

## 5. Testing Workflow

### Complete Test Scenario

```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.data.token' > token.txt

export TOKEN=$(cat token.txt)

# 2. Check components before production
curl http://localhost:5000/api/components \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data.components[] | {name: .component_name, stock: .current_stock_quantity}'

# 3. Create production entry (10 Arduino boards)
curl -X POST http://localhost:5000/api/production \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pcb_id": 1,
    "quantity_produced": 10,
    "lot_number": "LOT-TEST-001"
  }' | jq '.'

# 4. Check components after production
curl http://localhost:5000/api/components \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data.components[] | {name: .component_name, stock: .current_stock_quantity}'

# 5. Check low stock components
curl http://localhost:5000/api/components/low-stock \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 6. Check procurement triggers
curl http://localhost:5000/api/production/procurement/triggers \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 7. View consumption history
curl http://localhost:5000/api/production/consumption/history \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

---

## 6. Postman/Thunder Client Collection

### Import These as Collection Items

**Collection Name:** PCB Inventory System

**Variables:**
- `baseUrl`: http://localhost:5000
- `token`: (set after login)

**Requests:**

1. **Auth - Login**
   - Method: POST
   - URL: {{baseUrl}}/api/auth/login
   - Body: `{"username":"admin","password":"admin123"}`

2. **Components - Get All**
   - Method: GET
   - URL: {{baseUrl}}/api/components
   - Headers: `Authorization: Bearer {{token}}`

3. **Production - Create Entry**
   - Method: POST
   - URL: {{baseUrl}}/api/production
   - Headers: `Authorization: Bearer {{token}}`
   - Body: 
   ```json
   {
     "pcb_id": 1,
     "quantity_produced": 10,
     "lot_number": "LOT-TEST"
   }
   ```

---

## 7. Quick Testing Commands

### Test Stock Deduction Logic
```bash
# Before production
STOCK_BEFORE=$(curl -s http://localhost:5000/api/components/1 \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data.component.current_stock_quantity')

echo "Stock before: $STOCK_BEFORE"

# Create production
curl -X POST http://localhost:5000/api/production \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pcb_id":1,"quantity_produced":5,"lot_number":"LOT-QA"}'

# After production
STOCK_AFTER=$(curl -s http://localhost:5000/api/components/1 \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data.component.current_stock_quantity')

echo "Stock after: $STOCK_AFTER"
echo "Consumed: $((STOCK_BEFORE - STOCK_AFTER))"
```

### Test Procurement Trigger
```bash
# Update component to low stock
curl -X PUT http://localhost:5000/api/components/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"current_stock_quantity": 100}'

# Produce to trigger procurement
curl -X POST http://localhost:5000/api/production \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pcb_id":1,"quantity_produced":1,"lot_number":"LOT-TRIGGER"}'

# Check triggers
curl http://localhost:5000/api/production/procurement/triggers \
  -H "Authorization: Bearer $TOKEN" | jq '.data.procurement_triggers'
```

---

## 8. Response Status Codes

- **200**: Success (GET, PUT)
- **201**: Created (POST)
- **400**: Bad Request (validation errors, insufficient stock)
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found (resource doesn't exist)
- **409**: Conflict (duplicate data, constraint violation)
- **500**: Internal Server Error

---

## 9. Common Error Responses

### Insufficient Stock
```json
{
  "success": false,
  "error": "Insufficient stock for production",
  "insufficientStock": [...]
}
```

### Invalid Token
```json
{
  "success": false,
  "error": "Invalid or expired token."
}
```

### Validation Error
```json
{
  "success": false,
  "error": "Component name, part number, and monthly required quantity are required"
}
```

### Duplicate Entry
```json
{
  "success": false,
  "error": "Component with this part number already exists"
}
```

---

**Happy Testing! 🚀**
