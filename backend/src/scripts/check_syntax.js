try {
    require('../controllers/tenantController');
    console.log('Syntax check passed for tenantController.js');
} catch (error) {
    console.error('Syntax error in tenantController.js:', error);
    process.exit(1);
}
