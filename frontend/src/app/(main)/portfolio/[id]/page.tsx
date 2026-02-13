'use client';

import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Trash2, Wallet, TrendingUp, PieChart as PieChartIcon, Activity, Loader2, LineChart } from 'lucide-react';
import { usePortfolio, usePortfolioSummary, usePortfolioPerformance, useDeletePortfolio } from '@/lib/hooks/use-portfolios';
import { useTransactions } from '@/lib/hooks/use-transactions';
import { AllocationChart } from '@/components/charts/allocation-chart';
import { PerformanceChart } from '@/components/charts/performance-chart';
import { toast } from 'sonner';
import { PositionSummary, AllocationSlice } from '@/lib/api-client';

export default function PortfolioDetailPage() {
  const router = useRouter();
  const params = useParams();
  const portfolioId = params.id as string;

  const { data: portfolio, isLoading: loadingPortfolio, error: portfolioError } = usePortfolio(portfolioId);
  const { data: summary, isLoading: loadingSummary } = usePortfolioSummary(portfolioId);
  const { data: performance } = usePortfolioPerformance(portfolioId, 30);
  const { data: txData } = useTransactions(portfolioId);
  const deletePortfolio = useDeletePortfolio();

  const positions: PositionSummary[] = summary?.positions ?? [];
  const allocation: AllocationSlice[] = summary?.allocation ?? [];
  const transactions = txData?.data ?? (Array.isArray(txData) ? txData : []);

  const totalValue = summary?.totalValue ?? 0;
  const totalUnrealizedPnl = summary?.totalUnrealizedPnl ?? positions.reduce((sum: number, pos: PositionSummary) => sum + (pos.unrealizedPnl ?? 0), 0);
  const totalRealizedPnl = summary?.totalRealizedPnl ?? positions.reduce((sum: number, pos: PositionSummary) => sum + (pos.realizedPnl ?? 0), 0);

  const handleAddTransaction = () => {
    router.push(`/transactions/new?portfolioId=${portfolioId}`);
  };

  const handleDeletePortfolio = async () => {
    if (!confirm('Are you sure you want to delete this portfolio? This action cannot be undone.')) {
      return;
    }
    try {
      await deletePortfolio.mutateAsync(portfolioId);
      toast.success('Portfolio deleted');
      router.push('/dashboard');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete portfolio');
    }
  };

  if (loadingPortfolio || loadingSummary) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center gap-4">
           <Loader2 className="w-12 h-12 text-primary animate-spin" />
           <div className="text-lg text-muted-foreground font-medium">Loading Portfolio...</div>
        </div>
      </div>
    );
  }

  if (portfolioError || !portfolio) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6 text-center">
            <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Portfolio</h3>
            <p className="text-muted-foreground mb-4">{portfolioError?.message || 'Portfolio not found'}</p>
            <Link href="/dashboard">
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
             <h1 className="text-3xl font-bold tracking-tight">{portfolio.name}</h1>
             <Badge variant="outline" className="uppercase font-mono tracking-wider">
               {portfolio.baseCurrency}
             </Badge>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button onClick={handleAddTransaction} variant="glow" className="gap-2">
            <Plus className="w-4 h-4" /> Add Transaction
          </Button>
          <Button onClick={handleDeletePortfolio} variant="destructive" size="icon" title="Delete Portfolio" disabled={deletePortfolio.isPending}>
            {deletePortfolio.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unrealized P&L</CardTitle>
            <TrendingUp className={`h-4 w-4 ${totalUnrealizedPnl >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalUnrealizedPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalUnrealizedPnl >= 0 ? '+' : ''}{totalUnrealizedPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Realized P&L</CardTitle>
            <Activity className={`h-4 w-4 ${totalRealizedPnl >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalRealizedPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalRealizedPnl >= 0 ? '+' : ''}{totalRealizedPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assets</CardTitle>
            <PieChartIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {positions.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4 w-full justify-start rounded-xl p-1 bg-muted/50" variant="glass">
          <TabsTrigger value="overview" variant="glass" className="flex-1 md:flex-none">Overview</TabsTrigger>
          <TabsTrigger value="positions" variant="glass" className="flex-1 md:flex-none">Positions ({positions.length})</TabsTrigger>
          <TabsTrigger value="transactions" variant="glass" className="flex-1 md:flex-none">Transactions ({transactions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Chart */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-primary" />
                  Performance (30D)
                </CardTitle>
                <CardDescription>Portfolio value over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceChart
                  data={performance ?? []}
                  baseCurrency={portfolio.baseCurrency}
                />
              </CardContent>
            </Card>

            {/* Allocation Chart */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-primary" />
                  Allocation
                </CardTitle>
                <CardDescription>Asset distribution by value</CardDescription>
              </CardHeader>
              <CardContent>
                <AllocationChart data={allocation} />
                {allocation.length === 0 && positions.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {positions.map((position: PositionSummary) => {
                      const percentage = totalValue > 0 ? ((position.marketValue ?? 0) / totalValue) * 100 : 0;
                      return (
                        <div key={position.assetSymbol} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-primary" />
                             <span>{position.assetSymbol}</span>
                          </div>
                          <span className="text-muted-foreground">{percentage.toFixed(1)}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Holdings */}
            <Card variant="glass" className="lg:col-span-2">
             <CardHeader>
               <CardTitle>Top Holdings</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="space-y-4">
                  {positions.slice(0, 5).map((position: PositionSummary) => (
                    <div key={position.assetSymbol} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                           {position.assetSymbol.slice(0,1)}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {position.assetName || position.assetSymbol}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {position.quantity} {position.assetSymbol}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          ${(position.marketValue ?? 0).toLocaleString(undefined, { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </div>
                        <div className={`text-sm font-medium ${(position.pnlPercentage ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {(position.pnlPercentage ?? 0) >= 0 ? '+' : ''}{(position.pnlPercentage ?? 0).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                  {positions.length === 0 && <p className="text-muted-foreground text-center py-4">No positions yet</p>}
                </div>
             </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="positions">
          <Card variant="glass" className="overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full text-sm">
                 <thead>
                   <tr className="border-b border-white/10 text-left text-muted-foreground">
                     <th className="px-6 py-3 font-medium">Asset</th>
                     <th className="px-6 py-3 font-medium">Quantity</th>
                     <th className="px-6 py-3 font-medium">Avg Price</th>
                     <th className="px-6 py-3 font-medium">Current Price</th>
                     <th className="px-6 py-3 font-medium">Value</th>
                     <th className="px-6 py-3 font-medium">Unrealized P&L</th>
                     <th className="px-6 py-3 font-medium">P&L %</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {positions.length === 0 ? (
                      <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">No positions found</td></tr>
                   ) : positions.map((position: PositionSummary) => (
                     <tr key={position.assetSymbol} className="hover:bg-white/5 transition-colors">
                       <td className="px-6 py-4">
                         <div className="font-medium text-foreground">{position.assetSymbol}</div>
                         <div className="text-xs text-muted-foreground">{position.assetName || position.assetSymbol}</div>
                       </td>
                       <td className="px-6 py-4">{position.quantity}</td>
                       <td className="px-6 py-4 text-muted-foreground">${(position.avgPrice ?? 0).toLocaleString()}</td>
                       <td className="px-6 py-4">${(position.currentPrice ?? 0).toLocaleString()}</td>
                       <td className="px-6 py-4 font-medium">${(position.marketValue ?? 0).toLocaleString()}</td>
                       <td className="px-6 py-4">
                          <span className={(position.unrealizedPnl ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}>
                             ${(position.unrealizedPnl ?? 0).toLocaleString()}
                          </span>
                       </td>
                       <td className="px-6 py-4">
                          <Badge variant={(position.pnlPercentage ?? 0) >= 0 ? 'success' : 'destructive'}>
                             {(position.pnlPercentage ?? 0).toFixed(2)}%
                          </Badge>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
           <Card variant="glass" className="overflow-hidden">
             <div className="p-4 flex justify-end">
                <Button onClick={handleAddTransaction} size="sm" variant="outline">
                   <Plus className="w-4 h-4 mr-2" /> New Transaction
                </Button>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-sm">
                 <thead>
                   <tr className="border-b border-white/10 text-left text-muted-foreground">
                     <th className="px-6 py-3 font-medium">Date</th>
                     <th className="px-6 py-3 font-medium">Type</th>
                     <th className="px-6 py-3 font-medium">Asset</th>
                     <th className="px-6 py-3 font-medium">Quantity</th>
                     <th className="px-6 py-3 font-medium">Price</th>
                     <th className="px-6 py-3 font-medium">Total</th>
                     <th className="px-6 py-3 font-medium">Fee</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {transactions.length === 0 ? (
                      <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">No transactions recorded yet</td></tr>
                   ) : transactions.map((tx: any) => (
                     <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                       <td className="px-6 py-4 text-muted-foreground">{new Date(tx.tradeTime || tx.createdAt).toLocaleDateString()}</td>
                       <td className="px-6 py-4">
                          <Badge variant={tx.side === 'BUY' ? 'success' : tx.side === 'SELL' ? 'destructive' : 'secondary'}>
                             {tx.side}
                          </Badge>
                       </td>
                       <td className="px-6 py-4 font-medium">{tx.assetSymbol || tx.asset?.symbol || '—'}</td>
                       <td className="px-6 py-4">{tx.quantity}</td>
                       <td className="px-6 py-4 text-muted-foreground">${(tx.price || 0).toLocaleString()}</td>
                       <td className="px-6 py-4 font-medium">${(tx.grossAmount || tx.price * tx.quantity || 0).toLocaleString()}</td>
                       <td className="px-6 py-4 text-xs text-muted-foreground">${tx.feeAmount || 0}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}