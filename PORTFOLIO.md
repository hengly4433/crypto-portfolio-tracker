# Crypto Portfolio Tracker - User Guide & Logic

This guide provides an in-depth explanation of how the Crypto Portfolio Tracker functions, calculates your performance, and how to best utilize its features on both Web and Mobile.

## 1. Core Logic: How We Calculate Your Numbers

The system uses specific accounting methods to track your performance. Understanding this ensures you know exactly what your "Profit/Loss" numbers mean.

### A. Average Cost Basis (ACB)

We use the **Average Cost Basis** method to track the cost of your investments. This is the industry standard for portfolio tracking.

**The Formula:**
When you buy more of an asset, your new "average buy price" is recalculated:

```
New Avg Price = ( (Old Qty * Old Avg Price) + (New Qty * New Buy Price) ) / Total New Qty
```

**Example:**

1. You buy **1 BTC** at **$50,000**. (Avg Cost: $50,000)
2. You buy **1 BTC** at **$60,000**.
3. Total spent: $110,000 for 2 BTC.
4. **New Avg Cost: $55,000**.

### B. Profit & Loss (PnL)

#### Unrealized PnL (Paper Profit)

This is the theoretical profit you would make if you sold everything _right now_.

- `(Current Market Price - Avg Cost) * Quantity`

#### Realized PnL (Locked-in Profit)

This is the actual profit you made from _selling_ an asset.

- `(Sell Price - Avg Cost at time of sale) * Quantity Sold`

> **Note:** Realized PnL is calculated **FIFO (First-In, First-Out)** by default for tax estimations, but the UI simplifies this to show PnL against your _Average Cost_.

---

## 2. Transaction Types Explained

Correctly categorizing your transactions is crucial for accurate tracking.

### 🟢 Value-Increasing Events (Inflows)

| Type            | Description                                     | Effect on Cost Basis                                                                                      |
| :-------------- | :---------------------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| **BUY**         | Buying crypto with fiat.                        | **Updates** Avg Cost Basis relative to purchase price.                                                    |
| **DEPOSIT**     | Transferring crypto IN from an external wallet. | **Does NOT change** Avg Buy Price. Increases quantity only. (Effectively lowers avg cost if price > avg). |
| **INCOME**      | Staking rewards, Mining, Airdrops.              | Treated as a **$0 Cost** acquisition. Drastically lowers your Avg Buy Price.                              |
| **TRANSFER_IN** | Moving funds between tracked portfolios.        | Same as Deposit.                                                                                          |

### 🔴 Value-Decreasing Events (Outflows)

| Type             | Description                              | Effect on Cost Basis                                                 |
| :--------------- | :--------------------------------------- | :------------------------------------------------------------------- |
| **SELL**         | Selling crypto for fiat.                 | Realizes PnL. Does **NOT** change Avg Buy Price for remaining coins. |
| **WITHDRAWAL**   | moving crypto OUT to an external wallet. | Reduces Quantity. Does **NOT** realize PnL.                          |
| **FEE**          | Paying gas fees or exchange fees.        | Reduces Quantity. Treated as a realized loss for tax purposes.       |
| **TRANSFER_OUT** | Moving funds between tracked portfolios. | Same as Withdrawal.                                                  |

---

## 3. Mobile App Usage

The mobile app (`/app`) offers a streamlined experience for tracking on the go.

### 📱 Navigation

- **Dashboard (Home)**:
  - **Portfolio Card**: Swipe left/right to switch between different portfolios.
  - **Quick Actions**: "Add Transaction", "Price Alert".
  - **Top Movers**: Horizontal scroll of assets with biggest 24h change.

- **Portfolio Tab**:
  - Detailed list of all assets.
  - Sort by: Value (High-Low), Name (A-Z), Performance (Best-Worst).
  - Tap an asset to see its **History Graph** and **Transaction Log**.

- **Alerts Tab**:
  - Manage all active price and percentage alerts.
  - **Push Notifications**: Ensure you have enabled notifications in your OS settings to receive alerts even when the app is closed.

---

## 4. Advanced Alerts System

The system runs a background job every minute to check your alert conditions.

### Alert Types

1.  **Price Target**: `BTC > $100,000`
    - Good for: Taking profit or buying the dip.
2.  **Percentage Change**: `ETH drops 5% in 1 hour`
    - Good for: Catching sudden crashes or pumps (Volatility).
3.  **Portfolio Drawdown**: `Total Value drops 10% from High`
    - Good for: Risk management and stop-loss warnings for your entire account.

### How it works

1.  **Server-Side**: The backend checks CoinGecko API prices every 60 seconds.
2.  **Trigger**: If a condition is met, a **Notification Job** is created.
3.  **Delivery**:
    - **Mobile**: Push Notification via Flutter/Firebase.
    - **Email**: (If configured) Sent via SMTP.
    - **In-App**: Shows up in your Notifications center.

---

## 5. FAQs

**Q: Why is my Portfolio Value different from my Exchange?**
A: Exchanges often use "Bid" or "Mid-market" prices. We use the **Last Traded Price** from CoinGecko globally. Small discrepancies (<1%) are normal.

**Q: Do you treat Crypto-to-Crypto trades?**
A: Yes! A trade like "BTC -> ETH" is recorded as two transactions:

1.  **SELL BTC** (Realizes PnL on BTC).
2.  **BUY ETH** (Establishes new Cost Basis for ETH).

**Q: Is my data private?**
A: Yes. All data is stored on your own self-hosted database (PostgreSQL). No third-party analytics track your portfolio value.
