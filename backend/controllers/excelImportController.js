const XLSX = require('xlsx');
const { query } = require('../config/database');
const { cleanupFile } = require('../config/multer');

/**
 * EXCEL IMPORT CONTROLLER (Adapted for PCB Inventory System Schema)
 * 
 * Features:
 * - Flexible column mapping
 * - Row-by-row validation
 * - Insert or update (upsert) components
 * - Detailed import summary
 * - Safe error handling with cleanup
 */

/**
 * Standard column mappings
 */
const DEFAULT_COLUMN_MAPPINGS = {
  // Part number variations
  'part_number': 'part_number',
  'part number': 'part_number',
  'part_code': 'part_number',
  'part code': 'part_number',
  'component_code': 'part_number',
  'component code': 'part_number',
  'code': 'part_number',
  'sku': 'part_number',
  
  // Component name variations
  'component_name': 'component_name',
  'component name': 'component_name',
  'part_name': 'component_name',
  'part name': 'component_name',
  'name': 'component_name',
  'description': 'component_name',
  
  // Stock variations
  'stock': 'current_stock_quantity',
  'current_stock': 'current_stock_quantity',
  'current stock': 'current_stock_quantity',
  'current_stock_quantity': 'current_stock_quantity',
  'quantity': 'current_stock_quantity',
  'qty': 'current_stock_quantity',
  'available': 'current_stock_quantity',
  
  // Monthly required variations
  'monthly_required': 'monthly_required_quantity',
  'monthly required': 'monthly_required_quantity',
  'monthly_required_quantity': 'monthly_required_quantity',
  'monthly requirement': 'monthly_required_quantity',
  'min_monthly': 'monthly_required_quantity',
  
  // Unit variations
  'unit': 'unit_of_measure',
  'unit_of_measure': 'unit_of_measure',
  'unit of measure': 'unit_of_measure',
  'uom': 'unit_of_measure'
};

/**
 * Required fields for component import
 */
const REQUIRED_FIELDS = ['part_number', 'component_name', 'monthly_required_quantity'];

/**
 * Numeric fields that need validation
 */
const NUMERIC_FIELDS = ['current_stock_quantity', 'monthly_required_quantity'];

/**
 * POST /api/excel/import/components
 * Import components from Excel with flexible column mapping
 */
const importComponents = async (req, res) => {
  let filePath = null;
  
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please upload an Excel file (.xlsx or .xls)'
      });
    }

    filePath = req.file.path;
    const updateExisting = req.body.updateExisting !== 'false'; // Default true
    
    // Parse custom column mappings if provided
    let customMappings = {};
    if (req.body.columnMappings) {
      try {
        customMappings = JSON.parse(req.body.columnMappings);
      } catch (error) {
        cleanupFile(filePath);
        return res.status(400).json({
          success: false,
          error: 'Invalid column mappings',
          message: 'columnMappings must be valid JSON'
        });
      }
    }

    console.log('Processing Excel file:', req.file.originalname);
    console.log('Update existing:', updateExisting);
    console.log('Custom mappings:', customMappings);

    // Read Excel file
    const workbook = XLSX.readFile(filePath, {
      cellDates: true,
      cellNF: false,
      cellText: false
    });

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: null
    });

    if (rawData.length === 0) {
      cleanupFile(filePath);
      return res.status(400).json({
        success: false,
        error: 'Empty file',
        message: 'The Excel file contains no data rows'
      });
    }

    console.log(`Found ${rawData.length} rows in Excel`);

    // Build column mapping
    const columnMapping = { ...DEFAULT_COLUMN_MAPPINGS, ...customMappings };
    
    // Detect Excel columns
    const excelColumns = Object.keys(rawData[0]);
    console.log('Excel columns:', excelColumns);

    // Map columns to database fields
    const getMappedValue = (row, dbField) => {
      // Try custom mappings first
      for (const [excelCol, mappedField] of Object.entries(customMappings)) {
        if (mappedField === dbField && row.hasOwnProperty(excelCol)) {
          return row[excelCol];
        }
      }
      
      // Try default mappings
      for (const excelCol of excelColumns) {
        const normalizedCol = excelCol.toLowerCase().trim();
        if (columnMapping[normalizedCol] === dbField) {
          return row[excelCol];
        }
      }
      
      return null;
    };

    // Process rows with validation
    const results = {
      total: rawData.length,
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const rowNum = i + 2; // Excel row number

      try {
        // Extract and map fields
        const component = {
          part_number: getMappedValue(row, 'part_number'),
          component_name: getMappedValue(row, 'component_name'),
          current_stock_quantity: getMappedValue(row, 'current_stock_quantity'),
          monthly_required_quantity: getMappedValue(row, 'monthly_required_quantity'),
          unit_of_measure: getMappedValue(row, 'unit_of_measure')
        };

        // Validate required fields
        const missingFields = [];
        for (const field of REQUIRED_FIELDS) {
          if (!component[field] || component[field].toString().trim() === '') {
            missingFields.push(field);
          }
        }

        if (missingFields.length > 0) {
          results.skipped++;
          results.errors.push({
            row: rowNum,
            error: 'Missing required fields',
            fields: missingFields,
            data: row
          });
          continue;
        }

        // Clean and validate numeric fields
        for (const field of NUMERIC_FIELDS) {
          if (component[field] !== null && component[field] !== undefined) {
            const cleaned = component[field].toString().replace(/[^\d.-]/g, '');
            const parsed = parseFloat(cleaned);
            
            if (isNaN(parsed) || parsed < 0) {
              results.skipped++;
              results.errors.push({
                row: rowNum,
                error: `Invalid ${field}`,
                message: `${field} must be a non-negative number`,
                value: component[field]
              });
              continue;
            }
            
            component[field] = Math.floor(parsed);
          } else {
            // Set defaults for optional numeric fields
            if (field === 'current_stock_quantity') component[field] = 0;
          }
        }

        // Trim string fields
        component.part_number = component.part_number.toString().trim();
        component.component_name = component.component_name.toString().trim();
        if (component.unit_of_measure) {
          component.unit_of_measure = component.unit_of_measure.toString().trim();
        } else {
          component.unit_of_measure = 'pieces';
        }

        // Validate part number length
        if (component.part_number.length > 100) {
          results.skipped++;
          results.errors.push({
            row: rowNum,
            error: 'Part number too long',
            message: 'Part number must be 100 characters or less',
            value: component.part_number
          });
          continue;
        }

        // Insert or update component
        if (updateExisting) {
          // UPSERT
          const result = await query(
            `INSERT INTO components (
              part_number, 
              component_name, 
              current_stock_quantity, 
              monthly_required_quantity, 
              unit_of_measure
            )
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (part_number) 
             DO UPDATE SET
               component_name = EXCLUDED.component_name,
               current_stock_quantity = EXCLUDED.current_stock_quantity,
               monthly_required_quantity = EXCLUDED.monthly_required_quantity,
               unit_of_measure = EXCLUDED.unit_of_measure,
               updated_at = CURRENT_TIMESTAMP
             RETURNING (xmax = 0) AS inserted`,
            [
              component.part_number,
              component.component_name,
              component.current_stock_quantity,
              component.monthly_required_quantity,
              component.unit_of_measure
            ]
          );

          if (result.rows[0].inserted) {
            results.inserted++;
          } else {
            results.updated++;
          }
        } else {
          // INSERT only
          try {
            await query(
              `INSERT INTO components (
                part_number, 
                component_name, 
                current_stock_quantity, 
                monthly_required_quantity, 
                unit_of_measure
              )
               VALUES ($1, $2, $3, $4, $5)`,
              [
                component.part_number,
                component.component_name,
                component.current_stock_quantity,
                component.monthly_required_quantity,
                component.unit_of_measure
              ]
            );
            results.inserted++;
          } catch (error) {
            if (error.code === '23505') { // Unique violation
              results.skipped++;
              results.errors.push({
                row: rowNum,
                error: 'Duplicate part number',
                message: 'Component already exists (set updateExisting=true to update)',
                code: component.part_number
              });
            } else {
              throw error;
            }
          }
        }

      } catch (error) {
        console.error(`Error processing row ${rowNum}:`, error);
        results.skipped++;
        results.errors.push({
          row: rowNum,
          error: 'Processing error',
          message: error.message,
          data: row
        });
      }
    }

    // Cleanup file
    cleanupFile(filePath);

    // Calculate success rate
    const successRate = results.total > 0 
      ? ((results.inserted + results.updated) / results.total * 100).toFixed(2)
      : 0;

    console.log('Import completed:', results);

    // Return summary
    res.json({
      success: true,
      message: 'Import completed',
      summary: {
        total_rows: results.total,
        inserted: results.inserted,
        updated: results.updated,
        skipped: results.skipped,
        success_rate: `${successRate}%`
      },
      errors: results.errors.length > 0 ? results.errors.slice(0, 50) : [],
      column_mapping_used: columnMapping,
      detected_columns: excelColumns
    });

  } catch (error) {
    console.error('Excel import error:', error);
    
    // Cleanup on error
    if (filePath) {
      cleanupFile(filePath);
    }

    res.status(500).json({
      success: false,
      error: 'Import failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * GET /api/excel/import/template
 * Download Excel template with correct column headers
 */
const downloadTemplate = async (req, res) => {
  try {
    // Create template data
    const templateData = [
      {
        'Part Number': 'EXAMPLE-001',
        'Component Name': 'Example Component',
        'Current Stock': 100,
        'Monthly Required': 500,
        'Unit': 'pieces'
      },
      {
        'Part Number': 'EXAMPLE-002',
        'Component Name': 'Another Component',
        'Current Stock': 50,
        'Monthly Required': 250,
        'Unit': 'pieces'
      }
    ];

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Components');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, // Part Number
      { wch: 35 }, // Component Name
      { wch: 15 }, // Current Stock
      { wch: 18 }, // Monthly Required
      { wch: 12 }  // Unit
    ];

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Send file
    res.setHeader('Content-Disposition', 'attachment; filename=component_import_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    console.error('Template download error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate template',
      message: error.message
    });
  }
};

module.exports = {
  importComponents,
  downloadTemplate
};
