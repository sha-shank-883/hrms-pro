const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadFile: abstractUploadFile } = require('../utils/storageProvider');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError, AppError } = require('../utils/errors');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|mp4|mp3|wav|avi|mov/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, documents, videos, and audio files are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: fileFilter
});

const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }

  const contextStr = req.originalUrl.includes('/chat') ? 'chat' : 'general';

  const fileUrl = await abstractUploadFile(req.file, contextStr);

  res.status(200).json({
    success: true,
    message: 'File uploaded successfully',
    data: {
      url: fileUrl,
      filename: path.basename(fileUrl),
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    }
  });
});

const deleteFile = asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../../uploads/chat', filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } else {
    throw new NotFoundError('File not found');
  }
});

module.exports = {
  upload,
  uploadFile,
  deleteFile
};
