const { query, transaction } = require('../config/database');

/**
 * Production Service Layer
 * Handles all business logic for production entries, stock deduction, and procurement triggers
 */

/**
 * Parse component string (e.g., "BZ/IC1/VR1/CX1/EC1")
 * Splits by "/", removes duplicates, and returns array of component codes
 */
const parseComponentString = (componentString) => {
  if (!componentString || typeof componentString !== 'string') {
    return [];
  }

  // Split by "/" and trim whitespace
  const components = componentString
    .split('/')
    .map(code => code.trim())
    .filter(code => code.length > 0);

  // Remove duplicates using Set
  const uniqueComponents = [...new Set(components)];

  return uniqueComponents;
};

/**
 * Validate that all component codes exist in the database
 * Returns array of component objects or throws error if any component not found
 */
const validateAndFetchComponents = async (componentCodes, client = null) => {
  if (!componentCodes || componentCodes.length === 0) {
    throw new Error('No component codes provided');
  }

  const queryExecutor = client ? client.query.bind(client) : query;

  // Fetch all components by part_number (component code)
  const result = await queryExecutor(
    `SELECT id, component_name, part_number, current_stock_quantity, monthly_required_quantity
     FROM components
     WHERE part_number = ANY($1::text[])`,
    [componentCodes]
  );

  const foundComponents = result.rows;

  // Check if all requested components were found
  const foundCodes = foundComponents.map(c => c.part_number);
  const missingCodes = componentCodes.filter(code => !foundCodes.includes(code));

  if (missingCodes.length > 0) {
    throw new Error(`Component(s) not found: ${missingCodes.join(', ')}`);
  }

  return foundComponents;
};

/**
 * Validate stock availability for component string deduction
 * Each component needs at least 1 unit (or specified quantity)
 */
const validateStockForComponents = (components, quantityPerComponent = 1) => {
  const insufficientStock = [];

  for (const component of components) {
    const required = quantityPerComponent;
    if (component.current_stock_quantity < required) {
      insufficientStock.push({
        component_name: component.component_name,
        part_number: component.part_number,
        required: required,
        available: component.current_stock_quantity,
        shortage: required - component.current_stock_quantity,
      });
    }
  }

  return insufficientStock;
};

/**
 * Validate stock availability for PCB-based production
 * Checks if all mapped components have sufficient stock
 */
const validateStockForPCB = async (pcbId, quantityProduced, client) => {
  // Get PCB component mapping
  const mappingResult = await client.query(
    `SELECT 
      c.id,
      m.component_id,
      m.quantity_per_pcb,
      c.component_name,
      c.part_number,
      c.current_stock_quantity,
      c.monthly_required_quantity
    FROM pcb_component_mapping m
    JOIN components c ON m.component_id = c.id
    WHERE m.pcb_id = $1`,
    [pcbId]
  );

  if (mappingResult.rows.length === 0) {
    throw new Error('No components mapped to this PCB');
  }

  const components = mappingResult.rows;
  const insufficientStock = [];

  for (const component of components) {
    const required = component.quantity_per_pcb * quantityProduced;
    if (component.current_stock_quantity < required) {
      insufficientStock.push({
        component_name: component.component_name,
        part_number: component.part_number,
        required: required,
        available: component.current_stock_quantity,
        shortage: required - component.current_stock_quantity,
      });
    }
  }

  return { components, insufficientStock };
};

/**
 * Deduct stock for a single component
 * Returns consumption record data
 */
const deductComponentStock = async (
  component,
  quantityToDeduct,
  productionEntryId,
  lotNumber,
  client
) => {
  const stockBefore = component.current_stock_quantity;
  const stockAfter = stockBefore - quantityToDeduct;

  // Update component stock
  await client.query(
    'UPDATE components SET current_stock_quantity = $1 WHERE id = $2',
    [stockAfter, component.id]
  );

  // Create consumption history record
  const consumptionResult = await client.query(
    `INSERT INTO consumption_history 
     (production_entry_id, component_id, quantity_consumed, stock_before, stock_after, lot_number)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [productionEntryId, component.id, quantityToDeduct, stockBefore, stockAfter, lotNumber]
  );

  return {
    consumption: consumptionResult.rows[0],
    stockBefore,
    stockAfter,
  };
};

/**
 * Check and create procurement trigger if needed
 * Trigger created when stock falls below 20% of monthly requirement
 */
const checkAndCreateProcurementTrigger = async (component, stockAfter, client) => {
  const threshold = parseFloat(process.env.PROCUREMENT_THRESHOLD_PERCENTAGE || 20) / 100;
  const thresholdQuantity = component.monthly_required_quantity * threshold;

  if (stockAfter < thresholdQuantity) {
    // Check if trigger already exists for this component (not resolved)
    const existingTrigger = await client.query(
      `SELECT id FROM procurement_triggers 
       WHERE component_id = $1 AND status = 'pending'
       ORDER BY triggered_at DESC LIMIT 1`,
      [component.id]
    );

    if (existingTrigger.rows.length === 0) {
      // Create new procurement trigger
      const triggerResult = await client.query(
        `INSERT INTO procurement_triggers 
         (component_id, current_stock, monthly_requirement, threshold_percentage, status)
         VALUES ($1, $2, $3, $4, 'pending')
         RETURNING *`,
        [component.id, stockAfter, component.monthly_required_quantity, threshold * 100]
      );

      return {
        ...triggerResult.rows[0],
        component_name: component.component_name,
        part_number: component.part_number,
      };
    }
  }

  return null;
};

/**
 * Process production with component string (e.g., "BZ/IC1/VR1/CX1/EC1")
 * TRANSACTION-SAFE: Validates ALL components before ANY deduction
 */
const processComponentStringProduction = async (
  componentString,
  productionData,
  userId
) => {
  return await transaction(async (client) => {
    // 1. Parse component string
    const componentCodes = parseComponentString(componentString);

    if (componentCodes.length === 0) {
      throw new Error('Invalid component string: no components found');
    }

    // 2. Validate and fetch all components
    const components = await validateAndFetchComponents(componentCodes, client);

    // 3. HARD-STOP: Validate ALL stock availability BEFORE any deduction
    const insufficientStock = validateStockForComponents(components, 1);

    if (insufficientStock.length > 0) {
      const error = new Error('Insufficient stock for production');
      error.insufficientStock = insufficientStock;
      throw error;
    }

    // 4. Create production entry
    const productionResult = await client.query(
      `INSERT INTO production_entries 
       (pcb_id, quantity_produced, production_date, lot_number, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        null, // No PCB ID for component string production
        1, // Quantity is always 1 for component string
        productionData.production_date || new Date().toISOString().split('T')[0],
        productionData.lot_number,
        `Component string: ${componentString}${productionData.notes ? ' | ' + productionData.notes : ''}`,
        userId,
      ]
    );

    const productionEntry = productionResult.rows[0];

    // 5. Deduct stock for each component (exactly 1 unit each)
    const consumptionRecords = [];
    const procurementTriggers = [];

    for (const component of components) {
      const { consumption, stockAfter } = await deductComponentStock(
        component,
        1, // Deduct exactly 1 unit
        productionEntry.id,
        productionData.lot_number,
        client
      );

      consumptionRecords.push({
        ...consumption,
        component_name: component.component_name,
        part_number: component.part_number,
      });

      // Check if procurement trigger needed
      const trigger = await checkAndCreateProcurementTrigger(
        component,
        stockAfter,
        client
      );

      if (trigger) {
        procurementTriggers.push(trigger);
      }
    }

    return {
      productionEntry,
      consumptionRecords,
      procurementTriggers,
      componentsParsed: componentCodes,
    };
  });
};

/**
 * Process production with PCB ID (existing functionality)
 * TRANSACTION-SAFE: Validates ALL components before ANY deduction
 */
const processPCBProduction = async (pcbId, quantityProduced, productionData, userId) => {
  return await transaction(async (client) => {
    // 1. HARD-STOP: Validate ALL stock availability BEFORE any deduction
    const { components, insufficientStock } = await validateStockForPCB(
      pcbId,
      quantityProduced,
      client
    );

    if (insufficientStock.length > 0) {
      const error = new Error('Insufficient stock for production');
      error.insufficientStock = insufficientStock;
      throw error;
    }

    // 2. Create production entry
    const productionResult = await client.query(
      `INSERT INTO production_entries 
       (pcb_id, quantity_produced, production_date, lot_number, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        pcbId,
        quantityProduced,
        productionData.production_date || new Date().toISOString().split('T')[0],
        productionData.lot_number,
        productionData.notes,
        userId,
      ]
    );

    const productionEntry = productionResult.rows[0];

    // 3. Deduct stock for each component based on PCB mapping
    const consumptionRecords = [];
    const procurementTriggers = [];

    for (const component of components) {
      const quantityToDeduct = component.quantity_per_pcb * quantityProduced;

      const { consumption, stockAfter } = await deductComponentStock(
        component,
        quantityToDeduct,
        productionEntry.id,
        productionData.lot_number,
        client
      );

      consumptionRecords.push({
        ...consumption,
        component_name: component.component_name,
        part_number: component.part_number,
      });

      // Check if procurement trigger needed
      const trigger = await checkAndCreateProcurementTrigger(
        component,
        stockAfter,
        client
      );

      if (trigger) {
        procurementTriggers.push(trigger);
      }
    }

    return {
      productionEntry,
      consumptionRecords,
      procurementTriggers,
    };
  });
};

/**
 * Main production processing function
 * Routes to appropriate handler based on input (PCB ID or component string)
 */
const processProduction = async (requestData, userId) => {
  const { pcb_id, component_string, quantity_produced, production_date, lot_number, notes } = requestData;

  // Validate input: must have either pcb_id or component_string
  if (!pcb_id && !component_string) {
    throw new Error('Either pcb_id or component_string must be provided');
  }

  if (pcb_id && component_string) {
    throw new Error('Cannot specify both pcb_id and component_string');
  }

  const productionData = {
    production_date,
    lot_number,
    notes,
  };

  // Route to appropriate handler
  if (component_string) {
    // Component string production (e.g., "BZ/IC1/VR1/CX1/EC1")
    return await processComponentStringProduction(component_string, productionData, userId);
  } else {
    // PCB-based production
    if (!quantity_produced || quantity_produced <= 0) {
      throw new Error('Quantity produced must be greater than 0 for PCB production');
    }

    return await processPCBProduction(pcb_id, quantity_produced, productionData, userId);
  }
};

module.exports = {
  parseComponentString,
  validateAndFetchComponents,
  validateStockForComponents,
  validateStockForPCB,
  processProduction,
  processComponentStringProduction,
  processPCBProduction,
};
