const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * ANALYTICS ROUTES
 * All routes require JWT authentication
 */

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * DASHBOARD ENDPOINTS
 */

// Component-wise consumption summary
router.get(
  '/component-consumption',
  analyticsController.getComponentConsumptionSummary
);

// Top consumed components
router.get(
  '/top-consumed',
  analyticsController.getTopConsumedComponents
);

// Low stock components
router.get(
  '/low-stock',
  analyticsController.getLowStockComponents
);

/**
 * LOT-BASED REPORTING
 */

// Get all lots with pagination
router.get(
  '/lots',
  analyticsController.getAllLots
);

// Get consumption records for a specific lot
router.get(
  '/lot/:lotNumber/consumption',
  analyticsController.getLotConsumption
);

// Get aggregated summary for a specific lot
router.get(
  '/lot/:lotNumber/summary',
  analyticsController.getLotConsumptionSummary
);

/**
 * PRODUCTION EFFICIENCY
 */

// Production efficiency analysis
router.get(
  '/production-efficiency',
  analyticsController.getProductionEfficiency
);

module.exports = router;
