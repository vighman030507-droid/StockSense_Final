const { query } = require('../config/database');

// Get all components
const getAllComponents = async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        id, 
        component_name, 
        part_number, 
        current_stock_quantity, 
        monthly_required_quantity,
        unit_of_measure,
        description,
        created_at,
        updated_at,
        CASE 
          WHEN current_stock_quantity <= (monthly_required_quantity * 0.2) THEN true
          ELSE false
        END as is_low_stock
      FROM components
      ORDER BY component_name ASC`
    );

    res.json({
      success: true,
      data: {
        components: result.rows,
        total: result.rows.length,
      },
    });
  } catch (error) {
    console.error('Get components error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch components',
    });
  }
};

// Get component by ID
const getComponentById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        id, 
        component_name, 
        part_number, 
        current_stock_quantity, 
        monthly_required_quantity,
        unit_of_measure,
        description,
        created_at,
        updated_at
      FROM components
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Component not found',
      });
    }

    res.json({
      success: true,
      data: {
        component: result.rows[0],
      },
    });
  } catch (error) {
    console.error('Get component error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch component',
    });
  }
};

// Create new component
const createComponent = async (req, res) => {
  try {
    const {
      component_name,
      part_number,
      current_stock_quantity,
      monthly_required_quantity,
      unit_of_measure,
      description,
    } = req.body;

    // Validate required fields
    if (!component_name || !part_number || monthly_required_quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Component name, part number, and monthly required quantity are required',
      });
    }

    const result = await query(
      `INSERT INTO components (
        component_name, 
        part_number, 
        current_stock_quantity, 
        monthly_required_quantity,
        unit_of_measure,
        description
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        component_name,
        part_number,
        current_stock_quantity || 0,
        monthly_required_quantity,
        unit_of_measure || 'pieces',
        description,
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        component: result.rows[0],
      },
      message: 'Component created successfully',
    });
  } catch (error) {
    console.error('Create component error:', error);

    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Component with this part number already exists',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create component',
    });
  }
};

// Update component
const updateComponent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      component_name,
      part_number,
      current_stock_quantity,
      monthly_required_quantity,
      unit_of_measure,
      description,
    } = req.body;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (component_name !== undefined) {
      updates.push(`component_name = $${paramCount++}`);
      values.push(component_name);
    }
    if (part_number !== undefined) {
      updates.push(`part_number = $${paramCount++}`);
      values.push(part_number);
    }
    if (current_stock_quantity !== undefined) {
      updates.push(`current_stock_quantity = $${paramCount++}`);
      values.push(current_stock_quantity);
    }
    if (monthly_required_quantity !== undefined) {
      updates.push(`monthly_required_quantity = $${paramCount++}`);
      values.push(monthly_required_quantity);
    }
    if (unit_of_measure !== undefined) {
      updates.push(`unit_of_measure = $${paramCount++}`);
      values.push(unit_of_measure);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
    }

    values.push(id);
    const result = await query(
      `UPDATE components 
       SET ${updates.join(', ')} 
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Component not found',
      });
    }

    res.json({
      success: true,
      data: {
        component: result.rows[0],
      },
      message: 'Component updated successfully',
    });
  } catch (error) {
    console.error('Update component error:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Component with this part number already exists',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update component',
    });
  }
};

// Delete component
const deleteComponent = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM components WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Component not found',
      });
    }

    res.json({
      success: true,
      message: 'Component deleted successfully',
    });
  } catch (error) {
    console.error('Delete component error:', error);

    // Handle foreign key constraint violation
    if (error.code === '23503') {
      return res.status(409).json({
        success: false,
        error: 'Cannot delete component. It is referenced in PCB mappings or consumption history.',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete component',
    });
  }
};

// Get low stock components
const getLowStockComponents = async (req, res) => {
  try {
    const threshold = parseFloat(process.env.PROCUREMENT_THRESHOLD_PERCENTAGE || 20) / 100;

    const result = await query(
      `
      SELECT 
        id as component_id,
        part_number as component_code,
        component_name,
        current_stock_quantity as current_stock,
        monthly_required_quantity,
        ROUND((current_stock_quantity::NUMERIC / NULLIF(monthly_required_quantity::NUMERIC, 0)) * 100, 2) AS stock_percentage,
        (monthly_required_quantity) - current_stock_quantity AS shortage_quantity
      FROM components
      WHERE ROUND((current_stock_quantity::NUMERIC / NULLIF(monthly_required_quantity::NUMERIC, 0)) * 100, 2) <= 20
      ORDER BY stock_percentage ASC, shortage_quantity DESC
    `
    );

    res.json({
      success: true,
      data: {
        low_stock_components: result.rows,
        total: result.rows.length,
        threshold_percentage: threshold * 100,
      },
    });
  } catch (error) {
    console.error('Get low stock components error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch low stock componentss',
    });
  }
};

module.exports = {
  getAllComponents,
  getComponentById,
  createComponent,
  updateComponent,
  deleteComponent,
  getLowStockComponents,
};
