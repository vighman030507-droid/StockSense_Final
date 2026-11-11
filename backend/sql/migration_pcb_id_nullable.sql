-- StockSense Database Migration
-- Purpose: Allow NULL pcb_id in production_entries for Component-String production runs.
-- This is a safe, additive change that does NOT drop any data or tables.
-- Run this in your Neon PostgreSQL SQL Editor:

ALTER TABLE production_entries ALTER COLUMN pcb_id DROP NOT NULL;
