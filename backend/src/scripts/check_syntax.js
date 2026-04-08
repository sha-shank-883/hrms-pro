try {
    require('../controllers/tenantController');
    
} catch (error) {
    console.error('Syntax error in tenantController.js:', error);
    process.exit(1);
}
