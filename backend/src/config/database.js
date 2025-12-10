const { Pool } = require('pg');
const { AsyncLocalStorage } = require('async_hooks');
require('dotenv').config();

const poolConfig = process.env.DATABASE_URL
  ? {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  }
  : {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };

const pool = new Pool({
  ...poolConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// AsyncLocalStorage to store tenant context
const tenantStorage = new AsyncLocalStorage();

// Test database connection
pool.on('connect', () => {
  // console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

// Query helper function with tenant support
const query = async (text, params) => {
  const start = Date.now();
  const tenantId = tenantStorage.getStore();

  // If no tenant context, use default pool.query (public schema usually, or whatever is default)
  // However, for multi-tenancy, we usually want to enforce a schema.
  // If tenantId is 'shared', we use the shared schema.

  const client = await pool.connect();
  try {
    if (tenantId) {
      await client.query(`SET search_path TO "${tenantId}", public`);
    }

    const res = await client.query(text, params);
    const duration = Date.now() - start;
    // console.log('Executed query', { text, duration, rows: res.rowCount, tenant: tenantId });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    // Reset search path to public before releasing to avoid pollution if pool is shared
    // Although next checkout will overwrite it if we always set it, it's safer to reset.
    try {
      await client.query('SET search_path TO public');
    } catch (e) {
      console.error('Error resetting search path', e);
    }
    client.release();
  }
};

module.exports = {
  pool,
  query,
  tenantStorage
};
