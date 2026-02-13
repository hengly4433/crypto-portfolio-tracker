After verifying tasks @002_Build_Project.md, start building the project.

Use Node/Express + PostgreSQL for the backend with a layered, class-based architecture, and Next.js for the frontend as a typed client consuming your REST API.

**Backend architecture (Node/Express)**

**Layers and structure**

**Use a classic layered architecture with classes and dependency injection:**

```text
backend/
  src/
    app.ts
    server.ts
    config/
      env.ts
      db.ts
    modules/
      users/
        user.controller.ts
        user.service.ts
        user.repository.ts
        user.model.ts
        user.dto.ts
      portfolios/
        portfolio.controller.ts
        portfolio.service.ts
        portfolio.repository.ts
        portfolio.model.ts
        portfolio.dto.ts
      transactions/
      positions/
      assets/
      alerts/
      auth/
    common/
      errors/
      middlewares/
      logger/
      utils/
    infrastructure/
      http/
      jobs/
      integrations/ (coingecko, forex API, etc.)

```

This matches best practices for Express layered architecture: controllers → services → repositories → database

- Controller: HTTP translation only (req/res, status codes).
- Service: Business logic (create transaction, recompute position, trigger alert).
- Repository: Database access (SQL/ORM).
- DTOs: Input/output validation contracts (with Zod or class-validator-style schema).
- Models: Domain entities (TypeScript interfaces/classes) independent from persistence.

Use TypeScript and a DB library like Prisma, Drizzle, or TypeORM; they all work well with PostgreSQL and Node.

**Tech choices (backend)**

- Runtime: Node 22 (LTS) with TypeScript.   
- Framework: Express 5 (or a typed wrapper like NestJS-style patterns, but you can roll your own).
- ORM: Prisma or Drizzle for Postgres (good developer experience, migrations).
- Auth: JWT (access + refresh), bcrypt for password hashing.
- Validation: Zod or Joi for request DTO schemas.
- Logging: Winston or Pino; centralized logger injected into services.
- Job processing: BullMQ (Redis) or node-cron for periodic tasks (price fetch, alert evaluation).
- Testing: Jest + supertest.


**Core modules and their responsibilities**

1. User module

- Registers users, manages login, returns JWT tokens.
- Owns users, user_sessions, user_settings.

2. Portfolio module

- Handles creation, listing, and summary of portfolios.
- Creates default portfolio at signup.
- Updates portfolio settings (base currency, name).
- Returns dashboard summaries using positions and snapshots.

This logic mirrors how portfolio trackers aggregate holdings and value them using current prices.

3. Transaction module

Implements the BUY/SELL/DEPOSIT/WITHDRAWAL logic and updates positions from the earlier design.

**Key responsibilities:**

- Validate inputs against portfolio ownership.
- Convert transaction amounts to base currency using price service.
- Persist transactions and update positions inside a DB transaction.
- Emit domain events (e.g. via event emitter) for analytics and alerts.

This aligns with patterns used in Node + PostgreSQL portfolio projects: DB transaction wrapper, repository injection, service orchestration.

4. Position module

- Encapsulates all position update logic (buy/sell semantics, realized/unrealized P/L).

Using lockForUpdate (SELECT FOR UPDATE) ensures concurrent transaction safety in PostgreSQL.

5. Price module

**Provides price and FX conversion functions to other services:**

- getPrice(assetId, quoteCurrency)
- getPriceInBase(assetId, baseCurrency)
- getFxRate(fromCurrency, toCurrency)

**Internally uses:**

- Spot prices stored in prices_spot.
- FX rates (like USD/KHR) from a forex API.
- Caching via Redis to avoid hitting external APIs too often.

6. Alert module

- Stores alert definitions.
- Background job checks alerts when price or snapshot data changes.
- On trigger, creates notifications and pushes them out via chosen channels.

**Express API design**

```text
POST   /api/auth/register
POST   /api/auth/login

GET    /api/me
GET    /api/portfolios
POST   /api/portfolios
GET    /api/portfolios/:id/summary
GET    /api/portfolios/:id/positions
GET    /api/portfolios/:id/transactions
POST   /api/portfolios/:id/transactions

GET    /api/assets
GET    /api/assets/:id/prices

GET    /api/alerts
POST   /api/alerts
PATCH  /api/alerts/:id
DELETE /api/alerts/:id

```

**Middleware stack:**

- authMiddleware (verify JWT, attach req.user).
- validationMiddleware (Zod schemas per route).
- errorMiddleware (global error handler that formats API errors consistently).

This pattern is standard for Express REST APIs with PostgreSQL.
​
**Frontend (Next.js) architecture**

Use Next.js 15 (App Router) with React Server Components and a typed client.

**Suggested structure:**

```text
frontend/
  app/
    layout.tsx
    page.tsx                  (landing / home)
    login/page.tsx
    register/page.tsx
    dashboard/
      page.tsx                (list portfolios)
    portfolio/
      [id]/
        page.tsx              (portfolio overview)
        transactions/page.tsx
        alerts/page.tsx
  lib/
    api-client.ts             (fetch wrapper)
    auth.ts                   (token handling)
    types/                    (DTO types matching backend)
  components/
    charts/
    forms/
    table/

```​

Next.js 15 lets you use server components with async data fetching like this (or use React Query on the client if you prefer client-side caching).

**Request flow example: “Add trade” end-to-end**

1. User opens portfolio page in Next.js.

2. Clicks “Add Transaction” → opens form component.

3. Form validates input with Zod on client (symbol, side, quantity, price).

4. On submit, frontend calls POST /api/portfolios/:id/transactions.

5. Express TransactionController.create:

   - Parses DTO with Zod.
   - Checks user from JWT vs portfolio.
   - Delegates to TransactionService.create.

6. TransactionService:

   - Fetches FX rates from PriceService.
   - Calculates base amounts.
   - Starts DB transaction, inserts record via TransactionRepository.
   - Calls PositionService.applyTransaction to adjust position.
   - Commits transaction.
   - Emits domain event to queue.

7. Queue worker:

   - Listens for TransactionCreated event.
   - Recomputes snapshot for portfolio.
   - Checks relevant alerts.

8. Backend responds with the created transaction DTO.

9. Frontend invalidates cache/query and refetches portfolio summary to update UI.

This pipeline follows patterns in existing Node/Express investment tracker projects where a PostgreSQL database stores holdings and a Node API computes P/L and aggregates holdings.