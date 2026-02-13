# Crypto Portfolio Tracker - User Guide

This guide explains the meaningful concepts and logic behind the Crypto Portfolio Tracker. It is designed to help you understand how the system works and how to interpret the numbers you see.

## 1. System Overview

The Crypto Portfolio Tracker is a tool to monitor your cryptocurrency investments across different wallets and exchanges in one place. It does not hold your actual assets; instead, it tracks the _value_ of your holdings based on the transactions you record.

### Core Concepts

- **Portfolio**: A collection of assets. You can have multiple portfolios (e.g., "Main Holidings", "High Risk", "Retirement"). Each portfolio has a **Base Currency** (like USD or EUR) which all asset values are converted to for a unified total.
- **Asset**: A cryptocurrency or token (e.g., Bitcoin, Ethereum).
- **Position**: The amount of a specific asset you currently hold in a portfolio.
- **Transaction**: A record of a movement (buying, selling, transferring) that changes your position.

## 2. Managing Your Portfolio

### Creating a Portfolio

When you create a portfolio, you select a **Base Currency**. This is important because:

- All your dashboard totals will be shown in this currency.
- The system automatically handles currency conversion. For example, if your base currency is USD but you buy Bitcoin with EUR, the system calculates the USD value of that trade at the time it happened.

## 3. Recording Transactions

To ensure your portfolio is accurate, you must record transactions that reflect your real-world activity. The system supports several types:

### A. Buy

**Use this when:** You exchange fiat currency (USD, EUR) or another asset to acquire a crypto asset.

- **Effect**: Increases your asset Quantity.
- **Cost Basis**: Increases by the total value of what you paid (Trade Value + Fees).
- **Example**: Buying 1 BTC for $50,000. Your Quantity becomes 1, and Cost Basis becomes $50,000.

### B. Sell

**Use this when:** You exchange a crypto asset for fiat currency.

- **Effect**: Decreases your asset Quantity.
- **Cost Basis**: Reduces proportionally.
- **PnL**: The system calculates "Realized Profit/Loss" by comparing the value you sold it for against the average cost to acquire that portion.

### C. Deposit / Transfer In / Income

**Use this when:**

- **Deposit**: You move existing crypto into a wallet you are tracking from a source you _aren't_ tracking.
- **Transfer In**: Moving assets between your own accounts (if tracking individually).
- **Income**: Gaining crypto from staking, mining, or airdrops.
- **Effect**: Increases your asset Quantity.
- **Cost Basis**:
  - **Income**: Often treated as a purchase with $0 cost (or market value at time of receipt, depending on tax settings).
  - **Deposit**: Adds quantity without increasing the "cost" to acquire it within this specific portfolio logic (effectively lowering your average buy price).

### D. Withdrawal / Transfer Out / Fee

**Use this when:** You send crypto out of your tracked wallet, or pay a fee in crypto.

- **Effect**: Decreases your asset Quantity.
- **Cost Basis**: Reduces proportionally (similar to selling, but doesn't trigger a Realized PnL event in the same way).

## 4. Understanding Performance Metrics

The system provides two key ways to look at profit and loss:

### Unrealized PnL (Paper Profit)

This shows how much you _would_ make or lose if you sold everything right now.

- **Calculation**: `(Current Market Price * Quantity) - Remaining Cost Basis`
- **Meaning**: If this is positive, your assets are worth more than you paid for them. This changes constantly with market prices.

### Realized PnL (Locked-in Profit)

This shows the actual profit or loss you have "booked" by selling assets.

- **Calculation**: `Value Sold - (Average Cost of Sold Coins) - Fees`
- **Meaning**: This number only changes when you sell. It represents money you have actually made.

### Total Portfolio Value

This is the sum of the current market value of all your open positions.

## 5. Alerts

You can set alerts to stay informed without constantly checking the charts.

- **Price Alert**: Notify me if Bitcoin goes above $100,000.
- **Percentage Alert**: Notify me if Ethereum drops by 5% in 1 hour.
