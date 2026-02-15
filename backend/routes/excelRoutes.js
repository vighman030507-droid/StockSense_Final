const express = require('express');
const router = express.Router();
const { upload } = require('../config/multer');
const excelImportController = require('../controllers/excelImportController');
const excelExportController = require('../controllers/excelExportController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * EXCEL IMPORT/EXPORT ROUTES
 * All routes require JWT authentication
 * Import routes require admin role
 */

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * IMPORT ROUTES (Admin only)
 */

// Upload and import components from Excel
router.post(
  '/import/components',
  requireAdmin,
  upload.single('file'), // Multer middleware for file upload
  excelImportController.importComponents
);

// Download import template
router.get(
  '/import/template',
  excelImportController.downloadTemplate
);

/**
 * EXPORT ROUTES
 */

// Export inventory list
router.get(
  '/export/inventory',
  excelExportController.exportInventory
);

// Export consumption history
router.get(
  '/export/consumption',
  excelExportController.exportConsumption
);

// Export low stock components
router.get(
  '/export/low-stock',
  excelExportController.exportLowStock
);

module.exports = router;
