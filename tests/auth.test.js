// ============================================
// EchoNote – Auth API Tests
// ============================================

const request = require('supertest');
const app = require('../server/index');

describe('Auth Endpoints', () => {
  let authToken;
  const testUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'TestPass123'
  };

  // ── POST /api/auth/signup ──────────────────
  describe('POST /api/auth/signup', () => {
    it('should create a new user', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send(testUser);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.role).toBe('user');
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send(testUser);

      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ username: 'validuser', email: 'not-an-email', password: 'Test123' });

      expect(res.statusCode).toBe(400);
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ username: 'validuser2', email: 'valid2@test.com', password: '123' });

      expect(res.statusCode).toBe(400);
    });
  });

  // ── POST /api/auth/login ───────────────────
  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      authToken = res.body.token;
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });

      expect(res.statusCode).toBe(401);
    });

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@nowhere.com', password: 'anypassword' });

      expect(res.statusCode).toBe(401);
    });
  });

  // ── GET /api/auth/profile ──────────────────
  describe('GET /api/auth/profile', () => {
    it('should return profile when authenticated', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.email).toBe(testUser.email);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/auth/profile');
      expect(res.statusCode).toBe(401);
    });
  });

  // ── Health Check ───────────────────────────
  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('healthy');
    });
  });
});
