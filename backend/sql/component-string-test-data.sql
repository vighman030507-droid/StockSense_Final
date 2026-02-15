-- Test Data for Component String Production Feature
-- This demonstrates the new "BZ/IC1/VR1/CX1/EC1" functionality

-- First, let's add some components with recognizable part numbers for testing
-- These match common PCB component naming conventions

INSERT INTO components (component_name, part_number, current_stock_quantity, monthly_required_quantity, unit_of_measure, description) VALUES
-- Standard component codes for testing string parser
('Buzzer 5V', 'BZ', 500, 2000, 'pieces', 'Piezo buzzer 5V'),
('IC Voltage Regulator', 'IC1', 300, 1000, 'pieces', 'IC1 7805 voltage regulator'),
('Variable Resistor', 'VR1', 250, 800, 'pieces', 'VR1 10k potentiometer'),
('Ceramic Capacitor', 'CX1', 400, 1500, 'pieces', 'CX1 100nF capacitor'),
('Electrolytic Capacitor', 'EC1', 350, 1200, 'pieces', 'EC1 10uF electrolytic'),
('Diode', 'D1', 600, 2500, 'pieces', 'D1 1N4148 signal diode'),
('Transistor NPN', 'Q1', 450, 1800, 'pieces', 'Q1 BC547 NPN transistor'),
('Resistor Network', 'RN1', 200, 600, 'pieces', 'RN1 resistor network array'),
('IC Timer', 'IC2', 150, 500, 'pieces', 'IC2 555 timer'),
('Crystal Oscillator', 'Y1', 180, 600, 'pieces', 'Y1 16MHz crystal');

-- Sample test cases for component string production

-- Test Case 1: Basic component string with 5 components
-- Component string: "BZ/IC1/VR1/CX1/EC1"
-- Expected behavior:
--   - Parse into: [BZ, IC1, VR1, CX1, EC1]
--   - Validate all exist
--   - Deduct 1 unit from each
--   - Create consumption history for each

-- Test Case 2: Component string with duplicates
-- Component string: "BZ/IC1/BZ/VR1/IC1"
-- Expected behavior:
--   - Parse into: [BZ, IC1, VR1] (duplicates removed)
--   - Deduct 1 unit from each unique component

-- Test Case 3: Component string with whitespace
-- Component string: "BZ / IC1 / VR1 / CX1"
-- Expected behavior:
--   - Trim whitespace
--   - Parse correctly

-- Test Case 4: Invalid component in string
-- Component string: "BZ/INVALID/VR1"
-- Expected behavior:
--   - Return error: "Component(s) not found: INVALID"
--   - NO stock deduction (transaction rollback)

-- Test Case 5: Insufficient stock scenario
-- First, reduce stock for one component
UPDATE components SET current_stock_quantity = 0 WHERE part_number = 'VR1';
-- Component string: "BZ/IC1/VR1/CX1"
-- Expected behavior:
--   - Validate stock for all
--   - Find VR1 has 0 stock (insufficient)
--   - Return error with insufficientStock array
--   - NO stock deduction for any component (transaction rollback)

-- Reset VR1 stock for other tests
UPDATE components SET current_stock_quantity = 250 WHERE part_number = 'VR1';

-- Test Case 6: Procurement trigger generation
-- Set one component to low stock threshold
UPDATE components SET current_stock_quantity = 200, monthly_required_quantity = 1000 WHERE part_number = 'IC2';
-- 200 / 1000 = 20% exactly at threshold
-- After deducting 1 unit: 199 / 1000 = 19.9% (below 20%)
-- Component string: "IC2/BZ"
-- Expected behavior:
--   - Deduct 1 from IC2 (200 -> 199)
--   - Deduct 1 from BZ
--   - Generate procurement trigger for IC2 (stock < 20%)

-- Display summary for testing
SELECT 
    'Component String Test Data Summary' as info,
    COUNT(*) as total_components,
    SUM(current_stock_quantity) as total_stock
FROM components
WHERE part_number IN ('BZ', 'IC1', 'VR1', 'CX1', 'EC1', 'D1', 'Q1', 'RN1', 'IC2', 'Y1');

-- Show components ready for testing
SELECT 
    part_number,
    component_name,
    current_stock_quantity,
    monthly_required_quantity,
    ROUND((current_stock_quantity::decimal / monthly_required_quantity) * 100, 2) as stock_percentage
FROM components
WHERE part_number IN ('BZ', 'IC1', 'VR1', 'CX1', 'EC1', 'D1', 'Q1', 'RN1', 'IC2', 'Y1')
ORDER BY part_number;
