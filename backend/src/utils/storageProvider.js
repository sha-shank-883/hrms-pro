const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Determine which storage provider to use (default: 'local')
const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'local';

// Setup local upload directory
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Handle file upload with the configured storage provider.
 * Currently supports 'local'. Can be easily extended for 's3' or 'cloudinary'.
 * 
 * @param {Object} file - The file object from Multer (in memory)
 * @param {string} destinationFolder - Folder prefix (e.g., 'profiles', 'documents')
 * @returns {Promise<string>} - Public URL to access the uploaded file
 */
const uploadFile = async (file, destinationFolder = 'general') => {
    // Sanitize folder name (only alphanumeric and underscores)
    const sanitizedFolder = destinationFolder.replace(/[^a-zA-Z0-9_]/g, '');
    
    // Generate a unique filename
    const fileExtension = path.extname(file.originalname).replace(/[^a-zA-Z0-9.]/g, ''); // Basic extension sanitization
    const uniqueFilename = `${sanitizedFolder}/${crypto.randomBytes(16).toString('hex')}${fileExtension}`;

    if (STORAGE_PROVIDER === 's3') {
        // Example implementation for AWS S3
        // const s3 = new AWS.S3({ ... });
        // const params = { Bucket: process.env.AWS_BUCKET_NAME, Key: uniqueFilename, Body: file.buffer, ACL: 'public-read' };
        // const data = await s3.upload(params).promise();
        // return data.Location;
        throw new Error('S3 Storage Provider not initialized with credentials.');
    } else if (STORAGE_PROVIDER === 'cloudinary') {
        // Example implementation for Cloudinary
        // const uploadResult = await new Promise((resolve) => cloudinary.uploader.upload_stream((error, result) => resolve(result)).end(file.buffer));
        // return uploadResult.secure_url;
        throw new Error('Cloudinary Storage Provider not initialized with credentials.');
    } else {
        // Default Local Storage logic
        const destPath = path.join(UPLOADS_DIR, uniqueFilename);
        
        // Ensure subfolder exists
        const subfolder = path.dirname(destPath);
        if (!fs.existsSync(subfolder)) {
            fs.mkdirSync(subfolder, { recursive: true });
        }

        // Write the buffer to the local disk
        fs.writeFileSync(destPath, file.buffer);
        
        // Return a relative URL that your express app is serving (e.g., app.use('/uploads', express.static(...)))
        return `/uploads/${uniqueFilename}`;
    }
};

module.exports = {
    uploadFile
};
