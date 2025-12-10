const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const documentController = require('../controllers/documentController');

// Middleware to handle optional file upload
const optionalUpload = (req, res, next) => {
  documentController.upload.single('file')(req, res, (err) => {
    // If error is just "no file", continue anyway
    if (err && err.message !== 'Unexpected field') {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// Routes
router.get('/', authenticateToken, documentController.getAllDocuments);
router.get('/:id', authenticateToken, documentController.getDocumentById);
router.post('/', authenticateToken, authorizeRole('admin', 'manager'), optionalUpload, documentController.uploadDocument);
router.put('/:id', authenticateToken, authorizeRole('admin', 'manager'), documentController.updateDocument);
router.delete('/:id', authenticateToken, authorizeRole('admin'), documentController.deleteDocument);

module.exports = router;
