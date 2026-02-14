# Crypto Portfolio Tracker

A comprehensive, full-stack cryptocurrency portfolio tracking application built with a modern tech stack. This system allows users to track their crypto assets across multiple wallets and exchanges, visualize performance with real-time data, and set sophisticated alerts. The project consists of a robust backend API, a responsive web frontend, and a cross-platform mobile application.

## 🏗 System Architecture

The project follows a modular client-server architecture designed for scalability and maintainability:

### 1. Backend API (`/backend`)

- **Core**: Node.js with Express.
- **Language**: TypeScript for type safety.
- **Database**: PostgreSQL with Prisma ORM for relational data management.
- **Caching & Queues**: Redis is used for caching price data and managing background job queues via BullMQ.
- **External APIs**: Integrates with CoinGecko (Crypto) and AlphaVantage (Forex/Commodities) for market data.

### 2. Web Frontend (`/frontend`)

- **Framework**: Next.js 15 (App Router) for server-side rendering and static generation.
- **Styling**: Tailwind CSS with Shadcn UI for a modern, accessible component library.
- **State Management**: React Query for server state and caching.
- **Visualization**: Recharts for interactive financial charts.

### 3. Mobile App (`/app`)

- **Framework**: Expo (React Native).
- **Navigation**: React Navigation (Stack & Tab).
- **State Management**: Zustand for global client state.
- **Storage**: AsyncStorage for local persistence.

---

## 🧠 Logic & Data Processing

### 1. Authentication & Security

- **JWT Authentication**: Secure stateless authentication using Access and Refresh tokens.
- **Flow**:
  1. User logs in -> Backend validates & issues tokens.
  2. Tokens are stored securely (HTTP-only cookies on web, SecureStore/AsyncStorage on mobile).
  3. subsequent requests include `Authorization: Bearer <token>`.
  4. Interceptors automatically handle token refreshment on 401 errors.

### 2. Price Feeds & Market Data

- **Multi-Source Fetching**: The `PriceService` intelligently fetches data from CoinGecko for crypto and AlphaVantage for forex/gold.
- **Smart Caching**:
  - **Redis Layer**: Prices are cached in Redis (TTL ~1-5 min) to minimize external API calls and avoid rate limits.
  - **Database Layer**: Historical price points are stored in PostgreSQL for trend analysis.
- **Batch Processing**: The system assumes a "Batch Fetch" strategy for crypto prices, grouping requests to optimize quota usage.

### 3. Background Jobs (BullMQ)

The system uses BullMQ with Redis to handle asynchronous tasks reliably:

- **`alert-checks`**: Runs every minute. Checks active alerts against current market prices and triggers notifications.
- **`notifications`**: Processes pending notifications (email, push) to ensure delivery without blocking the main API thread.
- **`price-updates`**: (Configurable) Scheduled jobs to update asset prices in the background.

### 4. Portfolio Mathematics

- **Average Cost Basis**: The system calculates the average cost of acquiring assets.
  - _Formula_: `(Old Cost + New Transaction Value) / Total Quantity`.
- **PnL Calculation**:
  - **Unrealized PnL**: `(Current Price - Avg Comp Cost) * Quantity`.
  - **Realized PnL**: Calculated only on **SELL** transactions associated with the specific cost basis of the assets sold.
- **Snapshots**: Periodic snapshots of portfolio value are taken to generate historical performance charts (1D, 7D, 30D, All).

---

## 🚀 Setup & Implementation

### Prerequisites

- **Node.js**: v18+
- **PostgreSQL**: v14+
- **Redis**: v6+ (Required for caching and background jobs)

### 1. Backend Setup (`/backend`)

1.  **Navigate & Install**:
    ```bash
    cd backend
    npm install
    ```
2.  **Environment Variables**:
    ```bash
    cp .env.example .env
    ```
    Update `.env` with your credentials:
    - `DATABASE_URL`: PostgreSQL connection string.
    - `REDIS_URL`: Redis connection string (default: `redis://localhost:6379`).
    - `COINGECKO_API_KEY`: Optional but recommended for higher rate limits.
3.  **Database Init**:
    ```bash
    npx prisma db push  # Synch schema
    npm run prisma:seed # (Optional) Seed initial data
    ```
4.  **Start Server**:
    ```bash
    npm run dev
    # Server runs on http://localhost:3001
    ```

### 2. Frontend Setup (`/frontend`)

1.  **Navigate & Install**:
    ```bash
    cd frontend
    npm install
    ```
2.  **Environment**:
    Create `.env.local`:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:3001/api
    ```
3.  **Start Web App**:
    ```bash
    npm run dev
    # App runs on http://localhost:3000
    ```

### 3. Mobile App Setup (`/app`)

1.  **Navigate & Install**:
    ```bash
    cd app
    npm install
    ```
2.  **Environment**:
    Create `.env`:
    ```env
    EXPO_PUBLIC_API_URL=http://localhost:3001/api
    # If using physical device, replace localhost with your machine's LAN IP (e.g., http://192.168.1.10:3001/api)
    ```
3.  **Run with Expo**:
    ```bash
    npx expo start
    ```

    - Press `i` for iOS Simulator.
    - Press `a` for Android Emulator.
    - Scan QR code with **Expo Go** on your physical device.

---

## 🛠 Feature Highlights

### ⚡ Global Search

Instantly search for any cryptocurrency supported by CoinGecko. The search uses a caching layer to provide instant results for popular assets.

### 🔔 Smart Alerts

Set conditional alerts to stay on top of the market:

- **Price Target**: "Notify when BTC > $100k".
- **Percentage Change**: "Notify if ETH drops 5% in 1 hour".
- **Portfolio Drawdown**: "Warn me if my total portfolio value drops by 10%".

### 📊 Advanced Visualization

- **Allocation Charts**: Donut charts showing distribution by asset or category.
- **Performance Graphs**: Interactive area charts showing portfolio value over time.

---

## 🤝 Contributing

1. Fork the repo.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes.
4. Push to the branch.
5. Open a Pull Request.
