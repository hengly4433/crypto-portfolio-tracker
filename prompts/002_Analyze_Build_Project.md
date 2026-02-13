After verifying tasks @001_Build_Project.md, start analyzing the project and provide a detailed analysis of the project.

1. High-level data model

You are building an investing-style tracker: users, accounts/exchanges, portfolios, positions, transactions, market prices, and alerts.

**Main concepts:**

- User & authentication
- Portfolio (logical grouping of assets)
- Account / Exchange / Wallet
- Asset (BTC, ETH, XAUUSD, EURUSD, etc.)
- Holding / Position (how much of each asset user owns)
- Transactions (buys, sells, deposits, withdrawals, transfers, income)
- Market prices & candles
- Alerts & notifications
- Audit, logs, API keys

2. Relational schema (PostgreSQL)

2.1 Users and auth

**users**

- id (PK, bigint)
- email (varchar, unique)
- password_hash (varchar)
- full_name (varchar)
- country (varchar, e.g. “KH”)
- created_at (timestamptz)
- updated_at (timestamptz)
- last_login_at (timestamptz)
- is_active (boolean)

**user_sessions**

- id (PK)
- user_id (FK → users.id)
- jwt_id (uuid)
- user_agent (text)
- ip_address (inet)
- created_at
- expires_at
- revoked_at (nullable)

This supports JWT + refresh token blacklisting and audit of logins.

2.2 Assets and markets

**assets**

- id (PK, bigint)
- symbol (varchar, e.g. “BTC”, “ETH”, “XAUUSD”, “EURUSD”)
- name (varchar)
- asset_type (enum: CRYPTO, FOREX, COMMODITY, FIAT)
- base_currency (varchar, e.g. “BTC” for BTC/USDT; for single-asset like BTC use null)
- quote_currency (varchar, e.g. “USDT”, “USD”, “KHR”)
- coingecko_id (varchar, nullable, for crypto price API)
- external_symbol (varchar, for broker/forex APIs)
- precision (smallint, decimal places)
- is_active (boolean)
- created_at
- updated_at

**markets**

- id (PK, bigint)
- asset_id (FK → assets.id)
- market_type (enum: SPOT, DERIVATIVE, FOREX, METAL)
- default_quote_currency (varchar)
- is_default (boolean)
- created_at (timestamptz)
- updated_at (timestamptz)

This allows BTC as an asset and multiple markets (BTC/USDT, BTC/USD).
2.3 Exchanges, wallets and accounts

**exchanges**

- id (PK, bigint)
- name (varchar, e.g. “Binance”, “OKX”)
- code (varchar, e.g. “BINANCE”)
- type (enum: CEX, DEX, WALLET, BROKER)
- website_url (varchar)
- created_at (timestamptz)
- updated_at (timestamptz)

**user_accounts**

- id (PK, bigint)
- user_id (FK → users.id)
- exchange_id (FK → exchanges.id)
- name (varchar, e.g. “Binance Main”, “MetaMask 0x1234”)
- account_type (enum: SPOT, FUTURES, MARGIN, WALLET)
- base_currency (varchar, e.g. “USD”, “USDT”)
- is_default (boolean)
- created_at (timestamptz)
- updated_at (timestamptz)

**user_api_keys**

- id (PK, bigint)
- user_id (FK → users.id)
- exchange_id (FK → exchanges.id)
- label (varchar)
- api_key_encrypted (text)
- api_secret_encrypted (text)
- passphrase_encrypted (text, nullable)
- is_read_only (boolean)
- status (enum: ACTIVE, DISABLED)
- created_at (timestamptz)
- updated_at (timestamptz)

You can use these to import balances/transactions from exchanges or brokers.

2.4 Portfolios and positions

**portfolios**

- id (PK, bigint)
- user_id (FK → users.id)
- name (varchar, e.g. “Long-term HODL”, “Forex Day Trading”)
- base_currency (varchar, e.g. “USD”, “KHR”, “USDT”)
- description (text)
- is_default (boolean)
- created_at (timestamptz)
- updated_at (timestamptz)

**portfolio_accounts (optional, if one portfolio aggregates multiple accounts)**

- id (PK, bigint)
- portfolio_id (FK → portfolios.id)
- user_account_id (FK → user_accounts.id)
- weight (numeric, nullable, target allocation weight)

**positions (current holdings per portfolio & asset)**

- id (PK, bigint)
- portfolio_id (FK → portfolios.id)
- asset_id (FK → assets.id)
- user_account_id (FK → user_accounts.id, nullable if logical-only)
- quantity (numeric) – current number of units
- cost_basis (numeric) – total cost in portfolio base currency
- avg_price (numeric) – cost_basis / quantity
- realized_pnl (numeric) – realized P/L in base currency
- unrealized_pnl (numeric)
- last_updated_at (timestamptz)
- UNIQUE (portfolio_id, asset_id, user_account_id)

This corresponds conceptually to a “holding” table in investing schemas.

2.5 Transactions

**transactions**

- id (PK, bigint)
- portfolio_id (FK → portfolios.id)
- user_account_id (FK → user_accounts.id)
- asset_id (FK → assets.id)
- side (enum: BUY, SELL, DEPOSIT, WITHDRAWAL, TRANSFER_IN, TRANSFER_OUT, INCOME, FEE)
- quantity (numeric) – positive for inflow, negative for outflow (buysell semantics)
- price (numeric) – per unit, in transaction_currency
- transaction_currency (varchar, e.g. “USDT”, “USD”, “KHR”)
- gross_amount (numeric) – quantity * price
- fee_amount (numeric)
- fee_currency (varchar)
- trade_time (timestamptz)
- trade_id_external (varchar, e.g. exchange trade id)
- note (text)
- created_at (timestamptz)
- updated_at (timestamptz)

**cash_movements (optional, if you want explicit cash ledger)**

- id (PK, bigint)
- portfolio_id (FK → portfolios.id)
- currency (varchar)
- amount (numeric)
- type (enum: DEPOSIT, WITHDRAWAL, FEE, INTEREST, DIVIDEND)
- related_transaction_id (FK → transactions.id, nullable)
- occurred_at (timestamptz)

Transactions are your source of truth for P/L; positions are projections based on transaction history.

2.6 Market prices and candles

**prices_spot**

- id (PK, bigint)
- asset_id (FK → assets.id)
- quote_currency (varchar)
- price (numeric)
- source (varchar, e.g. “COINGECKO”, “ALPHAVANTAGE”)
- fetched_at (timestamptz)

**candles**

- id (PK, bigint)
- asset_id (FK → assets.id)
- timeframe (enum: M1, M5, H1, D1)
- open (numeric)
- high (numeric)
- low (numeric)
- close (numeric)
- volume (numeric)
- open_time (timestamptz)
- close_time (timestamptz)
- source (varchar)
- UNIQUE (asset_id, timeframe, open_time)

You can optionally store only daily candles to reduce volume.

2.7 Alerts and notifications

**alerts**

- id (PK, bigint)
- user_id (FK → users.id)
- portfolio_id (FK → portfolios.id, nullable)
- asset_id (FK → assets.id, nullable)
- alert_type (enum: PRICE_ABOVE, PRICE_BELOW, PERCENT_CHANGE, PORTFOLIO_DRAWDOWN, TARGET_PNL)
- condition_value (numeric, e.g. 50000 for BTC price)
- lookback_window_minutes (int, nullable, for percentage change)
- is_active (boolean)
- last_triggered_at (timestamptz, nullable)
- created_at
- updated_at

**notifications**

- id (PK, bigint)
- user_id (FK → users.id)
- alert_id (FK → alerts.id, nullable)
- channel (enum: IN_APP, EMAIL, TELEGRAM, WEBHOOK)
- payload (jsonb)
- status (enum: PENDING, SENT, FAILED)
- created_at
- sent_at (timestamptz, nullable)

2.8 Audit, logs, and settings

**audit_log**

- id (PK, bigint)
- user_id (FK → users.id, nullable)
- entity_type (varchar, e.g. “PORTFOLIO”, “TRANSACTION”)
- entity_id (bigint)
- action (enum: CREATE, UPDATE, DELETE, LOGIN)
- old_value (jsonb)
- new_value (jsonb)
- created_at
- ip_address (inet, nullable)

**user_settings**

- id (PK, bigint)
- user_id (FK → users.id)
- base_currency (varchar)
- timezone (varchar)
- locale (varchar)
- dark_mode (boolean)
- created_at
- updated_at

3. Core processing logic

Now how all of this is processed end-to-end: CRUD flows, calculation flows, and async/background flows.

3.1 User onboarding & portfolio creation

    1. Signup
       - User registers with email/password.
       - Hash password, create users row, create default user_settings (e.g. base_currency = “USD” or “KHR”), log to audit_log.
    2. Initial portfolio
       - Create default portfolios row, base_currency from settings.
       - Optionally create default user_account named “Manual Account”.
    3. Optional API connection
       - User adds Binance API key.
       - You store encrypted keys in user_api_keys marked is_read_only = true.
       - Background job starts initial sync (see below).

All of this is simple transactional CRUD with validation (unique email, strong password, etc.).

3.2 Manual transaction entry

Scenario: user clicks “Add transaction – Buy 0.1 BTC at 40,000 USDT”.

**Processing steps (service layer):**

1. Validate input

- Check user owns the portfolio & account (user_id from JWT).
- Ensure asset_id exists and matches type (CRYPTO/FOREX).
- Validate side ∈ {BUY, SELL, …}, quantity > 0, price > 0.

2. Convert to base currency

- Retrieve prices_spot for quote currency vs portfolio base (e.g. USDT→USD or KHR).
- Compute gross_amount_base = quantity * price * fx_rate.

3. Persist transaction

- Insert row in transactions with side=BUY, quantity = +0.1, price=40,000, transaction_currency="USDT", gross_amount, fee, trade_time.

4. Update position (write model)

- Fetch existing positions row by (portfolio_id, asset_id, user_account_id).
- If not exists, create record with quantity=0, cost_basis=0, realized_pnl=0.
- For BUY:
    - new_quantity = old_quantity + quantity
    - new_cost_basis = old_cost_basis + gross_amount_base + fee_base
    - avg_price = new_cost_basis / new_quantity
- Save updated position.

5. Emit events

- Publish domain event TransactionCreated to message bus (Kafka / in-memory) for:
  - analytics update
  - alerts check
  - WebSocket broadcast to UI.

All of this happens inside a single DB transaction to keep positions consistent.

3.3 Sell logic and P/L computation

**When the user sells, you need to:**

- reduce quantity
- compute realized P/L
- update cost basis and unrealized P/L

Let’s assume FIFO to keep it simple.

1. Fetch position

- Check positions.quantity >= sell_quantity; otherwise throw validation error.

2. Compute realized P/L

- Compute average cost price: avg_price (stored).
- Convert sell price to base currency (if needed).
- proceeds_base = sell_quantity * sell_price * fx_rate
- cost_base = sell_quantity * avg_price
- realized = proceeds_base - cost_base - fee_base

3. Update position

- new_quantity = old_quantity - sell_quantity
- new_cost_basis = old_cost_basis - cost_base
- if new_quantity > 0:
    - avg_price remains new_cost_basis / new_quantity
- realized_pnl = old_realized_pnl + realized

4. Unrealized P/L

- Later, when price updates, you set unrealized_pnl = quantity * (current_price_base - avg_price)

The math aligns with how portfolio trackers and openalloc schemas treat P/L from transaction-level records.

3.4 Exchange sync (background jobs)

**For read-only API integrations:**

1. Scheduler

- Every N minutes, pick active user_api_keys.

2. Fetch balances & trades

- Call exchange REST APIs by API key.
- Map external symbols to internal assets rows (e.g. “BTCUSDT” → BTC asset + USDT quote_currency).

3. Transaction upsert

- For each trade from exchange:
  - if external_trade_id not in transactions.trade_id_external, insert new transaction.
  - Use same logic as manual entry to update positions.

4. Sync-only vs manual override

- Flag transactions from exchange as source = EXCHANGE; manual ones as MANUAL.

You may also store raw JSON in a external_import_log table for debugging.

3.5 Price ingestion and portfolio valuation

**A separate component periodically fetches prices:**

1. Fetch prices via APIs

- Crypto: CoinGecko / exchange tickers (BTC, ETH, etc., vs USDT or USD).
- Forex/gold: Alpha Vantage or other market data.
​
2. Store in prices_spot

- Upsert by (asset_id, quote_currency) with latest price and fetched_at.

3. Update positions & portfolios

- For each affected asset, compute:
    - current_price_base = market_price_in_quote × fx_rate(quote→base_currency)
    - market_value = quantity × current_price_base
    - unrealized_pnl = quantity × (current_price_base − avg_price)
- Store aggregated totals:
    - sum over positions to compute portfolio_total_value, total_unrealized_pnl, etc.
- Option: maintain a portfolio_snapshots table:

**portfolio_snapshots**

- id (PK)
- portfolio_id (FK)
- total_value (numeric)
- total_unrealized_pnl (numeric)
- total_realized_pnl (numeric)
- created_at (timestamptz, typically hourly/daily)

These snapshots power performance charts and time-series analytics.
3.6 Analytics & dashboard logic

**The dashboard shows:**

- Today’s portfolio value
- P/L over selected period
- Allocation pie chart
- Top winners/losers

**Processing:**

1. Time range selection

- User selects range (7 days, 30 days).

2. Fetch snapshots

- Query portfolio_snapshots between start and end (ORDER BY created_at).

3. Calculate metrics

- Return series of (timestamp, total_value).
- Compute overall return: (value_end - value_start + cash_outflows - cash_inflows) / value_start.
- For allocation: aggregate positions:
  - group by asset_type (CRYPTO/FOREX/GOLD/FIAT)
  - or by symbol

4. Formatting

**Return aggregated DTOs to frontend:**

- PortfolioSummaryDto
- AllocationSliceDto
- PerformancePointDto

This follows common personal finance and portfolio tracker patterns.

3.7 Alert evaluation

**Alerts are of these kinds:**

- Price crossing level
- Percentage change (% move in lookback)
- Portfolio drawdown

**Processing loop (background worker):**

1. On price update (preferred)

- For each updated prices_spot record (asset), load active alerts where asset_id = x.

2. Check conditions

- PRICE_ABOVE: if current_price >= condition_value.
- PRICE_BELOW: if current_price <= condition_value.
- PERCENT_CHANGE:
  - compute price at now - lookback_window using candles or snapshots.
  - percent = (current - past) / past × 100.

3. Throttle triggers

- Compare with alerts.last_triggered_at.
- If recently triggered (e.g. last 10 minutes) and price still around same region, optionally avoid spam.

4. Create notification

- Insert into notifications with channel, payload (JSON payload: symbol, current_price, condition_value).
- A separate job or microservice pushes actual email / Telegram messages.

For portfolio-drawdown alerts, use portfolio_snapshots rather than instant prices: e.g. if from last high, portfolio total value drops by more than X%.
​

3.8 Security, validation, and audit

**For each modifying operation:**

- Ensure user_id from JWT owns the relevant portfolio/account.
- Use Bean Validation:
  - quantity: @DecimalMin("0.00000001")
  - price: @DecimalMin("0.00000001")
  - side: @NotNull
- Use global exception handling to return standardized error payloads.
- Use audit_log:
  - On transaction create/update/delete, store old_value + new_value as JSON.

This gives traceability, especially important for financial/calculation issues.
​
4. Example: complete ERD-style listing

**To make the design crystal clear, here is a compact ERD-style list of main relationships:**

- users (1) ─── (n) user_sessions
- users (1) ─── (n) user_settings (1:1 via unique FK)
- users (1) ─── (n) portfolios
- users (1) ─── (n) user_accounts
- exchanges (1) ─── (n) user_accounts
- exchanges (1) ─── (n) user_api_keys
- portfolios (1) ─── (n) portfolio_accounts ─── (n) user_accounts
- portfolios (1) ─── (n) positions
- assets (1) ─── (n) positions
- portfolios (1) ─── (n) transactions
- assets (1) ─── (n) transactions
- user_accounts (1) ─── (n) transactions
- assets (1) ─── (n) prices_spot
- assets (1) ─── (n) candles
- portfolios (1) ─── (n) portfolio_snapshots
- users (1) ─── (n) alerts
- assets (1) ─── (n) alerts
- portfolios (1) ─── (n) alerts
- alerts (1) ─── (n) notifications

This structure is flexible enough for crypto, forex, and gold, and matches how real portfolio schemas handle holdings and transactions.

