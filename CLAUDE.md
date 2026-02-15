# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack cryptocurrency portfolio tracker with real-time price tracking, transaction management, PnL calculations, and smart alerts. Three components: Node.js/Express backend API, Next.js web frontend, and Flutter mobile app.

## Tech Stack

### Backend (`/backend`)
- **Runtime**: Node.js with Express 5, TypeScript (CommonJS)
- **Database**: PostgreSQL via Prisma ORM (uses `@prisma/adapter-pg` driver adapter)
- **Caching & Jobs**: Redis with BullMQ for background job queues
- **Validation**: Zod schemas in `*.dto.ts` files, applied via `validate` middleware
- **Logging**: Pino (with pino-pretty for dev)
- **External APIs**: CoinGecko (crypto prices), AlphaVantage (forex/commodities)
- **Real-time**: Socket.IO for WebSocket connections
- **Auth**: JWT (access + refresh tokens), bcrypt for password hashing

### Frontend (`/frontend`)
- **Framework**: Next.js 15 with App Router, route groups `(auth)` and `(main)`
- **Styling**: Tailwind CSS 4 + Shadcn UI (Radix primitives)
- **State**: React Query (@tanstack/react-query) via `QueryProvider`
- **Charts**: Recharts
- **API**: Custom `ApiClient` class in `src/lib/api-client.ts` with automatic token refresh
- **Custom hooks**: `src/lib/hooks/` — `use-portfolios`, `use-transactions`, `use-alerts`, `use-assets`, `use-debounce`

### Mobile App (`/app`)
- **Framework**: Flutter (Dart SDK >=3.3.4)
- **State**: Provider (ChangeNotifier pattern)
- **HTTP**: Dio with JWT interceptor (automatic token refresh on 401)
- **Storage**: flutter_secure_storage for tokens
- **Charts**: fl_chart

## Common Development Commands

### Backend
```bash
cd backend
npm run dev                               # Dev server with nodemon (localhost:3001)
npm run build                             # Compile TypeScript to /dist
npm test                                  # Run all tests (Jest, --passWithNoTests)
npm run test:watch                        # Watch mode
npx jest --testPathPattern=auth           # Run a single test file by name
npm run test:coverage                     # Coverage report

# Database
npx prisma db push                        # Sync schema to database (NOT migrate)
npx prisma generate                       # Regenerate Prisma Client after schema changes
npx prisma studio                         # Database GUI browser
npm run prisma:seed                       # Seed initial data (ts-node prisma/seed.ts)
npm run prisma:reset                      # Force-reset DB + reseed
```

### Frontend
```bash
cd frontend
npm run dev                               # Dev server (localhost:3000)
npm run build                             # Production build
npm run lint                              # ESLint
```

### Mobile App
```bash
cd app
flutter pub get                           # Install dependencies
flutter run                               # Run on connected device/emulator
flutter test                              # Run tests
flutter analyze                           # Static analysis (uses flutter_lints)
```

### Full Stack (Docker)
```bash
docker-compose up --build                 # Run everything: Postgres, Redis, Backend, Frontend
```

## Architecture Patterns

### Backend Module Structure

Each domain module in `backend/src/modules/{feature}/` follows:
- `{feature}.routes.ts` — Express router, applies `authenticate` middleware and `validate(schema)` middleware
- `{feature}.controller.ts` — Request handlers, parses params/body, calls service, sends response
- `{feature}.service.ts` — Business logic, database operations via Prisma, calls other services
- `{feature}.dto.ts` — Zod schemas for request validation + TypeScript interfaces

Routes are registered in `src/app.ts`. Transactions are nested: `/api/portfolios/:portfolioId/transactions`.

### Common Backend Infrastructure

- **Error handling**: Custom `HttpError` subclasses (`BadRequestError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`) in `src/common/errors/http-error.ts`. Thrown anywhere, caught by `errorMiddleware`.
- **Validation**: `validate(zodSchema)` middleware in `src/common/middlewares/validate.middleware.ts` — validates `{ body, query, params }` as a single object.
- **Auth middleware**: `src/common/middlewares/auth.middleware.ts` — verifies JWT, attaches user to `req`.
- **DB singleton**: `src/config/db.ts` exports a single `prisma` instance (uses PrismaPg adapter).
- **Audit logging**: `AuditService` in `src/modules/audit/audit.service.ts` for tracking entity changes.

### Feature Flags

The backend has a feature flag system in `src/config/features.ts` for running without external dependencies. All flags default to enabled (`!== 'false'`):

- `ENABLE_BACKGROUND_JOBS` — Redis/BullMQ job processing
- `ENABLE_EXCHANGE_SYNC` — Exchange API integration
- `ENABLE_PRICE_APIS` — External price API calls
- `ENABLE_CANDLE_AGGREGATION` — Chart candle data
- `ENABLE_EMAIL_NOTIFICATIONS` / `ENABLE_TELEGRAM_NOTIFICATIONS`

Set any to `'false'` in `.env` to disable. Set all to false for manual-only mode (no Redis needed). The feature-flag-aware job manager is in `src/infrastructure/jobs/job-manager-featured.ts`.

### Background Jobs (BullMQ)

Initialized in `src/infrastructure/jobs/job-manager.ts` (or `job-manager-featured.ts` for flag-aware version):

- **`price-update.job.ts`**: Scheduled price fetches from CoinGecko/AlphaVantage
- **`alert-check.job.ts`**: Runs every minute, checks alerts against current prices
- **`exchange-sync.job.ts`**: Syncs positions/transactions from Binance/OKX
- **`candle-aggregation.job.ts`**: Aggregates price data into OHLCV candles

All jobs require Redis. Configure via `REDIS_URL`.

### Transaction & Position Logic

`TransactionService` in `src/modules/transactions/transaction.service.ts` is the most complex service:

- **Transaction types**: BUY, SELL, DEPOSIT, WITHDRAWAL, TRANSFER_IN, TRANSFER_OUT, INCOME, FEE
- **Position updates happen inside a Prisma `$transaction`** — every create/update/delete reverses the old effect and applies the new one
- **BUY**: Increases position quantity and cost basis. Fee-in-asset is handled (e.g., fee paid in ETH when buying ETH reduces net quantity received)
- **SELL**: Reduces position proportionally, calculates realized PnL as `grossProceeds - proportionalCostBasis - fees`
- **Inflow (DEPOSIT/TRANSFER_IN/INCOME)**: Adds quantity at zero cost basis
- **Outflow (WITHDRAWAL/TRANSFER_OUT/FEE)**: Removes quantity, reduces cost basis proportionally
- **FX conversion**: If transaction currency differs from portfolio base currency, amounts are converted via `PriceService.getFxRate()`
- **Asset resolution**: `assetId` can be a database ID or CoinGecko ID string — `AssetService.ensureAsset()` creates the asset if it doesn't exist
- **Delete reversal**: `revertTransactionEffect()` undoes the position impact before deleting

### Price Data Caching

Two-tier strategy in `src/modules/price/price.service.ts`:

1. **Redis**: Short TTL (1-5 min) for real-time prices
2. **Database**: `prices_spot` table for historical data
3. **External API fallback**: CoinGecko for crypto, AlphaVantage for forex/commodities

### Exchange Integration

- API keys encrypted with AES-256-GCM (`src/common/utils/encryption.ts`) before storage in `user_api_keys`
- Factory pattern: `exchange-client.factory.ts` returns the correct client (Binance or OKX) based on exchange code
- Exchange clients implement `ExchangeClientInterface` (`exchange-client.interface.ts`)

### Frontend Structure

- **Route groups**: `(auth)` for login/register, `(main)` for authenticated pages
- **Auth**: `AuthProvider` context wraps the app, `AuthGuard` component protects routes
- **API client**: Singleton `ApiClient` class with typed methods for every endpoint, automatic 401 → refresh → retry
- **Frontend stores tokens in localStorage** (`access_token`, `refresh_token`)
- **Shadcn components**: In `src/components/ui/`, added via the `shadcn` CLI

### Flutter App Structure

- **Singleton `ApiClient`** in `lib/core/api/api_client.dart` with Dio interceptor for automatic JWT refresh
- **Feature-based organization**: `lib/features/{auth,dashboard,portfolio,alerts,profile}/`
- Each feature has `screens/` and `providers/` subdirectories
- **Providers extend `ChangeNotifier`**, registered in `main.dart` via `MultiProvider`
- **Routing**: `onGenerateRoute` in `main.dart` handles path-based navigation (e.g., `/portfolio/:id`)
- **AuthGate widget**: Checks auth state on startup, routes to login or main shell

## Database

Schema in `backend/prisma/schema.prisma`. Uses `BigInt` IDs (autoincrement). All tables use `@@map` for snake_case table names. Key relationships:

- User → Portfolios → Positions (unique on `[portfolioId, assetId, userAccountId]`)
- User → Portfolios → Transactions → Asset
- User → UserAccounts → Exchange (for exchange-synced data)
- User → Alerts → Asset/Portfolio
- Financial fields use `Decimal(20, 8)` for precision

**Important**: This project uses `prisma db push` (not migrations). The `postinstall` script runs `prisma generate`.

## Environment Variables

### Backend (`/backend/.env`)
Required (see `.env.example`):
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string (only if background jobs enabled)
- `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`: JWT signing secrets
- `COINGECKO_API_KEY`: Optional, recommended for higher rate limits
- `ALPHA_VANTAGE_API_KEY`: Required for forex/gold prices
- `CORS_ORIGIN`: Frontend domain for production

### Frontend (`/frontend/.env.local`)
- `NEXT_PUBLIC_API_URL`: Backend API base (e.g., `http://localhost:3001/api`)

### Mobile App
- API base URL is hardcoded to `http://localhost:3001/api` in `lib/core/api/api_client.dart`. Use `apiClient.setBaseUrl()` to override at runtime.

## Testing

- **Backend**: Jest + ts-jest. Tests in `src/__tests__/`. Run a single test: `npx jest --testPathPattern=auth`
- **Jest config**: `backend/jest.config.js` — uses `@/` path alias mapped to `src/`
- **Test setup**: `src/__tests__/setup.ts` sets `NODE_ENV=test` and test JWT secrets
- **Frontend**: No tests yet
- **Mobile**: `flutter test` (test dir exists at `app/test/`)

## Deployment

Docker-based deployment to Render. `render.yaml` defines all services. Both `backend/Dockerfile` and `frontend/Dockerfile` exist. The backend start script runs `prisma db push --accept-data-loss` before `node dist/server.js`.

## Known Gotchas

1. **React Native → Flutter migration**: The root README still references Expo/React Native for the mobile app, but `/app` is now Flutter/Dart.

2. **Prisma generate on schema change**: Always run `npx prisma generate` after modifying `schema.prisma`. TypeScript types and the Prisma Client will be out of sync otherwise.

3. **Prisma adapter**: The project uses `@prisma/adapter-pg` (PrismaPg) in `config/db.ts` instead of Prisma's default connection. This was required for Prisma 7.x.

4. **Redis optional in dev**: Set `ENABLE_BACKGROUND_JOBS=false` in `.env` to run the backend without Redis. Core portfolio CRUD still works — only scheduled jobs and real-time price updates are disabled.

5. **BigInt serialization**: Database IDs are `BigInt`. Controllers must handle JSON serialization (BigInt is not natively JSON-serializable in JS).

6. **Rate limiting**: Global rate limiter in `app.ts`. Trust proxy is set to 1 for deployment behind Render/Vercel.

7. **CORS**: Dev CORS allows ports 3000, 3001, 8081, 19006, 19000, 19001 plus `CORS_ORIGIN` env var.

8. **Transaction currency conversion**: If a transaction's currency differs from the portfolio's `baseCurrency`, the service fetches an FX rate. This can fail if the price API is unavailable.
