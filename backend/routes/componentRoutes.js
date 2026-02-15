const express = require('express');
const router = express.Router();
const componentController = require('../controllers/componentController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Component management routes
router.get('/', componentController.getAllComponents);
router.get('/low-stock', componentController.getLowStockComponents);
router.get('/:id', componentController.getComponentById);

// Admin-only routes
router.post('/', requireAdmin, componentController.createComponent);
router.put('/:id', requireAdmin, componentController.updateComponent);
router.delete('/:id', requireAdmin, componentController.deleteComponent);

module.exports = router;
