# Crypto Portfolio Tracker

A comprehensive cryptocurrency portfolio tracking application built with a modern tech stack. This system allows users to track their crypto assets, visualize performance, and set alerts.

## 🏗 System Architecture

The project follows a client-server architecture:

- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Shadcn UI, Recharts.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM.
- **Database**: PostgreSQL.
- **Infrastructure**: Redis (for caching/queues), BullMQ (background jobs).

### Directory Structure

- `frontend/`: Next.js application handling the UI/UX.
- `backend/`: Express application handling APIs, business logic, and database interactions.

## 🧠 Logic Processing & Data Flow

### 1. Authentication

- **Method**: JWT (JSON Web Tokens).
- **Flow**:
  1. User registers/logs in via Frontend.
  2. Backend validates credentials and issues an `access_token` and `refresh_token`.
  3. Frontend stores tokens (likely in LocalStorage/Cookies) and attaches them to subsequent API requests via the `Authorization` header.
  4. Middleware in Backend verifies the token for protected routes.

### 2. Portfolio Management

- **Model**: Users can create multiple `Portfolios`.
- **Assets**: Portfolios contain `Positions` which link to `Assets` (Coins/Tokens).
- **Transactions**: Buy/Sell/Transfer actions are recorded as `Transactions`.
- **Calculation**: Portfolio value is calculated by aggregating current market prices of assets held in positions.

### 3. Data Updates

- **Market Data**: The system fetches real-time or scheduled price updates (likely via background jobs using BullMQ) to update `Asset` prices.
- **Synchronization**: `Prisma` creates/updates records in the `PostgreSQL` database.

### 4. Portfolio System Logic

The portfolio system is the core of the application, designed to track asset performance and position history.

#### 4.1. Portfolio Structure

- A **Portfolio** is a container for holdings.
- It has a `baseCurrency` (e.g., USD, EUR) used for all aggregate value calculations.
- It contains **Positions**, where each position represents a specific Asset held.

#### 4.2. Position Management

Positions are _derived_ from Transactions but stored as separate records for performance.

- **Quantity**: Net sum of all buy/sell/inflow/outflow quantities.
- **Cost Basis**: Total cost to acquire the _current_ quantity.
  - **Buy**: Increases cost basis by (Price \* Qty) + Fees.
  - **Sell**: Reduces cost basis proprtionally.
    - `NewCostBasis = OldCostBasis - (OldCostBasis * (SellQty / OldQty))`
- **Realized PnL**: Calculated on every SELL transaction.
  - `RealizedPnL = SellValue - CostOfSoldParts - Fees`

#### 4.3 Transaction types

The system supports multiple transaction sides affecting positions differently:

- **BUY**: Increases Quantity and Cost Basis.
- **SELL**: Decreases Quantity and Cost Basis; Updates Realized PnL.
- **DEPOSIT / TRANSFER_IN / INCOME**: Increases Quantity; Cost Basis remains 0 (or treated as 0-cost acquisition).
- **WITHDRAWAL / TRANSFER_OUT / FEE**: Decreases Quantity; Reduces Cost Basis proportionally.

#### 4.4 Analytics & Performance

- **Live Performance**:
  - `Unrealized PnL = (Current Price * Quantity) - Cost Basis`
  - `Total Value = Sum(Position Market Values)`
- **Snapshots**:
  - A background job (or trigger) captures `PortfolioSnapshot` records (Total Value, PnL) over time.
  - These snapshots are used to render the **Performance Chart** (1D, 7D, 30D, All).
- **Allocation**:
  - The system calculates percentage allocation by Asset Type (Crypto, Fiat, Stocks, etc.) dynamically based on current market values.

### 5. Alerts

- Users can set price or percentage change alerts.
- The backend monitors price updates and triggers notifications (Email/In-app/Webhook) when conditions are met.

## 🚀 Setup & Implementation

### Prerequisites

- Node.js (v18+)
- PostgreSQL (v14+)
- Redis (for background jobs)

### 1. Database Setup

Ensure PostgreSQL is running and create a database (e.g., `crypto_tracker`).

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Environment Variables**:
   Copy the example environment file and configure it:

   ```bash
   cp .env.example .env
   ```

   Update `DATABASE_URL` in `.env` to point to your local PostgreSQL instance.

3. **Database Migration**:
   Push the Prisma schema to your database:

   ```bash
   npm run prisma:push
   # Or using migrate
   # npx prisma migrate dev
   ```

4. **Seed Database** (Optional but recommended):

   ```bash
   npm run prisma:seed
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The backend will start at `http://localhost:3001` (or port specified in `.env`).

### 3. Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env.local` file (or copy `.env.example` if available) and set the backend API URL:

   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The frontend will start at `http://localhost:3000`.

## 🛠 API Documentation

The backend exposes a REST API. Key endpoints include:

- `POST /api/auth/register`: Create a new user account.
- `POST /api/auth/login`: Authenticate user.
- `GET /api/portfolios`: List user portfolios.
- `GET /api/portfolios/:id`: Get portfolio details.
- `POST /api/portfolios/:id/transactions`: Add a transaction.
- `GET /api/assets`: List supported assets.
