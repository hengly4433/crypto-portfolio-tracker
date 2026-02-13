'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Loader2,
  ArrowUpDown,
  Briefcase,
  Coins,
  ReceiptText,
  Clock,
  AlertCircle,
  DollarSign,
  FileText,
} from 'lucide-react';

/* ── tiny helper ─────────────────────────────────────────────── */
function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

/* ── shared field styling ────────────────────────────────────── */
const fieldBase =
  'w-full h-10 px-3 rounded-lg text-sm bg-background dark:bg-input/30 border border-input shadow-xs transition-all outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]';

const fieldHoverWrap =
  'group/field rounded-lg transition-all';

/* ── main form ───────────────────────────────────────────────── */
function TransactionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPortfolioId = searchParams.get('portfolioId') || '';

  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [portfolioId, setPortfolioId] = useState(initialPortfolioId);
  const [assetId, setAssetId] = useState('');
  const [side, setSide] = useState('BUY');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [transactionCurrency, setTransactionCurrency] = useState('USD');
  const [feeAmount, setFeeAmount] = useState('');
  const [feeCurrency, setFeeCurrency] = useState('USD');
  const [tradeTime, setTradeTime] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!apiClient.isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      const portfoliosResult = await apiClient.getPortfolios();
      if (!portfoliosResult.error && portfoliosResult.data) {
        setPortfolios(portfoliosResult.data);
        if (portfoliosResult.data.length > 0 && !portfolioId) {
          setPortfolioId(portfoliosResult.data[0].id);
        }
      }

      const assetsResult = await apiClient.getAssets();
      if (!assetsResult.error && assetsResult.data) {
        setAssets(assetsResult.data);
        if (assetsResult.data.length > 0) {
          setAssetId(assetsResult.data[0].id);
        }
      }
    } catch {
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── live total ──────────────────────────────────────────── */
  const totalAmount = useMemo(() => {
    const q = parseFloat(quantity);
    const p = parseFloat(price);
    if (!isNaN(q) && !isNaN(p)) return q * p;
    return null;
  }, [quantity, price]);

  /* ── submit ──────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!portfolioId || !assetId || !quantity || !price) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const transactionData = {
        assetId,
        userAccountId: '1',
        side,
        quantity: parseFloat(quantity),
        price: parseFloat(price),
        transactionCurrency,
        feeAmount: feeAmount ? parseFloat(feeAmount) : 0,
        feeCurrency,
        tradeTime: new Date(tradeTime).toISOString(),
        note,
      };

      const result = await apiClient.createTransaction(
        portfolioId,
        transactionData
      );
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success('Transaction added successfully');
      if (initialPortfolioId) {
        router.push(`/portfolio/${initialPortfolioId}`);
      } else {
        router.push('/transactions');
      }
    } catch {
      setError('Failed to add transaction');
      toast.error('Failed to add transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── loading state ───────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading form…</p>
        </div>
      </div>
    );
  }

  /* ── render ──────────────────────────────────────────────── */
  return (
    <Card variant="glass" className="max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Add New Transaction</CardTitle>
      </CardHeader>

      <CardContent>
        {/* error banner */}
        {error && (
          <div className="mb-6 p-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 animate-fade-in-up">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ─── Section 1 · Trade Details ───────────────── */}
          <section className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <SectionHeader icon={Briefcase} title="Trade Details" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Portfolio */}
              <div className={fieldHoverWrap}>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Portfolio <span className="text-primary">*</span>
                </label>
                <select
                  value={portfolioId}
                  onChange={(e) => setPortfolioId(e.target.value)}
                  className={fieldBase}
                  required
                >
                  {portfolios.map((portfolio) => (
                    <option
                      key={portfolio.id}
                      value={portfolio.id}
                      className="bg-popover text-popover-foreground"
                    >
                      {portfolio.name} ({portfolio.baseCurrency})
                    </option>
                  ))}
                </select>
              </div>

              {/* Asset */}
              <div className={fieldHoverWrap}>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Asset <span className="text-primary">*</span>
                </label>
                <select
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className={fieldBase}
                  required
                >
                  {assets.map((asset) => (
                    <option
                      key={asset.id}
                      value={asset.id}
                      className="bg-popover text-popover-foreground"
                    >
                      {asset.symbol} – {asset.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Transaction Type */}
              <div className={fieldHoverWrap}>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Transaction Type <span className="text-primary">*</span>
                </label>
                <select
                  value={side}
                  onChange={(e) => setSide(e.target.value)}
                  className={fieldBase}
                  required
                >
                  <option value="BUY" className="bg-popover text-popover-foreground">Buy</option>
                  <option value="SELL" className="bg-popover text-popover-foreground">Sell</option>
                  <option value="DEPOSIT" className="bg-popover text-popover-foreground">Deposit</option>
                  <option value="WITHDRAWAL" className="bg-popover text-popover-foreground">Withdrawal</option>
                  <option value="TRANSFER_IN" className="bg-popover text-popover-foreground">Transfer In</option>
                  <option value="TRANSFER_OUT" className="bg-popover text-popover-foreground">Transfer Out</option>
                </select>
              </div>

              {/* Transaction Currency */}
              <div className={fieldHoverWrap}>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Transaction Currency <span className="text-primary">*</span>
                </label>
                <select
                  value={transactionCurrency}
                  onChange={(e) => setTransactionCurrency(e.target.value)}
                  className={fieldBase}
                  required
                >
                  <option value="USD" className="bg-popover text-popover-foreground">USD</option>
                  <option value="USDT" className="bg-popover text-popover-foreground">USDT</option>
                  <option value="EUR" className="bg-popover text-popover-foreground">EUR</option>
                  <option value="KHR" className="bg-popover text-popover-foreground">KHR</option>
                </select>
              </div>
            </div>
          </section>

          {/* ─── Section 2 · Amount ──────────────────────── */}
          <section className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <SectionHeader icon={Coins} title="Amount" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Quantity */}
              <div className={fieldHoverWrap}>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Quantity <span className="text-primary">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={fieldBase}
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Price per Unit */}
              <div className={fieldHoverWrap}>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Price per Unit <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="number"
                    step="any"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className={`${fieldBase} pl-9`}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Live Total Preview */}
            {totalAmount !== null && (
              <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/15 flex items-center justify-between animate-fade-in-up">
                <span className="text-sm font-medium text-muted-foreground">
                  Estimated Total
                </span>
                <span className="text-lg font-bold text-primary tabular-nums">
                  {transactionCurrency === 'USD' || transactionCurrency === 'USDT'
                    ? '$'
                    : transactionCurrency === 'EUR'
                    ? '€'
                    : ''}
                  {totalAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    {transactionCurrency}
                  </span>
                </span>
              </div>
            )}
          </section>

          {/* ─── Section 3 · Fees ────────────────────────── */}
          <section className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <SectionHeader icon={ReceiptText} title="Fees" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Fee Amount */}
              <div className={fieldHoverWrap}>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Fee Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="number"
                    step="any"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                    className={`${fieldBase} pl-9`}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Fee Currency */}
              <div className={fieldHoverWrap}>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Fee Currency
                </label>
                <select
                  value={feeCurrency}
                  onChange={(e) => setFeeCurrency(e.target.value)}
                  className={fieldBase}
                >
                  <option value="USD" className="bg-popover text-popover-foreground">USD</option>
                  <option value="USDT" className="bg-popover text-popover-foreground">USDT</option>
                  <option value="EUR" className="bg-popover text-popover-foreground">EUR</option>
                  <option value="KHR" className="bg-popover text-popover-foreground">KHR</option>
                </select>
              </div>
            </div>
          </section>

          {/* ─── Section 4 · Timing & Notes ──────────────── */}
          <section className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <SectionHeader icon={Clock} title="Timing & Notes" />

            <div className="space-y-5">
              {/* Date & Time */}
              <div className={fieldHoverWrap}>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Date & Time <span className="text-primary">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={tradeTime}
                  onChange={(e) => setTradeTime(e.target.value)}
                  className={`${fieldBase} min-h-[40px]`}
                  required
                />
              </div>

              {/* Notes */}
              <div className={fieldHoverWrap}>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Notes
                  </span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm bg-background dark:bg-input/30 border border-input shadow-xs transition-all outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] resize-none"
                  placeholder="Any additional notes about this transaction…"
                  rows={3}
                />
              </div>
            </div>
          </section>

          {/* ─── Actions ─────────────────────────────────── */}
          <div className="pt-2 border-t border-border flex justify-end gap-3 animate-fade-in-up" style={{ animationDelay: '0.55s' }}>
            <Link
              href={
                initialPortfolioId
                  ? `/portfolio/${initialPortfolioId}`
                  : '/transactions'
              }
            >
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="glow" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding…
                </>
              ) : (
                'Add Transaction'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* ── page wrapper ────────────────────────────────────────────── */
export default function NewTransactionPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* header */}
      <div className="mb-10 animate-fade-in-up">
        <Link
          href="/transactions"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4 transition-colors inline-flex"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Transactions
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/80 to-primary/40 shadow-lg shadow-primary/20">
            <ArrowUpDown className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              New Transaction
            </h1>
            <p className="mt-1 text-muted-foreground">
              Record a new buy, sell, or transfer transaction
            </p>
          </div>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" />
          </div>
        }
      >
        <TransactionForm />
      </Suspense>
    </div>
  );
}
