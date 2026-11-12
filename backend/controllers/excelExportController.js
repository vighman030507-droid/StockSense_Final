const XLSX = require('xlsx');
const { query } = require('../config/database');

/**
 * EXCEL EXPORT CONTROLLER (Adapted for PCB Inventory System Schema)
 */

/**
 * GET /api/excel/export/inventory
 * Export complete inventory list to Excel
 */
const exportInventory = async (req, res) => {
  try {
    const { includeZeroStock = 'false', sortBy = 'part_number' } = req.query;

    console.log('Exporting inventory...');

    // Validate sortBy
    const validSortColumns = ['part_number', 'component_name', 'current_stock_quantity'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'part_number';

    // Build query
    let queryText = `
      SELECT 
        part_number AS "Part Number",
        component_name AS "Component Name",
        current_stock_quantity AS "Current Stock",
        monthly_required_quantity AS "Monthly Required",
        unit_of_measure AS "Unit",
        CASE 
          WHEN current_stock_quantity <= 0 THEN 'OUT OF STOCK'
          WHEN current_stock_quantity < (monthly_required_quantity * 0.2) THEN 'LOW STOCK'
          WHEN current_stock_quantity < (monthly_required_quantity * 0.5) THEN 'REORDER SOON'
          ELSE 'OK'
        END AS "Status",
        created_at AS "Created Date",
        updated_at AS "Last Updated"
      FROM components
    `;

    if (includeZeroStock === 'false') {
      queryText += ' WHERE current_stock_quantity > 0';
    }

    queryText += ` ORDER BY ${sortColumn}`;

    const result = await query(queryText);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No data to export',
        message: 'No components found matching the criteria'
      });
    }

    console.log(`Exporting ${result.rows.length} components`);

    // Format data for Excel
    const excelData = result.rows.map(row => ({
      'Part Number': row['Part Number'],
      'Component Name': row['Component Name'],
      'Current Stock': parseInt(row['Current Stock']),
      'Monthly Required': parseInt(row['Monthly Required']),
      'Unit': row['Unit'],
      'Stock %': row['Monthly Required'] > 0
        ? ((parseInt(row['Current Stock']) / parseInt(row['Monthly Required'])) * 100).toFixed(1) + '%'
        : 'N/A',
      'Status': row['Status'],
      'Created Date': row['Created Date'] ? new Date(row['Created Date']).toISOString().split('T')[0] : '',
      'Last Updated': row['Last Updated'] ? new Date(row['Last Updated']).toISOString().split('T')[0] : ''
    }));

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // Part Number
      { wch: 35 }, // Component Name
      { wch: 15 }, // Current Stock
      { wch: 18 }, // Monthly Required
      { wch: 10 }, // Unit
      { wch: 12 }, // Stock %
      { wch: 15 }, // Status
      { wch: 15 }, // Created Date
      { wch: 15 }  // Last Updated
    ];

    // Add summary at the top
    const lowStockCount = excelData.filter(row => row['Status'] === 'LOW STOCK' || row['Status'] === 'OUT OF STOCK').length;
    const summary = {
      'Part Number': 'SUMMARY',
      'Component Name': `Total Components: ${result.rows.length}`,
      'Current Stock': '',
      'Monthly Required': '',
      'Unit': '',
      'Stock %': '',
      'Status': `Low Stock: ${lowStockCount}`,
      'Created Date': '',
      'Last Updated': ''
    };

    XLSX.utils.sheet_add_json(worksheet, [summary, {}], { origin: 'A1', skipHeader: false });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `inventory_${timestamp}.xlsx`;

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Send file
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);

    console.log(`Inventory exported: ${filename}`);

  } catch (error) {
    console.error('Inventory export error:', error);
    res.status(500).json({
      success: false,
      error: 'Export failed',
      message: error.message
    });
  }
};

/**
 * GET /api/excel/export/consumption
 * Export consumption history to Excel
 */
const exportConsumption = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      lotNumber,
      componentCode,
      limit = '10000'
    } = req.query;

    const maxLimit = 50000;
    const recordLimit = Math.min(parseInt(limit), maxLimit);

    console.log('Exporting consumption history...');

    // Build query
    let queryText = `
      SELECT 
        ch.id AS "ID",
        ch.lot_number AS "Lot Number",
        c.part_number AS "Part Code",
        c.component_name AS "Component Name",
        ch.quantity_consumed AS "Quantity Consumed",
        ch.stock_before AS "Stock Before",
        ch.stock_after AS "Stock After",
        ch.consumption_date AS "Consumption Date",
        pe.id AS "Production ID",
        pe.quantity_produced AS "Quantity Produced",
        p.pcb_code AS "PCB Code",
        p.pcb_name AS "PCB Name",
        pe.production_date AS "Production Date"
      FROM consumption_history ch
      JOIN components c ON ch.component_id = c.id
      JOIN production_entries pe ON ch.production_entry_id = pe.id
      LEFT JOIN pcbs p ON pe.pcb_id = p.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (startDate && endDate) {
      paramCount += 2;
      queryText += ` AND ch.consumption_date BETWEEN $${paramCount - 1} AND $${paramCount}`;
      params.push(startDate, endDate);
    }

    if (lotNumber) {
      paramCount++;
      queryText += ` AND ch.lot_number = $${paramCount}`;
      params.push(lotNumber);
    }

    if (componentCode) {
      paramCount++;
      queryText += ` AND c.part_number = $${paramCount}`;
      params.push(componentCode);
    }

    queryText += ` ORDER BY ch.consumption_date DESC, ch.id DESC LIMIT $${paramCount + 1}`;
    params.push(recordLimit);

    const result = await query(queryText, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No data to export',
        message: 'No consumption records found matching the criteria'
      });
    }

    console.log(`Exporting ${result.rows.length} consumption records`);

    // Format data for Excel
    const excelData = result.rows.map(row => ({
      'ID': row['ID'],
      'Lot Number': row['Lot Number'],
      'Part Code': row['Part Code'],
      'Component Name': row['Component Name'],
      'Quantity Consumed': parseInt(row['Quantity Consumed']),
      'Stock Before': parseInt(row['Stock Before']),
      'Stock After': parseInt(row['Stock After']),
      'Consumption Date': row['Consumption Date'] ? new Date(row['Consumption Date']).toISOString().split('T')[0] : '',
      'Production ID': row['Production ID'],
      'Quantity Produced': row['Quantity Produced'] || '',
      'PCB Code': row['PCB Code'] || 'Component String',
      'PCB Name': row['PCB Name'] || 'N/A',
      'Production Date': row['Production Date'] ? new Date(row['Production Date']).toISOString().split('T')[0] : ''
    }));

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Consumption History');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 8 },  // ID
      { wch: 20 }, // Lot Number
      { wch: 15 }, // Part Code
      { wch: 30 }, // Component Name
      { wch: 18 }, // Quantity Consumed
      { wch: 15 }, // Stock Before
      { wch: 15 }, // Stock After
      { wch: 18 }, // Consumption Date
      { wch: 15 }, // Production ID
      { wch: 18 }, // Quantity Produced
      { wch: 15 }, // PCB Code
      { wch: 25 }, // PCB Name
      { wch: 15 }  // Production Date
    ];

    // Add summary
    const totalQty = excelData.reduce((sum, row) => sum + parseInt(row['Quantity Consumed']), 0);
    const uniqueLots = new Set(result.rows.map(r => r['Lot Number'])).size;

    const summary = [
      {
        'ID': 'SUMMARY',
        'Lot Number': `Records: ${result.rows.length}`,
        'Part Code': `Lots: ${uniqueLots}`,
        'Component Name': '',
        'Quantity Consumed': totalQty,
        'Stock Before': '',
        'Stock After': '',
        'Consumption Date': '',
        'Production ID': '',
        'Quantity Produced': '',
        'PCB Code': '',
        'PCB Name': '',
        'Production Date': ''
      },
      {}
    ];

    XLSX.utils.sheet_add_json(worksheet, summary, { origin: 'A1', skipHeader: false });

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `consumption_${timestamp}.xlsx`;

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Send file
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);

    console.log(`Consumption history exported: ${filename}`);

  } catch (error) {
    console.error('Consumption export error:', error);
    res.status(500).json({
      success: false,
      error: 'Export failed',
      message: error.message
    });
  }
};

/**
 * GET /api/excel/export/low-stock
 * Export low stock components with reorder calculations
 */
const exportLowStock = async (req, res) => {
  try {
    const thresholdPercent = parseFloat(process.env.PROCUREMENT_THRESHOLD_PERCENTAGE || 20) / 100;

    console.log('Exporting low stock report...');

    // Query low stock components with consumption stats
    const queryText = `
      SELECT 
        c.part_number AS "Part Code",
        c.component_name AS "Component Name",
        c.current_stock_quantity AS "Current Stock",
        c.monthly_required_quantity AS "Monthly Required",
        ROUND((c.current_stock_quantity::NUMERIC / NULLIF(c.monthly_required_quantity, 0)) * 100, 2) AS "Stock %",
        (c.monthly_required_quantity * 0.2) - c.current_stock_quantity AS "Shortage",
        COALESCE(recent.avg_daily_consumption, 0) AS "Avg Daily Usage",
        CASE 
          WHEN COALESCE(recent.avg_daily_consumption, 0) > 0 
          THEN ROUND(c.current_stock_quantity / recent.avg_daily_consumption, 1)
          ELSE NULL 
        END AS "Days Until Stockout",
        recent.last_used AS "Last Used",
        CASE 
          WHEN c.current_stock_quantity <= 0 THEN 'CRITICAL - OUT OF STOCK'
          WHEN c.current_stock_quantity <= (c.monthly_required_quantity * 0.2 * 0.5) THEN 'URGENT'
          WHEN c.current_stock_quantity <= (c.monthly_required_quantity * 0.2) THEN 'REORDER NOW'
          ELSE 'WATCH'
        END AS "Priority"
      FROM components c
      LEFT JOIN (
        SELECT 
          component_id,
          AVG(daily_consumption) AS avg_daily_consumption,
          MAX(day) AS last_used
        FROM (
          SELECT 
            component_id,
            DATE(consumption_date) AS day,
            SUM(quantity_consumed) AS daily_consumption
          FROM consumption_history
          WHERE consumption_date >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY component_id, DATE(consumption_date)
        ) daily
        GROUP BY component_id
      ) recent ON c.id = recent.component_id
      WHERE ROUND((c.current_stock_quantity::NUMERIC / NULLIF(c.monthly_required_quantity, 0)) * 100, 2) <= 20
      ORDER BY 
        CASE 
          WHEN c.current_stock_quantity <= 0 THEN 1
          WHEN c.current_stock_quantity <= (c.monthly_required_quantity * 0.2 * 0.5) THEN 2
          WHEN c.current_stock_quantity <= (c.monthly_required_quantity * 0.2) THEN 3
          ELSE 4
        END,
        c.current_stock_quantity ASC
    `;

    const result = await query(queryText);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No data to export',
        message: 'No low stock components found'
      });
    }

    console.log(`Exporting ${result.rows.length} low stock components`);

    // Format data for Excel
    const excelData = result.rows.map(row => ({
      'Part Code': row['Part Code'],
      'Component Name': row['Component Name'],
      'Current Stock': parseInt(row['Current Stock']),
      'Monthly Required': parseInt(row['Monthly Required']),
      'Stock %': row['Stock %'] ? parseFloat(row['Stock %']).toFixed(1) + '%' : '0%',
      'Shortage': Math.max(0, parseInt(row['Shortage'])),
      'Avg Daily Usage': parseFloat(row['Avg Daily Usage']).toFixed(1),
      'Days Until Stockout': row['Days Until Stockout'] || 'N/A',
      'Last Used': row['Last Used'] ? new Date(row['Last Used']).toISOString().split('T')[0] : 'Never',
      'Priority': row['Priority']
    }));

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Low Stock');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // Part Code
      { wch: 35 }, // Component Name
      { wch: 15 }, // Current Stock
      { wch: 18 }, // Monthly Required
      { wch: 10 }, // Stock %
      { wch: 10 }, // Shortage
      { wch: 16 }, // Avg Daily Usage
      { wch: 18 }, // Days Until Stockout
      { wch: 15 }, // Last Used
      { wch: 25 }  // Priority
    ];

    // Add summary
    const criticalCount = excelData.filter(row => row['Priority'].includes('CRITICAL')).length;
    const urgentCount = excelData.filter(row => row['Priority'] === 'URGENT').length;

    const summary = [
      {
        'Part Code': 'SUMMARY',
        'Component Name': `Low Stock Items: ${result.rows.length}`,
        'Current Stock': '',
        'Monthly Required': '',
        'Stock %': '',
        'Shortage': '',
        'Avg Daily Usage': '',
        'Days Until Stockout': '',
        'Last Used': '',
        'Priority': `Critical: ${criticalCount}, Urgent: ${urgentCount}`
      },
      {}
    ];

    XLSX.utils.sheet_add_json(worksheet, summary, { origin: 'A1', skipHeader: false });

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `low_stock_${timestamp}.xlsx`;

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Send file
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);

    console.log(`Low stock report exported: ${filename}`);

  } catch (error) {
    console.error('Low stock export error:', error);
    res.status(500).json({
      success: false,
      error: 'Export failed',
      message: error.message
    });
  }
};

module.exports = {
  exportInventory,
  exportConsumption,
  exportLowStock
};
