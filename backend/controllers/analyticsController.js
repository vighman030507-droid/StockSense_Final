const { query } = require('../config/database');

/**
 * ANALYTICS CONTROLLER (Adapted for PCB Inventory System Schema)
 * 
 * Note: Scrap ratio features require ok_count and scrap_count fields in production_entries.
 * These are optional and analytics work without them.
 */

/**
 * GET /api/analytics/component-consumption
 * Component-wise consumption summary with totals and statistics
 */
const getComponentConsumptionSummary = async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;

    let queryText = `
      SELECT 
        c.id as component_id,
        c.part_number as component_code,
        c.component_name,
        c.current_stock_quantity as current_stock,
        c.monthly_required_quantity,
        COUNT(DISTINCT ch.id) AS consumption_transactions,
        COALESCE(SUM(ch.quantity_consumed), 0) AS total_consumed,
        COALESCE(ROUND(AVG(ch.quantity_consumed), 2), 0) AS avg_consumption_per_transaction,
        MAX(ch.consumption_date) AS last_consumed_at
      FROM components c
      LEFT JOIN consumption_history ch ON c.id = ch.component_id
    `;

    const params = [];
    const conditions = [];

    if (startDate && endDate) {
      conditions.push(`ch.consumption_date BETWEEN $${params.length + 1} AND $${params.length + 2}`);
      params.push(startDate, endDate);
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(' AND ')}`;
    }

    queryText += `
      GROUP BY c.id, c.part_number, c.component_name, c.current_stock_quantity, c.monthly_required_quantity
      ORDER BY total_consumed DESC
      LIMIT $${params.length + 1}
    `;
    params.push(limit);

    const result = await query(queryText, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching component consumption summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch component consumption summary',
      message: error.message
    });
  }
};

/**
 * GET /api/analytics/top-consumed
 * Top N most consumed components by quantity
 */
const getTopConsumedComponents = async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;

    let queryText = `
      SELECT 
        c.id as component_id,
        c.part_number as component_code,
        c.component_name,
        c.current_stock_quantity as current_stock,
        SUM(ch.quantity_consumed) AS total_consumed,
        COUNT(DISTINCT ch.production_entry_id) AS production_runs_used,
        ROUND(AVG(ch.quantity_consumed), 2) AS avg_per_consumption,
        MAX(ch.consumption_date) AS last_used
      FROM components c
      INNER JOIN consumption_history ch ON c.id = ch.component_id
    `;

    const params = [];

    if (startDate && endDate) {
      queryText += ` WHERE ch.consumption_date BETWEEN $1 AND $2`;
      params.push(startDate, endDate);
    }

    queryText += `
      GROUP BY c.id, c.part_number, c.component_name, c.current_stock_quantity
      ORDER BY total_consumed DESC
      LIMIT $${params.length + 1}
    `;
    params.push(limit);

    const result = await query(queryText, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching top consumed components:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top consumed components',
      message: error.message
    });
  }
};

/**
 * GET /api/analytics/low-stock
 * Components at or below threshold
 */
const getLowStockComponents = async (req, res) => {
  try {
    const thresholdPercent = parseFloat(process.env.PROCUREMENT_THRESHOLD_PERCENTAGE || 20);

    const queryText = `
      SELECT 
        id as component_id,
        part_number as component_code,
        component_name,
        current_stock_quantity as current_stock,
        monthly_required_quantity,
        ROUND((current_stock_quantity::NUMERIC / NULLIF(monthly_required_quantity::NUMERIC, 0)) * 100, 2) AS stock_percentage,
        (monthly_required_quantity) - current_stock_quantity AS shortage_quantity
      FROM components
      WHERE ROUND((current_stock_quantity::NUMERIC / NULLIF(monthly_required_quantity::NUMERIC, 0)) * 100, 2) <= $1
      ORDER BY stock_percentage ASC, shortage_quantity DESC
    `;

    const result = await query(queryText, [thresholdPercent]);

    res.json({
      success: true,
      count: result.rows.length,
      threshold_percentage: thresholdPercent,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching low stock components:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch low stock components',
      message: error.message
    });
  }
};

/**
 * GET /api/analytics/lot/:lotNumber/consumption
 * List all consumption records for a specific lot
 */
const getLotConsumption = async (req, res) => {
  try {
    const { lotNumber } = req.params;

    const queryText = `
      SELECT 
        ch.id as consumption_id,
        ch.lot_number,
        ch.quantity_consumed,
        ch.consumption_date,
        ch.stock_before,
        ch.stock_after,
        c.part_number as component_code,
        c.component_name,
        pe.id as production_entry_id,
        pe.quantity_produced,
        pe.production_date,
        p.pcb_code,
        p.pcb_name
      FROM consumption_history ch
      JOIN components c ON ch.component_id = c.id
      JOIN production_entries pe ON ch.production_entry_id = pe.id
      LEFT JOIN pcbs p ON pe.pcb_id = p.id
      WHERE ch.lot_number = $1
      ORDER BY ch.consumption_date DESC
    `;

    const result = await query(queryText, [lotNumber]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No consumption records found for this lot',
        lot_number: lotNumber
      });
    }

    res.json({
      success: true,
      lot_number: lotNumber,
      record_count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching lot consumption:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lot consumption',
      message: error.message
    });
  }
};

/**
 * GET /api/analytics/lot/:lotNumber/summary
 * Aggregated consumption summary for a lot
 */
const getLotConsumptionSummary = async (req, res) => {
  try {
    const { lotNumber } = req.params;

    const summaryQuery = `
      SELECT 
        ch.lot_number,
        COUNT(DISTINCT ch.component_id) AS unique_components,
        COUNT(ch.id) AS consumption_transactions,
        SUM(ch.quantity_consumed) AS total_quantity_consumed,
        MIN(ch.consumption_date) AS first_consumption,
        MAX(ch.consumption_date) AS last_consumption,
        COUNT(DISTINCT ch.production_entry_id) AS production_runs
      FROM consumption_history ch
      WHERE ch.lot_number = $1
      GROUP BY ch.lot_number
    `;

    const summaryResult = await query(summaryQuery, [lotNumber]);

    if (summaryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No consumption records found for this lot',
        lot_number: lotNumber
      });
    }

    // Get component breakdown
    const breakdownQuery = `
      SELECT 
        c.part_number as component_code,
        c.component_name,
        SUM(ch.quantity_consumed) AS quantity_consumed
      FROM consumption_history ch
      JOIN components c ON ch.component_id = c.id
      WHERE ch.lot_number = $1
      GROUP BY c.id, c.part_number, c.component_name
      ORDER BY quantity_consumed DESC
    `;

    const breakdown = await query(breakdownQuery, [lotNumber]);

    res.json({
      success: true,
      summary: summaryResult.rows[0],
      component_breakdown: breakdown.rows
    });
  } catch (error) {
    console.error('Error fetching lot consumption summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lot consumption summary',
      message: error.message
    });
  }
};

/**
 * GET /api/analytics/lots
 * List all lots with aggregated statistics
 */
const getAllLots = async (req, res) => {
  try {
    const { startDate, endDate, limit = 50, offset = 0 } = req.query;

    let queryText = `
      SELECT 
        ch.lot_number,
        COUNT(DISTINCT ch.production_entry_id) AS production_runs,
        COUNT(DISTINCT ch.component_id) AS unique_components,
        SUM(ch.quantity_consumed) AS total_consumed,
        MIN(ch.consumption_date) AS first_consumption,
        MAX(ch.consumption_date) AS last_consumption
      FROM consumption_history ch
    `;

    const params = [];

    if (startDate && endDate) {
      queryText += ` WHERE ch.consumption_date BETWEEN $1 AND $2`;
      params.push(startDate, endDate);
    }

    queryText += `
      GROUP BY ch.lot_number
      ORDER BY last_consumption DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);

    const result = await query(queryText, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(DISTINCT lot_number) as total FROM consumption_history`;
    if (startDate && endDate) {
      countQuery += ` WHERE consumption_date BETWEEN $1 AND $2`;
    }

    const countResult = await query(countQuery, startDate && endDate ? [startDate, endDate] : []);
    const totalLots = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      count: result.rows.length,
      total: totalLots,
      limit: parseInt(limit),
      offset: parseInt(offset),
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching lots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch lots',
      message: error.message
    });
  }
};

/**
 * GET /api/analytics/production-efficiency
 * Production efficiency analysis (basic version without scrap data)
 */
const getProductionEfficiency = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const dateFormat = {
      'day': 'YYYY-MM-DD',
      'week': 'IYYY-IW',
      'month': 'YYYY-MM'
    }[groupBy] || 'YYYY-MM-DD';

    let queryText = `
      SELECT 
        TO_CHAR(pe.production_date, '${dateFormat}') AS period,
        COUNT(DISTINCT pe.id) AS production_runs,
        COUNT(DISTINCT pe.pcb_id) AS unique_pcb_types,
        SUM(pe.quantity_produced) AS total_produced,
        ROUND(AVG(pe.quantity_produced::NUMERIC), 2) AS avg_produced_per_run
      FROM production_entries pe
    `;

    const params = [];

    if (startDate && endDate) {
      queryText += ` WHERE pe.production_date BETWEEN $1 AND $2`;
      params.push(startDate, endDate);
    }

    queryText += `
      GROUP BY period
      ORDER BY period DESC
    `;

    const result = await query(queryText, params);

    res.json({
      success: true,
      group_by: groupBy,
      count: result.rows.length,
      data: result.rows,
      note: 'Scrap ratio calculations require ok_count and scrap_count fields in production_entries table'
    });
  } catch (error) {
    console.error('Error fetching production efficiency:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch production efficiency',
      message: error.message
    });
  }
};

module.exports = {
  getComponentConsumptionSummary,
  getTopConsumedComponents,
  getLowStockComponents,
  getLotConsumption,
  getLotConsumptionSummary,
  getAllLots,
  getProductionEfficiency
};
