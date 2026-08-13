const { Pool } = require('pg');
const { AsyncLocalStorage } = require('async_hooks');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

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
  max: 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  allowExitOnIdle: false,
});

const tenantStorage = new AsyncLocalStorage();

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const retryQuery = async (fn, maxRetries = 2) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isTransient = error.code === 'ETIMEDOUT'
        || error.message?.includes('connection timeout')
        || error.message?.includes('Connection terminated')
        || error.code === '57P01';
      if (attempt < maxRetries && isTransient) {
        console.warn(`DB query retry ${attempt + 1}/${maxRetries} after: ${error.message}`);
        await sleep(500 * (attempt + 1));
        continue;
      }
      throw error;
    }
  }
};

const applyTenantSchema = async (client, tenantId) => {
  await client.query(`SET search_path TO "${tenantId}", public`);
};

const resetSchema = async (client) => {
  await client.query('SET search_path TO public');
};

const getClient = async () => {
  const client = await pool.connect();
  const tenantId = tenantStorage.getStore();
  if (tenantId) {
    await applyTenantSchema(client, tenantId);
  }
  return client;
};

const query = async (text, params, clientOverride) => {
  if (clientOverride) {
    return retryQuery(() => clientOverride.query(text, params));
  }

  return retryQuery(async () => {
    const client = await pool.connect();
    try {
      const tenantId = tenantStorage.getStore();
      if (tenantId) {
        await applyTenantSchema(client, tenantId);
      }

      const res = await client.query(text, params);
      return res;
    } catch (error) {
      if (error.message?.includes('current transaction is aborted')) {
        try { await client.query('ROLLBACK'); } catch (_) { }
      }
      throw error;
    } finally {
      try {
        await resetSchema(client);
      } catch (e) {
        console.error('Error resetting search path', e);
      }
      client.release();
    }
  });
};

const transaction = async (callback) => {
  return retryQuery(async () => {
    const client = await pool.connect();
    const tenantId = tenantStorage.getStore();

    try {
      if (tenantId) {
        await applyTenantSchema(client, tenantId);
      }

      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) { }
      throw error;
    } finally {
      try {
        await resetSchema(client);
      } catch (e) {
        console.error('Error resetting search path', e);
      }
      client.release();
    }
  });
};

module.exports = {
  pool,
  query,
  transaction,
  getClient,
  tenantStorage
};
