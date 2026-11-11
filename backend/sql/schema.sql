-- PCB Inventory Automation System - Database Schema
-- PostgreSQL 12+

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS procurement_triggers CASCADE;
DROP TABLE IF EXISTS consumption_history CASCADE;
DROP TABLE IF EXISTS production_entries CASCADE;
DROP TABLE IF EXISTS pcb_component_mapping CASCADE;
DROP TABLE IF EXISTS pcbs CASCADE;
DROP TABLE IF EXISTS components CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users Table (Admin authentication)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Components Table (Electronic components inventory)
CREATE TABLE components (
    id SERIAL PRIMARY KEY,
    component_name VARCHAR(255) NOT NULL,
    part_number VARCHAR(100) UNIQUE NOT NULL,
    current_stock_quantity INTEGER DEFAULT 0 NOT NULL CHECK (current_stock_quantity >= 0),
    monthly_required_quantity INTEGER NOT NULL CHECK (monthly_required_quantity > 0),
    unit_of_measure VARCHAR(50) DEFAULT 'pieces',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PCBs Table (PCB definitions)
CREATE TABLE pcbs (
    id SERIAL PRIMARY KEY,
    pcb_name VARCHAR(255) NOT NULL,
    pcb_code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PCB-Component Mapping (Bill of Materials)
CREATE TABLE pcb_component_mapping (
    id SERIAL PRIMARY KEY,
    pcb_id INTEGER NOT NULL REFERENCES pcbs(id) ON DELETE CASCADE,
    component_id INTEGER NOT NULL REFERENCES components(id) ON DELETE RESTRICT,
    quantity_per_pcb INTEGER NOT NULL CHECK (quantity_per_pcb > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pcb_id, component_id)
);

-- Production Entries (PCB production records)
CREATE TABLE production_entries (
    id SERIAL PRIMARY KEY,
    pcb_id INTEGER REFERENCES pcbs(id) ON DELETE RESTRICT,
    quantity_produced INTEGER NOT NULL CHECK (quantity_produced > 0),
    production_date DATE DEFAULT CURRENT_DATE,
    lot_number VARCHAR(100),
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consumption History (Component usage tracking)
CREATE TABLE consumption_history (
    id SERIAL PRIMARY KEY,
    production_entry_id INTEGER NOT NULL REFERENCES production_entries(id) ON DELETE CASCADE,
    component_id INTEGER NOT NULL REFERENCES components(id) ON DELETE RESTRICT,
    quantity_consumed INTEGER NOT NULL CHECK (quantity_consumed > 0),
    stock_before INTEGER NOT NULL,
    stock_after INTEGER NOT NULL,
    lot_number VARCHAR(100),
    consumption_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Procurement Triggers (Low stock alerts)
CREATE TABLE procurement_triggers (
    id SERIAL PRIMARY KEY,
    component_id INTEGER NOT NULL REFERENCES components(id) ON DELETE CASCADE,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    current_stock INTEGER NOT NULL,
    monthly_requirement INTEGER NOT NULL,
    threshold_percentage DECIMAL(5,2) DEFAULT 20.00,
    status VARCHAR(20) DEFAULT 'pending',
    resolved_at TIMESTAMP,
    notes TEXT,
    UNIQUE(component_id, triggered_at)
);

-- Indexes for performance optimization

-- Users indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Components indexes
CREATE INDEX idx_components_part_number ON components(part_number);
CREATE INDEX idx_components_stock_level ON components(current_stock_quantity);
CREATE INDEX idx_components_name ON components(component_name);

-- PCBs indexes
CREATE INDEX idx_pcbs_code ON pcbs(pcb_code);
CREATE INDEX idx_pcbs_active ON pcbs(is_active);

-- PCB-Component Mapping indexes
CREATE INDEX idx_mapping_pcb ON pcb_component_mapping(pcb_id);
CREATE INDEX idx_mapping_component ON pcb_component_mapping(component_id);

-- Production Entries indexes
CREATE INDEX idx_production_pcb ON production_entries(pcb_id);
CREATE INDEX idx_production_date ON production_entries(production_date);
CREATE INDEX idx_production_lot ON production_entries(lot_number);
CREATE INDEX idx_production_created_at ON production_entries(created_at);

-- Consumption History indexes
CREATE INDEX idx_consumption_production ON consumption_history(production_entry_id);
CREATE INDEX idx_consumption_component ON consumption_history(component_id);
CREATE INDEX idx_consumption_date ON consumption_history(consumption_date);
CREATE INDEX idx_consumption_lot ON consumption_history(lot_number);

-- Procurement Triggers indexes
CREATE INDEX idx_procurement_component ON procurement_triggers(component_id);
CREATE INDEX idx_procurement_status ON procurement_triggers(status);
CREATE INDEX idx_procurement_triggered ON procurement_triggers(triggered_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_components_updated_at BEFORE UPDATE ON components
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pcbs_updated_at BEFORE UPDATE ON pcbs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mapping_updated_at BEFORE UPDATE ON pcb_component_mapping
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE users IS 'Admin users for authentication';
COMMENT ON TABLE components IS 'Electronic components inventory';
COMMENT ON TABLE pcbs IS 'PCB definitions and configurations';
COMMENT ON TABLE pcb_component_mapping IS 'Bill of Materials - components required per PCB';
COMMENT ON TABLE production_entries IS 'PCB production records';
COMMENT ON TABLE consumption_history IS 'Component consumption tracking with lot-level details';
COMMENT ON TABLE procurement_triggers IS 'Low stock alerts for procurement';

-- Seed data: Create default admin user
-- Password: admin123 (hashed with bcrypt, $2b$10$ prefix)
-- In production, this should be changed immediately
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@electrolytesoln.com', '$2b$10$YourHashedPasswordHere', 'admin');

-- Sample components data (for testing)
INSERT INTO components (component_name, part_number, current_stock_quantity, monthly_required_quantity, unit_of_measure) VALUES
('Capacitor 10µF', 'CAP-10UF-001', 1000, 5000, 'pieces'),
('Resistor 1kΩ', 'RES-1K-001', 1500, 6000, 'pieces'),
('LED Red 5mm', 'LED-RED-5MM', 800, 3000, 'pieces'),
('Microcontroller ATmega328', 'MCU-ATMEGA328', 200, 500, 'pieces'),
('Crystal 16MHz', 'XTAL-16MHZ', 300, 800, 'pieces');

-- Sample PCBs data (for testing)
INSERT INTO pcbs (pcb_name, pcb_code, description) VALUES
('Arduino Uno Clone', 'PCB-ARDUINO-UNO', 'Arduino Uno compatible board'),
('LED Controller Board', 'PCB-LED-CTRL', 'Basic LED control PCB'),
('Sensor Interface PCB', 'PCB-SENSOR-IF', 'Multi-sensor interface board');

-- Sample PCB-Component mapping (for testing)
-- Arduino Uno Clone requires:
INSERT INTO pcb_component_mapping (pcb_id, component_id, quantity_per_pcb) VALUES
(1, 1, 5),  -- 5x 10µF capacitors
(1, 2, 10), -- 10x 1kΩ resistors
(1, 3, 2),  -- 2x LEDs
(1, 4, 1),  -- 1x Microcontroller
(1, 5, 1);  -- 1x Crystal

-- LED Controller Board requires:
INSERT INTO pcb_component_mapping (pcb_id, component_id, quantity_per_pcb) VALUES
(2, 1, 2),  -- 2x 10µF capacitors
(2, 2, 8),  -- 8x 1kΩ resistors
(2, 3, 4);  -- 4x LEDs
