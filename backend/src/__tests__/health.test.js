const request = require('supertest');

let app;

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  app = require('../server').app;
});

afterAll(() => {
  const { pool } = require('../config/database');
  if (pool) pool.end();
});

describe('Health Check', () => {
  it('GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Server is running');
  });

  it('GET /health has timestamp', async () => {
    const res = await request(app).get('/health');
    expect(res.body.timestamp).toBeDefined();
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });
});

describe('404 handling', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('CORS headers', () => {
  it('includes CORS headers in response', async () => {
    const res = await request(app)
      .options('/health')
      .set('Origin', 'http://localhost:3000');
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });
});
