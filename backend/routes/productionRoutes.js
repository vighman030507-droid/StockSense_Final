const express = require('express');
const router = express.Router();
const productionController = require('../controllers/productionController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Production entry routes
router.post('/', requireAdmin, productionController.createProductionEntry);
router.get('/', productionController.getAllProductionEntries);
router.get('/:id', productionController.getProductionEntryById);

// Consumption history routes
router.get('/consumption/history', productionController.getConsumptionHistory);

// Procurement trigger routes
router.get('/procurement/triggers', productionController.getProcurementTriggers);
router.put('/procurement/triggers/:id/resolve', requireAdmin, productionController.resolveProcurementTrigger);

module.exports = router;
