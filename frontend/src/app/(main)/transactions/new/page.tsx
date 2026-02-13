'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

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
  const [tradeTime, setTradeTime] = useState(new Date().toISOString().slice(0, 16));
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
      
      // Load portfolios
      const portfoliosResult = await apiClient.getPortfolios();
      if (!portfoliosResult.error && portfoliosResult.data) {
        setPortfolios(portfoliosResult.data);
        if (portfoliosResult.data.length > 0 && !portfolioId) {
          setPortfolioId(portfoliosResult.data[0].id);
        }
      }

      // Load assets
      const assetsResult = await apiClient.getAssets();
      if (!assetsResult.error && assetsResult.data) {
        setAssets(assetsResult.data);
        if (assetsResult.data.length > 0) {
          setAssetId(assetsResult.data[0].id);
        }
      }

    } catch (err) {
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

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
        userAccountId: '1', // Default account for now
        side,
        quantity: parseFloat(quantity),
        price: parseFloat(price),
        transactionCurrency,
        feeAmount: feeAmount ? parseFloat(feeAmount) : 0,
        feeCurrency: feeCurrency,
        tradeTime: new Date(tradeTime).toISOString(),
        note,
      };

      const result = await apiClient.createTransaction(portfolioId, transactionData);
      if (result.error) {
        setError(result.error);
        return;
      }

      // Redirect back to portfolio or transactions list
      if (initialPortfolioId) {
        router.push(`/portfolio/${initialPortfolioId}`);
      } else {
        router.push('/transactions');
      }
    } catch (err) {
      setError('Failed to add transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <Card variant="glass" className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add New Transaction</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-6 p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Portfolio *
              </label>
              <select
                value={portfolioId}
                onChange={(e) => setPortfolioId(e.target.value)}
                className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                required
              >
                {portfolios.map((portfolio) => (
                  <option key={portfolio.id} value={portfolio.id} className="bg-background text-foreground">
                    {portfolio.name} ({portfolio.baseCurrency})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Asset *
              </label>
              <select
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                required
              >
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id} className="bg-background text-foreground">
                    {asset.symbol} - {asset.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Transaction Type *
              </label>
              <select
                value={side}
                onChange={(e) => setSide(e.target.value)}
                className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                required
              >
                <option value="BUY" className="bg-background text-foreground">Buy</option>
                <option value="SELL" className="bg-background text-foreground">Sell</option>
                <option value="DEPOSIT" className="bg-background text-foreground">Deposit</option>
                <option value="WITHDRAWAL" className="bg-background text-foreground">Withdrawal</option>
                <option value="TRANSFER_IN" className="bg-background text-foreground">Transfer In</option>
                <option value="TRANSFER_OUT" className="bg-background text-foreground">Transfer Out</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Transaction Currency *
              </label>
              <select
                value={transactionCurrency}
                onChange={(e) => setTransactionCurrency(e.target.value)}
                className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                required
              >
                <option value="USD" className="bg-background text-foreground">USD</option>
                <option value="USDT" className="bg-background text-foreground">USDT</option>
                <option value="EUR" className="bg-background text-foreground">EUR</option>
                <option value="KHR" className="bg-background text-foreground">KHR</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Quantity *
              </label>
              <input
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Price per Unit *
              </label>
              <input
                type="number"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Fee Amount
              </label>
              <input
                type="number"
                step="any"
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
                className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Fee Currency
              </label>
              <select
                value={feeCurrency}
                onChange={(e) => setFeeCurrency(e.target.value)}
                className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="USD" className="bg-background text-foreground">USD</option>
                <option value="USDT" className="bg-background text-foreground">USDT</option>
                <option value="EUR" className="bg-background text-foreground">EUR</option>
                <option value="KHR" className="bg-background text-foreground">KHR</option>
              </select>
            </div>

            <div className="col-span-1 md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Date & Time *
              </label>
              <input
                type="datetime-local"
                value={tradeTime}
                onChange={(e) => setTradeTime(e.target.value)}
                className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all min-h-[40px]"
                required
              />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Notes
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Any additional notes about this transaction"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Link href={initialPortfolioId ? `/portfolio/${initialPortfolioId}` : '/transactions'}>
               <Button type="button" variant="ghost" className="mr-4">Cancel</Button>
            </Link>
            <Button
              type="submit"
              variant="glow"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
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

export default function NewTransactionPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <div className="mb-8">
        <Link
          href="/transactions"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2 transition-colors inline-flex"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Transactions
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">New Transaction</h1>
        <p className="mt-2 text-muted-foreground">
          Record a new buy, sell, or transfer transaction
        </p>
      </div>

      <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>}>
        <TransactionForm />
      </Suspense>
    </div>
  );
}
