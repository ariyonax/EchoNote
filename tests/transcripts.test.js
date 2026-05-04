// ============================================
// EchoNote – Transcript API Tests
// ============================================

const request = require('supertest');
const app = require('../server/index');

describe('Transcript Endpoints', () => {
  let authToken;

  beforeAll(async () => {
    // Login as admin to get token
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@echonote.com', password: 'admin123' });
    authToken = res.body.token;
  });

  // ── GET /api/transcripts ───────────────────
  describe('GET /api/transcripts', () => {
    it('should return transcripts list', async () => {
      const res = await request(app)
        .get('/api/transcripts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('transcripts');
      expect(Array.isArray(res.body.transcripts)).toBe(true);
      expect(res.body).toHaveProperty('total');
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/transcripts?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.limit).toBe(5);
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/transcripts');
      expect(res.statusCode).toBe(401);
    });
  });

  // ── GET /api/transcripts/categories ────────
  describe('GET /api/transcripts/categories', () => {
    it('should return all categories', async () => {
      const res = await request(app)
        .get('/api/transcripts/categories')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  // ── GET /api/transcripts/search ────────────
  describe('GET /api/transcripts/search', () => {
    it('should search transcripts', async () => {
      const res = await request(app)
        .get('/api/transcripts/search?q=test')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('results');
    });

    it('should reject short query', async () => {
      const res = await request(app)
        .get('/api/transcripts/search?q=a')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(400);
    });
  });

  // ── GET /api/transcripts/:id ───────────────
  describe('GET /api/transcripts/:id', () => {
    it('should return 404 for non-existent transcript', async () => {
      const res = await request(app)
        .get('/api/transcripts/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
