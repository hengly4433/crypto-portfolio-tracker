import request from 'supertest';
import app from '../../app';

describe('Transaction Endpoints', () => {
  let accessToken: string;
  let portfolioId: string;
  let assetId: string;
  let transactionId: string;

  const testUser = {
    email: `tx-test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    fullName: 'Transaction Test User',
  };

  beforeAll(async () => {
    // Register
    const authRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    accessToken = authRes.body.tokens.accessToken;

    // Get default portfolio (created during registration)
    const portfolioRes = await request(app)
      .get('/api/portfolios')
      .set('Authorization', `Bearer ${accessToken}`);
    portfolioId = portfolioRes.body[0]?.id;

    // Get or create an asset
    const assetRes = await request(app)
      .get('/api/assets')
      .set('Authorization', `Bearer ${accessToken}`);
    
    if (assetRes.body.length > 0) {
      assetId = assetRes.body[0].id;
    } else {
      // Create a test asset
      const createAssetRes = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ symbol: 'BTC', name: 'Bitcoin', assetType: 'CRYPTO', coingeckoId: 'bitcoin' });
      assetId = createAssetRes.body.id;
    }
  });

  describe('POST /api/portfolios/:id/transactions', () => {
    it('should create a BUY transaction', async () => {
      if (!portfolioId || !assetId) {
        console.warn('Skipping: no portfolio or asset available');
        return;
      }

      const res = await request(app)
        .post(`/api/portfolios/${portfolioId}/transactions`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          assetId,
          side: 'BUY',
          quantity: 1.5,
          price: 50000,
          transactionCurrency: 'USD',
          date: new Date().toISOString(),
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.side).toBe('BUY');
      transactionId = res.body.id;
    });

    it('should reject without auth', async () => {
      await request(app)
        .post(`/api/portfolios/${portfolioId}/transactions`)
        .send({
          assetId,
          side: 'BUY',
          quantity: 1,
          price: 50000,
          transactionCurrency: 'USD',
          date: new Date().toISOString(),
        })
        .expect(401);
    });

    it('should reject invalid side', async () => {
      if (!portfolioId) return;

      await request(app)
        .post(`/api/portfolios/${portfolioId}/transactions`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          assetId,
          side: 'INVALID',
          quantity: 1,
          price: 50000,
          transactionCurrency: 'USD',
          date: new Date().toISOString(),
        })
        .expect(400);
    });
  });

  describe('GET /api/portfolios/:id/transactions', () => {
    it('should return paginated transactions', async () => {
      if (!portfolioId) return;

      const res = await request(app)
        .get(`/api/portfolios/${portfolioId}/transactions`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('page');
      expect(res.body.pagination).toHaveProperty('total');
      expect(res.body.pagination).toHaveProperty('totalPages');
    });

    it('should support pagination params', async () => {
      if (!portfolioId) return;

      const res = await request(app)
        .get(`/api/portfolios/${portfolioId}/transactions?page=1&limit=10`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.pagination.limit).toBe(10);
    });
  });

  describe('DELETE /api/portfolios/:id/transactions/:txId', () => {
    it('should delete a transaction', async () => {
      if (!portfolioId || !transactionId) return;

      await request(app)
        .delete(`/api/portfolios/${portfolioId}/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('should return 400 for non-existent transaction', async () => {
      if (!portfolioId) return;

      await request(app)
        .delete(`/api/portfolios/${portfolioId}/transactions/999999`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });
  });
});
