const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Public route
router.post('/login', login);

// (Optional) Protected test route
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

module.exports = router;

