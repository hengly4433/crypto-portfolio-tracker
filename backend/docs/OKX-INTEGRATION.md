# OKX Exchange Integration Guide

This guide explains how to integrate OKX exchange API with the Crypto Portfolio Tracker.

## Prerequisites

1. **OKX Account**: You need an OKX account (mainnet or testnet)
2. **API Keys**: Generate API keys with **READ-ONLY** permissions only
3. **Node.js Environment**: Project setup with dependencies installed

## Step 1: Generate OKX API Keys

### For Production (Mainnet):
1. Log into OKX account
2. Go to **API** section (usually under account settings)
3. Create new API key with:
   - **Permissions**: `Read-only` (NEVER use trading or withdrawal permissions)
   - **Passphrase**: Set a strong passphrase (required by OKX)
   - **IP Restrictions**: Recommended for security
4. Save your:
   - **API Key**
   - **Secret Key** 
   - **Passphrase**

### For Testing (Testnet/Demo):
1. Visit [OKX Demo Trading](https://www.okx.com/demo-trade)
2. Create demo account if needed
3. Generate demo API keys (same process as mainnet)
4. Use testnet for development to avoid real funds

## Step 2: Configure Environment Variables

Add to your `.env` file:

```bash
# OKX API Configuration
OKX_API_KEY="your-api-key-here"
OKX_API_SECRET="your-secret-key-here"
OKX_PASSPHRASE="your-passphrase-here"
OKX_TESTNET=false  # Set to true for testnet/demo

# Encryption for storing API keys in database
ENCRYPTION_KEY="32-byte-random-string-for-encryption"

# Redis for job queues (required for sync)
REDIS_URL="redis://localhost:6379"
```

**Security Note**: Never commit `.env` files to git. Use `.env.example` for template.

## Step 3: Install OKX SDK (Optional)

For production, install the official OKX Node.js SDK:

```bash
cd backend
npm install okx-api
```

Alternatively, use Axios (already installed) with manual signature generation.

## Step 4: Add API Keys to Your Account

### Via Frontend:
1. Log into the Crypto Portfolio Tracker
2. Go to **Settings** → **Exchange Accounts**
3. Click **Add Exchange Account**
4. Select **OKX** from the dropdown
5. Enter your:
   - API Key (encrypted before storage)
   - Secret Key (encrypted before storage)
   - Passphrase (if required, encrypted before storage)
6. Label your account (e.g., "OKX Main Account")
7. Click **Test Connection** to verify

### Via Database (Development):
```sql
-- Ensure OKX exchange exists (seeded by default)
SELECT * FROM exchanges WHERE code = 'OKX';

-- Insert encrypted API keys for a user
-- Use the encryption service to encrypt keys before storing
```

## Step 5: Implement Real OKX API Client

The current `OkxClient` uses mock data. To implement real API calls:

### 5.1 Update `okx-client.ts`:

Replace mock methods with real API calls. Example for `getBalances()`:

```typescript
import axios from 'axios';
import crypto from 'crypto';

async getBalances(): Promise<ExchangeBalance[]> {
  const endpoint = '/api/v5/account/balance';
  const response = await this.makeAuthenticatedRequest('GET', endpoint);
  
  return response.data[0].details.map((detail: any) => ({
    asset: detail.ccy,
    free: parseFloat(detail.availBal),
    locked: parseFloat(detail.frozenBal),
    total: parseFloat(detail.eq),
  }));
}
```

### 5.2 Implement Signature Generation:

OKX requires HMAC SHA256 signatures:

```typescript
private generateSignature(timestamp: string, method: string, requestPath: string, body: string = ''): string {
  const message = timestamp + method.toUpperCase() + requestPath + body;
  const hmac = crypto.createHmac('sha256', this.apiSecret);
  hmac.update(message);
  return hmac.digest('base64');
}

private async makeAuthenticatedRequest(method: string, endpoint: string, body: any = null) {
  const timestamp = new Date().toISOString();
  const signature = this.generateSignature(
    timestamp,
    method,
    endpoint,
    body ? JSON.stringify(body) : ''
  );
  
  const config = {
    headers: {
      'OK-ACCESS-KEY': this.apiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': this.passphrase,
      'Content-Type': 'application/json',
    },
  };
  
  const url = `${this.getBaseUrl()}${endpoint}`;
  
  if (method === 'GET') {
    return axios.get(url, config);
  } else if (method === 'POST') {
    return axios.post(url, body, config);
  }
  
  throw new Error(`Unsupported method: ${method}`);
}
```

## Step 6: Test the Integration

### 6.1 Test Connection:
```bash
# Start the backend
npm run dev

# Check logs for exchange sync initialization
# Should see: "Exchange sync scheduler started"
```

### 6.2 Manual Test via API:
```bash
# Test OKX connection via API endpoint
curl -X GET "http://localhost:3001/api/exchanges/test/OKX" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your-api-key",
    "apiSecret": "your-api-secret",
    "passphrase": "your-passphrase"
  }'
```

### 6.3 Check Sync Jobs:
```bash
# Monitor job queue
redis-cli monitor

# Check logs for sync jobs (runs every 15 minutes)
# Look for: "Syncing OKX account for user..."
```

## Step 7: Map OKX Symbols to Internal Assets

OKX uses different symbol formats (BTC-USDT vs BTCUSDT). Implement mapping:

### 7.1 Symbol Mapping Function:
```typescript
static normalizeSymbol(okxSymbol: string): string {
  // Convert "BTC-USDT" -> "BTCUSDT"
  // Convert "ETH-BTC" -> "ETHBTC"
  return okxSymbol.replace('-', '');
}

static extractBaseQuote(okxSymbol: string): { base: string, quote: string } | null {
  const parts = okxSymbol.split('-');
  if (parts.length === 2) {
    return { base: parts[0], quote: parts[1] };
  }
  return null;
}
```

### 7.2 Asset Matching:
The system will:
1. Try exact symbol match (BTCUSDT)
2. Try external symbol match (BTC-USDT in `assets.external_symbol`)
3. Create missing assets automatically (configurable)

## Step 8: Process Trades and Balances

### 8.1 Trade History Sync:
OKX provides trade history via:
- `/api/v5/trade/fills` - Recent trades (3 months)
- `/api/v5/trade/fills-history` - Historical trades (requires additional permissions)

Implementation considerations:
- Pagination support
- Rate limiting (20 requests per 2 seconds)
- Deduplication using `tradeIdExternal`

### 8.2 Balance Sync:
- Balances become positions in default portfolio
- Zero-cost basis for existing holdings
- Regular snapshot updates

## Step 9: Security Best Practices

### 9.1 API Key Security:
- **NEVER** store API keys in code or version control
- Use environment variables for development
- Use encryption service for database storage
- Regular key rotation (every 90 days recommended)

### 9.2 Permission Principle:
- Use **READ-ONLY** keys only
- Enable IP whitelisting if possible
- Set reasonable rate limits
- Monitor API usage

### 9.3 Error Handling:
```typescript
try {
  await client.getBalances();
} catch (error: any) {
  if (error.response?.status === 429) {
    // Rate limit exceeded
    await this.handleRateLimit();
  } else if (error.response?.status === 401) {
    // Invalid API keys
    await this.disableApiKey(apiKeyId);
  }
}
```

## Step 10: Monitoring and Maintenance

### 10.1 Monitor Sync Jobs:
- Check BullMQ dashboard for failed jobs
- Set up alerts for repeated failures
- Log sync statistics

### 10.2 Regular Maintenance:
- Update OKX SDK/API version
- Review rate limit usage
- Archive old sync data
- Test with demo account regularly

## Troubleshooting

### Common Issues:

1. **Authentication Failed**
   - Check timestamp synchronization (OKX uses ISO format)
   - Verify passphrase is correct
   - Ensure API keys haven't expired

2. **Rate Limit Exceeded**
   - Implement exponential backoff
   - Reduce sync frequency
   - Use bulk endpoints where available

3. **Symbol Mapping Issues**
   - Check asset seed data
   - Review symbol normalization
   - Add missing assets to seed

4. **Connection Issues**
   - Verify network can reach OKX API
   - Check firewall/proxy settings
   - Test with OKX demo endpoint first

### Debug Tools:
```typescript
// Enable debug logging
DEBUG=okx-api npm run dev

// Test with curl
curl -X GET "https://www.okx.com/api/v5/public/time"
```

## API Endpoints Reference

### Essential OKX Endpoints:
- `GET /api/v5/public/time` - Server time (connection test)
- `GET /api/v5/account/balance` - Account balances
- `GET /api/v5/trade/fills` - Recent trades
- `GET /api/v5/asset/balances` - Funding account balances
- `GET /api/v5/public/instruments` - Available trading pairs

### Rate Limits:
- Public endpoints: 20 requests per 2 seconds
- Private endpoints: 10 requests per 2 seconds
- WebSocket: 1 connection per 5 seconds

## Support

- [OKX API Documentation](https://www.okx.com/docs-v5/)
- [OKX Demo Trading](https://www.okx.com/demo-trade)
- [Project GitHub Issues](https://github.com/your-repo/issues)

---

**Remember**: Always test with demo accounts first. Never use API keys with trading permissions in development.