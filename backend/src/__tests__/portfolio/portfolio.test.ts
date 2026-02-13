import request from 'supertest';
import app from '../../app';

describe('Portfolio Endpoints', () => {
  let accessToken: string;
  let portfolioId: string;
  const testUser = {
    email: `portfolio-test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    fullName: 'Portfolio Test User',
  };

  beforeAll(async () => {
    // Register and get token
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    accessToken = res.body.tokens.accessToken;
  });

  describe('POST /api/portfolios', () => {
    it('should create a portfolio', async () => {
      const res = await request(app)
        .post('/api/portfolios')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Test Portfolio', baseCurrency: 'USD' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Test Portfolio');
      expect(res.body.baseCurrency).toBe('USD');
      portfolioId = res.body.id;
    });

    it('should reject without auth', async () => {
      await request(app)
        .post('/api/portfolios')
        .send({ name: 'Fail Portfolio' })
        .expect(401);
    });
  });

  describe('GET /api/portfolios', () => {
    it('should return user portfolios', async () => {
      const res = await request(app)
        .get('/api/portfolios')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/portfolios/:id', () => {
    it('should return portfolio by id', async () => {
      const res = await request(app)
        .get(`/api/portfolios/${portfolioId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.id).toBe(portfolioId);
      expect(res.body.name).toBe('Test Portfolio');
    });

    it('should return 404 for non-existent portfolio', async () => {
      await request(app)
        .get('/api/portfolios/999999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/portfolios/:id', () => {
    it('should update portfolio name', async () => {
      const res = await request(app)
        .put(`/api/portfolios/${portfolioId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated Portfolio' })
        .expect(200);

      expect(res.body.name).toBe('Updated Portfolio');
    });
  });

  describe('GET /api/portfolios/:id/summary', () => {
    it('should return portfolio summary', async () => {
      const res = await request(app)
        .get(`/api/portfolios/${portfolioId}/summary`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('totalValue');
      expect(res.body).toHaveProperty('positions');
      expect(res.body).toHaveProperty('allocation');
    });
  });

  describe('DELETE /api/portfolios/:id', () => {
    it('should delete portfolio with cascade', async () => {
      // Create a throwaway portfolio
      const createRes = await request(app)
        .post('/api/portfolios')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Throwaway', baseCurrency: 'USD' });

      await request(app)
        .delete(`/api/portfolios/${createRes.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });
  });
});
