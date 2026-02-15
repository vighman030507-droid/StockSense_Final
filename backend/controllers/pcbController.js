const { query, transaction } = require('../config/database');

// Get all PCBs
const getAllPCBs = async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        p.id, 
        p.pcb_name, 
        p.pcb_code, 
        p.description,
        p.is_active,
        p.created_at,
        p.updated_at,
        COUNT(m.id) as components_count
      FROM pcbs p
      LEFT JOIN pcb_component_mapping m ON p.id = m.pcb_id
      GROUP BY p.id, p.pcb_name, p.pcb_code, p.description, p.is_active, p.created_at, p.updated_at
      ORDER BY p.pcb_name ASC`
    );

    res.json({
      success: true,
      data: {
        pcbs: result.rows,
        total: result.rows.length,
      },
    });
  } catch (error) {
    console.error('Get PCBs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch PCBs',
    });
  }
};

// Get PCB by ID with component mapping
const getPCBById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get PCB details
    const pcbResult = await query(
      'SELECT * FROM pcbs WHERE id = $1',
      [id]
    );

    if (pcbResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'PCB not found',
      });
    }

    // Get component mapping
    const mappingResult = await query(
      `SELECT 
        m.id as mapping_id,
        m.quantity_per_pcb,
        c.id as component_id,
        c.component_name,
        c.part_number,
        c.current_stock_quantity,
        c.unit_of_measure
      FROM pcb_component_mapping m
      JOIN components c ON m.component_id = c.id
      WHERE m.pcb_id = $1
      ORDER BY c.component_name ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        pcb: {
          ...pcbResult.rows[0],
          components: mappingResult.rows,
        },
      },
    });
  } catch (error) {
    console.error('Get PCB error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch PCB',
    });
  }
};

// Create new PCB
const createPCB = async (req, res) => {
  try {
    const { pcb_name, pcb_code, description, is_active } = req.body;

    // Validate required fields
    if (!pcb_name || !pcb_code) {
      return res.status(400).json({
        success: false,
        error: 'PCB name and code are required',
      });
    }

    const result = await query(
      `INSERT INTO pcbs (pcb_name, pcb_code, description, is_active) 
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [pcb_name, pcb_code, description, is_active !== undefined ? is_active : true]
    );

    res.status(201).json({
      success: true,
      data: {
        pcb: result.rows[0],
      },
      message: 'PCB created successfully',
    });
  } catch (error) {
    console.error('Create PCB error:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'PCB with this code already exists',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create PCB',
    });
  }
};

// Update PCB
const updatePCB = async (req, res) => {
  try {
    const { id } = req.params;
    const { pcb_name, pcb_code, description, is_active } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (pcb_name !== undefined) {
      updates.push(`pcb_name = $${paramCount++}`);
      values.push(pcb_name);
    }
    if (pcb_code !== undefined) {
      updates.push(`pcb_code = $${paramCount++}`);
      values.push(pcb_code);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
    }

    values.push(id);
    const result = await query(
      `UPDATE pcbs 
       SET ${updates.join(', ')} 
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'PCB not found',
      });
    }

    res.json({
      success: true,
      data: {
        pcb: result.rows[0],
      },
      message: 'PCB updated successfully',
    });
  } catch (error) {
    console.error('Update PCB error:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'PCB with this code already exists',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update PCB',
    });
  }
};

// Delete PCB
const deletePCB = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM pcbs WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'PCB not found',
      });
    }

    res.json({
      success: true,
      message: 'PCB deleted successfully',
    });
  } catch (error) {
    console.error('Delete PCB error:', error);

    if (error.code === '23503') {
      return res.status(409).json({
        success: false,
        error: 'Cannot delete PCB. It has production records.',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete PCB',
    });
  }
};

// Add component to PCB (create mapping)
const addComponentToPCB = async (req, res) => {
  try {
    const { pcb_id } = req.params;
    const { component_id, quantity_per_pcb } = req.body;

    // Validate required fields
    if (!component_id || !quantity_per_pcb) {
      return res.status(400).json({
        success: false,
        error: 'Component ID and quantity per PCB are required',
      });
    }

    // Check if PCB exists
    const pcbCheck = await query('SELECT id FROM pcbs WHERE id = $1', [pcb_id]);
    if (pcbCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'PCB not found',
      });
    }

    // Check if component exists
    const componentCheck = await query('SELECT id FROM components WHERE id = $1', [component_id]);
    if (componentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Component not found',
      });
    }

    const result = await query(
      `INSERT INTO pcb_component_mapping (pcb_id, component_id, quantity_per_pcb)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [pcb_id, component_id, quantity_per_pcb]
    );

    res.status(201).json({
      success: true,
      data: {
        mapping: result.rows[0],
      },
      message: 'Component added to PCB successfully',
    });
  } catch (error) {
    console.error('Add component to PCB error:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'This component is already mapped to this PCB',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to add component to PCB',
    });
  }
};

// Update component mapping quantity
const updateComponentMapping = async (req, res) => {
  try {
    const { mapping_id } = req.params;
    const { quantity_per_pcb } = req.body;

    if (!quantity_per_pcb || quantity_per_pcb <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid quantity per PCB is required',
      });
    }

    const result = await query(
      `UPDATE pcb_component_mapping 
       SET quantity_per_pcb = $1
       WHERE id = $2
       RETURNING *`,
      [quantity_per_pcb, mapping_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Mapping not found',
      });
    }

    res.json({
      success: true,
      data: {
        mapping: result.rows[0],
      },
      message: 'Component mapping updated successfully',
    });
  } catch (error) {
    console.error('Update component mapping error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update component mapping',
    });
  }
};

// Remove component from PCB
const removeComponentFromPCB = async (req, res) => {
  try {
    const { mapping_id } = req.params;

    const result = await query(
      'DELETE FROM pcb_component_mapping WHERE id = $1 RETURNING id',
      [mapping_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Mapping not found',
      });
    }

    res.json({
      success: true,
      message: 'Component removed from PCB successfully',
    });
  } catch (error) {
    console.error('Remove component from PCB error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove component from PCB',
    });
  }
};

module.exports = {
  getAllPCBs,
  getPCBById,
  createPCB,
  updatePCB,
  deletePCB,
  addComponentToPCB,
  updateComponentMapping,
  removeComponentFromPCB,
};
