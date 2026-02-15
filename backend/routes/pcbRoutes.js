const express = require('express');
const router = express.Router();
const pcbController = require('../controllers/pcbController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// PCB management routes
router.get('/', pcbController.getAllPCBs);
router.get('/:id', pcbController.getPCBById);

// Admin-only routes
router.post('/', requireAdmin, pcbController.createPCB);
router.put('/:id', requireAdmin, pcbController.updatePCB);
router.delete('/:id', requireAdmin, pcbController.deletePCB);

// Component mapping routes (admin only)
router.post('/:pcb_id/components', requireAdmin, pcbController.addComponentToPCB);
router.put('/mappings/:mapping_id', requireAdmin, pcbController.updateComponentMapping);
router.delete('/mappings/:mapping_id', requireAdmin, pcbController.removeComponentFromPCB);

module.exports = router;
