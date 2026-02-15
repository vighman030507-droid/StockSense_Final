const { query } = require('../config/database');
const productionService = require('../services/productionService');

// Create production entry with automatic stock deduction
// Supports two modes:
// 1. PCB-based: Provide pcb_id and quantity_produced (deducts based on PCB-component mapping)
// 2. Component string: Provide component_string (e.g., "BZ/IC1/VR1/CX1/EC1") - deducts 1 unit each
const createProductionEntry = async (req, res) => {
  try {
    const userId = req.user.id;

    // Process production using service layer
    // Service handles all validation, stock deduction, and procurement triggers
    const result = await productionService.processProduction(req.body, userId);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Production entry created successfully',
    });
  } catch (error) {
    console.error('Create production entry error:', error);

    // Handle insufficient stock error
    if (error.message === 'Insufficient stock for production' && error.insufficientStock) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient stock for production',
        insufficientStock: error.insufficientStock,
      });
    }

    // Handle validation errors
    if (
      error.message === 'No components mapped to this PCB' ||
      error.message === 'Either pcb_id or component_string must be provided' ||
      error.message === 'Cannot specify both pcb_id and component_string' ||
      error.message === 'Quantity produced must be greater than 0 for PCB production' ||
      error.message.startsWith('Component(s) not found:') ||
      error.message.startsWith('Invalid component string:')
    ) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create production entry',
    });
  }
};

// Get all production entries
const getAllProductionEntries = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const result = await query(
      `SELECT 
        pe.*,
        p.pcb_name,
        p.pcb_code,
        u.username as created_by_username
      FROM production_entries pe
      LEFT JOIN pcbs p ON pe.pcb_id = p.id
      LEFT JOIN users u ON pe.created_by = u.id
      ORDER BY pe.created_at DESC
      LIMIT $1 OFFSET $2`,
      [parseInt(limit), parseInt(offset)]
    );

    const countResult = await query('SELECT COUNT(*) FROM production_entries');

    res.json({
      success: true,
      data: {
        production_entries: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Get production entries error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch production entries',
    });
  }
};

// Get production entry by ID with consumption details
const getProductionEntryById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get production entry
    const entryResult = await query(
      `SELECT 
        pe.*,
        p.pcb_name,
        p.pcb_code,
        u.username as created_by_username
      FROM production_entries pe
      LEFT JOIN pcbs p ON pe.pcb_id = p.id
      LEFT JOIN users u ON pe.created_by = u.id
      WHERE pe.id = $1`,
      [id]
    );

    if (entryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Production entry not found',
      });
    }

    // Get consumption details
    const consumptionResult = await query(
      `SELECT 
        ch.*,
        c.component_name,
        c.part_number,
        c.unit_of_measure
      FROM consumption_history ch
      JOIN components c ON ch.component_id = c.id
      WHERE ch.production_entry_id = $1
      ORDER BY c.component_name ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        production_entry: {
          ...entryResult.rows[0],
          consumption_records: consumptionResult.rows,
        },
      },
    });
  } catch (error) {
    console.error('Get production entry error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch production entry',
    });
  }
};

// Get consumption history
const getConsumptionHistory = async (req, res) => {
  try {
    const { component_id, start_date, end_date, limit = 100, offset = 0 } = req.query;

    let queryText = `
      SELECT 
        ch.*,
        c.component_name,
        c.part_number,
        c.unit_of_measure,
        pe.pcb_id,
        p.pcb_name,
        pe.quantity_produced
      FROM consumption_history ch
      JOIN components c ON ch.component_id = c.id
      JOIN production_entries pe ON ch.production_entry_id = pe.id
      LEFT JOIN pcbs p ON pe.pcb_id = p.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (component_id) {
      queryText += ` AND ch.component_id = $${paramCount++}`;
      params.push(component_id);
    }

    if (start_date) {
      queryText += ` AND ch.consumption_date >= $${paramCount++}`;
      params.push(start_date);
    }

    if (end_date) {
      queryText += ` AND ch.consumption_date <= $${paramCount++}`;
      params.push(end_date);
    }

    queryText += ` ORDER BY ch.consumption_date DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: {
        consumption_history: result.rows,
        total: result.rows.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Get consumption history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch consumption history',
    });
  }
};

// Get procurement triggers
const getProcurementTriggers = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;

    const result = await query(
      `SELECT 
        pt.*,
        c.component_name,
        c.part_number,
        c.current_stock_quantity,
        c.unit_of_measure
      FROM procurement_triggers pt
      JOIN components c ON pt.component_id = c.id
      WHERE pt.status = $1
      ORDER BY pt.triggered_at DESC`,
      [status]
    );

    res.json({
      success: true,
      data: {
        procurement_triggers: result.rows,
        total: result.rows.length,
      },
    });
  } catch (error) {
    console.error('Get procurement triggers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch procurement triggers',
    });
  }
};

// Resolve procurement trigger
const resolveProcurementTrigger = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const result = await query(
      `UPDATE procurement_triggers 
       SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP, notes = $1
       WHERE id = $2
       RETURNING *`,
      [notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Procurement trigger not found',
      });
    }

    res.json({
      success: true,
      data: {
        procurement_trigger: result.rows[0],
      },
      message: 'Procurement trigger resolved successfully',
    });
  } catch (error) {
    console.error('Resolve procurement trigger error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve procurement trigger',
    });
  }
};

module.exports = {
  createProductionEntry,
  getAllProductionEntries,
  getProductionEntryById,
  getConsumptionHistory,
  getProcurementTriggers,
  resolveProcurementTrigger,
};
