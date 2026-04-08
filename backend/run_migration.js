const fs = require('fs');
const path = require('path');
const { pool, tenantStorage } = require('./src/config/database');

async function runDeploy() {
  const client = await pool.connect();
  try {
    const tenantId = 'tenant_default';
    await client.query(`SET search_path TO "${tenantId}", public`);
    
    console.log('Running geo migration...');
    const geoSQL = fs.readFileSync(path.join(__dirname, 'src/config/migrations/04_geo_fenced_attendance.sql'), 'utf8');
    await client.query(geoSQL);
    console.log('Geo migration complete.');

    console.log('Running shift migration...');
    const shiftSQL = fs.readFileSync(path.join(__dirname, 'src/config/migrations/05_shift_rostering.sql'), 'utf8');
    await client.query(shiftSQL);
    console.log('Shift migration complete.');

  } catch (error) {
    console.error('Error running migrations:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

runDeploy();
