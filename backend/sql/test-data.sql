-- Additional Test Data for PCB Inventory System
-- Run this after schema.sql for comprehensive testing

-- This file contains realistic test data for hackathon demonstration

-- Clear existing test data (optional, commented out for safety)
-- DELETE FROM procurement_triggers;
-- DELETE FROM consumption_history;
-- DELETE FROM production_entries;
-- DELETE FROM pcb_component_mapping;
-- DELETE FROM components WHERE id > 5;
-- DELETE FROM pcbs WHERE id > 3;

-- Additional Components
INSERT INTO components (component_name, part_number, current_stock_quantity, monthly_required_quantity, unit_of_measure, description) VALUES
('Resistor 10kΩ', 'RES-10K-001', 2500, 10000, 'pieces', 'Carbon film resistor 10kΩ ±5%'),
('Resistor 220Ω', 'RES-220-001', 3000, 8000, 'pieces', 'Carbon film resistor 220Ω ±5%'),
('Capacitor 100nF', 'CAP-100NF-001', 1800, 7000, 'pieces', 'Ceramic capacitor 100nF 50V'),
('Capacitor 22pF', 'CAP-22PF-001', 500, 2000, 'pieces', 'Ceramic capacitor 22pF 50V'),
('LED Green 5mm', 'LED-GRN-5MM', 600, 2500, 'pieces', 'Green LED 5mm 20mA'),
('LED Blue 5mm', 'LED-BLU-5MM', 400, 2000, 'pieces', 'Blue LED 5mm 20mA'),
('Diode 1N4007', 'DIODE-1N4007', 1200, 4000, 'pieces', 'Rectifier diode 1A 1000V'),
('IC Voltage Regulator 7805', 'IC-7805', 350, 1000, 'pieces', '5V voltage regulator'),
('IC Op-Amp LM358', 'IC-LM358', 280, 800, 'pieces', 'Dual op-amp'),
('Transistor BC547', 'TRANS-BC547', 800, 3000, 'pieces', 'NPN transistor'),
('Push Button', 'SW-PUSH-001', 450, 1500, 'pieces', 'Tactile push button'),
('Potentiometer 10kΩ', 'POT-10K-001', 200, 600, 'pieces', 'Linear potentiometer'),
('Relay 5V', 'RELAY-5V-001', 150, 500, 'pieces', 'SPDT Relay 5V coil'),
('Terminal Block 2-pin', 'TERM-2P-001', 300, 1000, 'pieces', 'Screw terminal block');

-- Additional PCBs
INSERT INTO pcbs (pcb_name, pcb_code, description, is_active) VALUES
('Power Supply Module', 'PCB-PWR-001', '5V regulated power supply board', true),
('Motor Driver Board', 'PCB-MOTOR-001', 'Dual H-bridge motor driver', true),
('IoT Gateway Board', 'PCB-IOT-001', 'WiFi-enabled IoT gateway', true),
('Display Controller', 'PCB-DISP-001', 'LCD display controller board', true);

-- Comprehensive PCB-Component Mappings

-- Sensor Interface PCB (id=3) - Complete BOM
INSERT INTO pcb_component_mapping (pcb_id, component_id, quantity_per_pcb) VALUES
(3, 6, 4),  -- 4x Resistor 10kΩ
(3, 8, 2),  -- 2x Capacitor 100nF
(3, 12, 1), -- 1x IC Op-Amp LM358
(3, 14, 2), -- 2x Push Button
(3, 9, 2);  -- 2x Capacitor 22pF

-- Power Supply Module (id=4) - Complete BOM
INSERT INTO pcb_component_mapping (pcb_id, component_id, quantity_per_pcb) VALUES
(4, 1, 2),  -- 2x Capacitor 10µF
(4, 8, 4),  -- 4x Capacitor 100nF
(4, 11, 1), -- 1x Diode 1N4007
(4, 12, 1), -- 1x IC 7805
(4, 7, 4),  -- 4x Resistor 220Ω
(4, 3, 2),  -- 2x LED Red
(4, 17, 2); -- 2x Terminal Block

-- Motor Driver Board (id=5) - Complete BOM
INSERT INTO pcb_component_mapping (pcb_id, component_id, quantity_per_pcb) VALUES
(5, 6, 8),  -- 8x Resistor 10kΩ
(5, 7, 4),  -- 4x Resistor 220Ω
(5, 1, 6),  -- 6x Capacitor 10µF
(5, 11, 4), -- 4x Diode 1N4007
(5, 13, 4), -- 4x Transistor BC547
(5, 3, 2),  -- 2x LED Red
(5, 9, 2),  -- 2x LED Green
(5, 17, 4); -- 4x Terminal Block

-- IoT Gateway Board (id=6) - Complete BOM
INSERT INTO pcb_component_mapping (pcb_id, component_id, quantity_per_pcb) VALUES
(6, 4, 1),  -- 1x Microcontroller
(6, 5, 1),  -- 1x Crystal 16MHz
(6, 1, 8),  -- 8x Capacitor 10µF
(6, 8, 6),  -- 6x Capacitor 100nF
(6, 9, 2),  -- 2x Capacitor 22pF
(6, 2, 10), -- 10x Resistor 1kΩ
(6, 6, 6),  -- 6x Resistor 10kΩ
(6, 3, 3),  -- 3x LED Red
(6, 9, 1),  -- 1x LED Green
(6, 10, 1), -- 1x LED Blue
(6, 14, 2), -- 2x Push Button
(6, 15, 1); -- 1x Potentiometer

-- Display Controller (id=7) - Complete BOM
INSERT INTO pcb_component_mapping (pcb_id, component_id, quantity_per_pcb) VALUES
(7, 4, 1),  -- 1x Microcontroller
(7, 5, 1),  -- 1x Crystal 16MHz
(7, 1, 4),  -- 4x Capacitor 10µF
(7, 8, 4),  -- 4x Capacitor 100nF
(7, 9, 2),  -- 2x Capacitor 22pF
(7, 2, 8),  -- 8x Resistor 1kΩ
(7, 6, 4),  -- 4x Resistor 10kΩ
(7, 7, 8),  -- 8x Resistor 220Ω
(7, 14, 4); -- 4x Push Button

-- Sample production entries with consumption (for testing history)
-- Note: These will only work if you have sufficient stock after running schema.sql

-- Production Entry 1: Arduino Uno Clone (10 units)
-- This should work with default stock levels
INSERT INTO production_entries (pcb_id, quantity_produced, production_date, lot_number, notes, created_by)
VALUES (1, 10, '2025-02-10', 'LOT-2025-02-10-001', 'Initial production batch', 1);

-- You can manually create consumption records or use the API endpoint
-- The API endpoint is preferred as it handles all logic automatically

-- Note: To test the full workflow:
-- 1. Use the API POST /api/production endpoint to create production entries
-- 2. This will automatically:
--    - Validate stock availability
--    - Deduct stock from components
--    - Create consumption history records
--    - Generate procurement triggers if needed

-- Sample procurement trigger (for testing - normally auto-generated)
-- INSERT INTO procurement_triggers (component_id, current_stock, monthly_requirement, threshold_percentage, status)
-- VALUES (4, 180, 500, 20.00, 'pending');

-- Create a default admin user with a secure password
-- Password: Admin@2025 (hashed)
-- Note: In production, users should change this immediately
-- Use bcrypt to generate: require('bcrypt').hash('Admin@2025', 10)

-- For hackathon testing, you can use the default admin/admin123 from schema.sql
-- Or create additional test users:

INSERT INTO users (username, email, password_hash, role) VALUES
('testadmin', 'test@electrolytesoln.com', '$2b$10$rQYPKvGswIMHnA.8Gu5HvuFZj5QJnXnxLPPKLjL5R5aP0yNKY8qXC', 'admin');
-- Password for testadmin: Test@123

COMMIT;

-- Display summary
SELECT 
    'SETUP COMPLETE' as status,
    (SELECT COUNT(*) FROM components) as total_components,
    (SELECT COUNT(*) FROM pcbs) as total_pcbs,
    (SELECT COUNT(*) FROM pcb_component_mapping) as total_mappings,
    (SELECT COUNT(*) FROM users) as total_users;

-- Show components with current stock levels
SELECT 
    component_name,
    part_number,
    current_stock_quantity,
    monthly_required_quantity,
    ROUND((current_stock_quantity::decimal / monthly_required_quantity) * 100, 2) as stock_percentage
FROM components
ORDER BY stock_percentage ASC;
