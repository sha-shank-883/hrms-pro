const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { upload, uploadFile, deleteFile } = require('../controllers/uploadController');

// Routes
router.post('/', authenticateToken, upload.single('file'), uploadFile);
router.post('/chat', authenticateToken, upload.single('file'), uploadFile);
router.delete('/:filename', authenticateToken, deleteFile);

module.exports = router;