// ============================================
// EchoNote – Admin API Tests
// ============================================

const request = require('supertest');
const app = require('../server/index');

describe('Admin Endpoints', () => {
  let adminToken;
  let userToken;

  beforeAll(async () => {
    // Get admin token
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@echonote.com', password: 'admin123' });
    adminToken = adminRes.body.token;

    // Create & login as regular user
    const username = `regular_${Date.now()}`;
    await request(app)
      .post('/api/auth/signup')
      .send({ username, email: `${username}@test.com`, password: 'Pass1234' });

    const userRes = await request(app)
      .post('/api/auth/login')
      .send({ email: `${username}@test.com`, password: 'Pass1234' });
    userToken = userRes.body.token;
  });

  // ── GET /api/admin/stats ───────────────────
  describe('GET /api/admin/stats', () => {
    it('should return stats for admin', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('stats');
      expect(res.body.stats).toHaveProperty('total_users');
      expect(res.body.stats).toHaveProperty('total_uploads');
      expect(res.body).toHaveProperty('categoryStats');
    });

    it('should deny access to regular user', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/admin/stats');
      expect(res.statusCode).toBe(401);
    });
  });

  // ── GET /api/admin/users ───────────────────
  describe('GET /api/admin/users', () => {
    it('should return all users for admin', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('users');
      expect(Array.isArray(res.body.users)).toBe(true);
    });

    it('should deny regular user', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403);
    });
  });
});
