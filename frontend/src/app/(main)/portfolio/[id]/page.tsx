'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Trash2, Wallet, TrendingUp, PieChart, History, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface Portfolio {
  id: string;
  name: string;
  baseCurrency: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface Position {
  id: string;
  assetId: string;
  assetSymbol: string;
  assetName: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  realizedPnl: number;
  pnlPercentage: number;
}

interface Transaction {
  id: string;
  side: string;
  quantity: number;
  price: number;
  transactionCurrency: string;
  grossAmount: number;
  feeAmount: number;
  tradeTime: string;
  assetSymbol: string;
  assetName: string;
}

export default function PortfolioDetailPage() {
  const router = useRouter();
  const params = useParams();
  const portfolioId = params.id as string;

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiClient.isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadPortfolioData();
  }, [portfolioId, router]);

  const loadPortfolioData = async () => {
    try {
      setIsLoading(true);
      
      // Load portfolio info
      const portfolioResult = await apiClient.getPortfolio(portfolioId);
      if (portfolioResult.error) {
        setError(portfolioResult.error);
        return;
      }
      setPortfolio(portfolioResult.data);

      // Load summary
      const summaryResult = await apiClient.getPortfolioSummary(portfolioId);
      if (!summaryResult.error && summaryResult.data) {
        setSummary(summaryResult.data);
      }

      // Load positions (we'll simulate for now since we don't have a positions endpoint)
      await loadSimulatedPositions();

      // Load transactions
      const transactionsResult = await apiClient.getPortfolioTransactions(portfolioId);
      if (!transactionsResult.error && transactionsResult.data) {
        setTransactions(transactionsResult.data);
      }

    } catch (err) {
      setError('Failed to load portfolio data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSimulatedPositions = async () => {
    // Simulated positions data - in a real app, you'd fetch from an API
    const simulatedPositions: Position[] = [
      {
        id: '1',
        assetId: '1',
        assetSymbol: 'BTC',
        assetName: 'Bitcoin',
        quantity: 0.5,
        avgPrice: 45000,
        currentPrice: 52000,
        marketValue: 26000,
        unrealizedPnl: 3500,
        realizedPnl: 1000,
        pnlPercentage: 15.56,
      },
      {
        id: '2',
        assetId: '2',
        assetSymbol: 'ETH',
        assetName: 'Ethereum',
        quantity: 3.2,
        avgPrice: 3200,
        currentPrice: 3500,
        marketValue: 11200,
        unrealizedPnl: 960,
        realizedPnl: 450,
        pnlPercentage: 9.38,
      },
      {
        id: '3',
        assetId: '3',
        assetSymbol: 'SOL',
        assetName: 'Solana',
        quantity: 25,
        avgPrice: 120,
        currentPrice: 140,
        marketValue: 3500,
        unrealizedPnl: 500,
        realizedPnl: 200,
        pnlPercentage: 16.67,
      },
    ];
    setPositions(simulatedPositions);
  };

  const handleAddTransaction = () => {
    router.push(`/transactions/new?portfolioId=${portfolioId}`);
  };

  const handleDeletePortfolio = async () => {
    if (!confirm('Are you sure you want to delete this portfolio? This action cannot be undone.')) {
      return;
    }
    
    // In a real app, you would call apiClient.deletePortfolio(portfolioId)
    alert('Portfolio deletion would be implemented here');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center gap-4">
           <div className="w-12 h-12 bg-primary/20 rounded-full animate-bounce" />
           <div className="text-lg text-muted-foreground font-medium">Loading Portfolio...</div>
        </div>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6 text-center">
            <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Portfolio</h3>
            <p className="text-muted-foreground mb-4">{error || 'Portfolio not found'}</p>
            <Link href="/dashboard">
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
  const totalUnrealizedPnl = positions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0);
  const totalRealizedPnl = positions.reduce((sum, pos) => sum + pos.realizedPnl, 0);

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
          <p className="mt-1 text-muted-foreground">
            {portfolio.description}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={handleAddTransaction} variant="glow" className="gap-2">
            <Plus className="w-4 h-4" /> Add Transaction
          </Button>
          <Button onClick={handleDeletePortfolio} variant="destructive" size="icon" title="Delete Portfolio">
            <Trash2 className="w-4 h-4" />
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
            <PieChart className="h-4 w-4 text-primary" />
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
            <Card variant="glass">
             <CardHeader>
               <CardTitle>Top Holdings</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="space-y-4">
                  {positions.slice(0, 5).map((position) => (
                    <div key={position.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                           {position.assetSymbol.slice(0,1)}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {position.assetName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {position.quantity} {position.assetSymbol}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          ${position.marketValue.toLocaleString(undefined, { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </div>
                        <div className={`text-sm font-medium ${position.pnlPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {position.pnlPercentage >= 0 ? '+' : ''}{position.pnlPercentage.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                  {positions.length === 0 && <p className="text-muted-foreground text-center py-4">No positions yet</p>}
                </div>
             </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle>Allocation</CardTitle>
                <CardDescription>Asset distribution by value</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="flex items-center justify-center py-8">
                     <div className="text-center text-muted-foreground">
                        <PieChart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>Visual allocation chart coming soon</p>
                     </div>
                  </div>
                  <div className="space-y-2 mt-4">
                     {positions.map((position) => {
                       const percentage = totalValue > 0 ? (position.marketValue / totalValue) * 100 : 0;
                       return (
                         <div key={position.id} className="flex items-center justify-between text-sm">
                           <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                              <span>{position.assetSymbol}</span>
                           </div>
                           <span className="text-muted-foreground">{percentage.toFixed(1)}%</span>
                         </div>
                       );
                     })}
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
                   ) : positions.map((position) => (
                     <tr key={position.id} className="hover:bg-white/5 transition-colors">
                       <td className="px-6 py-4">
                         <div className="font-medium text-foreground">{position.assetSymbol}</div>
                         <div className="text-xs text-muted-foreground">{position.assetName}</div>
                       </td>
                       <td className="px-6 py-4">{position.quantity}</td>
                       <td className="px-6 py-4 text-muted-foreground">${position.avgPrice.toLocaleString()}</td>
                       <td className="px-6 py-4">${position.currentPrice.toLocaleString()}</td>
                       <td className="px-6 py-4 font-medium">${position.marketValue.toLocaleString()}</td>
                       <td className="px-6 py-4">
                          <span className={position.unrealizedPnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                             ${position.unrealizedPnl.toLocaleString()}
                          </span>
                       </td>
                       <td className="px-6 py-4">
                          <Badge variant={position.pnlPercentage >= 0 ? 'success' : 'destructive'}>
                             {position.pnlPercentage.toFixed(2)}%
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
                   ) : transactions.map((tx) => (
                     <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                       <td className="px-6 py-4 text-muted-foreground">{new Date(tx.tradeTime).toLocaleDateString()}</td>
                       <td className="px-6 py-4">
                          <Badge variant={tx.side === 'BUY' ? 'success' : tx.side === 'SELL' ? 'destructive' : 'secondary'}>
                             {tx.side}
                          </Badge>
                       </td>
                       <td className="px-6 py-4 font-medium">{tx.assetSymbol}</td>
                       <td className="px-6 py-4">{tx.quantity}</td>
                       <td className="px-6 py-4 text-muted-foreground">${tx.price.toLocaleString()}</td>
                       <td className="px-6 py-4 font-medium">${tx.grossAmount.toLocaleString()}</td>
                       <td className="px-6 py-4 text-xs text-muted-foreground">${tx.feeAmount}</td>
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