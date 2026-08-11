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

describe('Lead Generation & Contact Inquiries API', () => {
  describe('POST /api/leads/lead-magnet', () => {
    it('should submit lead magnet download successfully', async () => {
      const res = await request(app)
        .post('/api/leads/lead-magnet')
        .send({
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          company: 'Test Company LLC',
          resource: 'HR Compliance Checklist 2026'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Checklist sent');
    });

    it('should reject submission if name is missing', async () => {
      const res = await request(app)
        .post('/api/leads/lead-magnet')
        .send({
          email: 'jane.doe@example.com',
          company: 'Test Company LLC'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject submission if email is missing', async () => {
      const res = await request(app)
        .post('/api/leads/lead-magnet')
        .send({
          name: 'Jane Doe',
          company: 'Test Company LLC'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/leads/contact', () => {
    it('should submit contact form inquiry successfully', async () => {
      const res = await request(app)
        .post('/api/leads/contact')
        .send({
          name: 'Bob Smith',
          email: 'bob.smith@example.com',
          company: 'SaaS Builder Inc',
          phone: '123-456-7890',
          subject: 'Enterprise Demo Inquiry',
          message: 'Hello, I would like to schedule a personalized demo for my team of 500 employees.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Your message has been sent successfully');
    });

    it('should reject contact submission if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/leads/contact')
        .send({
          name: 'Bob Smith',
          email: 'bob.smith@example.com',
          subject: 'Missing message'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
