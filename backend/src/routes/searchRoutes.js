const express = require('express');
const router = express.Router();
const { globalSearch } = require('../controllers/searchController');
const { authenticateToken } = require('../middleware/auth');

// @route   GET /api/search
// @desc    Perform global search across modules
// @access  Private
router.get('/', authenticateToken, globalSearch);

module.exports = router;
