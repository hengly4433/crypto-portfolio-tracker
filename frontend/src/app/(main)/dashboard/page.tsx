'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowUpRight, ArrowDownRight, TrendingUp, Wallet, LayoutGrid } from 'lucide-react';

interface Portfolio {
  id: string;
  name: string;
  baseCurrency: string;
  totalValue?: number;
  totalUnrealizedPnl?: number;
  totalRealizedPnl?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalValue, setTotalValue] = useState(0);
  const [totalPnl, setTotalPnl] = useState(0);

  useEffect(() => {
    if (!apiClient.isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadPortfolios();
  }, [router]);

  const loadPortfolios = async () => {
    try {
      setIsLoading(true);
      const result = await apiClient.getPortfolios();
      
      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data) {
        setPortfolios(result.data);
        
        // Calculate totals
        const totalVal = result.data.reduce((sum: number, p: any) => 
          sum + (p.totalValue || 0), 0);
        const totalPnlVal = result.data.reduce((sum: number, p: any) => 
          sum + (p.totalUnrealizedPnl || 0) + (p.totalRealizedPnl || 0), 0);
        
        setTotalValue(totalVal);
        setTotalPnl(totalPnlVal);
      }
    } catch (err) {
      setError('Failed to load portfolios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePortfolio = async () => {
    const name = prompt('Enter portfolio name:');
    if (!name) return;

    try {
      const result = await apiClient.createPortfolio(name);
      if (result.error) {
        alert(result.error);
        return;
      }
      loadPortfolios();
    } catch (err) {
      alert('Failed to create portfolio');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center gap-4">
           <div className="w-12 h-12 bg-primary/20 rounded-full animate-bounce" />
           <div className="text-lg text-muted-foreground font-medium">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Overview of your crypto assets and performance.</p>
        </div>
        <Button onClick={handleCreatePortfolio} variant="glow" className="gap-2">
          <Plus className="w-4 h-4" /> New Portfolio
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card variant="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all portfolios</p>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total P&L</CardTitle>
            <TrendingUp className={`h-4 w-4 ${totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalPnl >= 0 ? '+' : ''}{totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
             <p className="text-xs text-muted-foreground mt-1">Realized + Unrealized</p>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Portfolios</CardTitle>
            <LayoutGrid className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {portfolios.length}
            </div>
            <div className="flex gap-2 mt-2">
               <Badge variant="secondary" className="text-xs">
                 Crypto
               </Badge>
               <Badge variant="secondary" className="text-xs">
                 Stocks
               </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolios Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Portfolios</h2>
        </div>

        {portfolios.length === 0 ? (
          <Card variant="glass" className="p-12 text-center border-dashed">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No portfolios yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your first portfolio to start tracking your investments and analyzing your performance.
            </p>
            <Button onClick={handleCreatePortfolio} variant="default">
              Create Portfolio
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios.map((portfolio) => (
              <Card key={portfolio.id} variant="glass-hover" className="group cursor-pointer" onClick={() => router.push(`/portfolio/${portfolio.id}`)}>
                <CardHeader className="pb-3">
                   <div className="flex justify-between items-start">
                     <div>
                       <Badge variant="outline" className="mb-2 uppercase text-[10px] tracking-wider">{portfolio.baseCurrency}</Badge>
                       <CardTitle className="text-xl group-hover:text-primary transition-colors">{portfolio.name}</CardTitle>
                     </div>
                     <div className="p-2 bg-background/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight className="w-4 h-4 text-primary" />
                     </div>
                   </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                     <div>
                        <span className="text-sm text-muted-foreground">Total Value</span>
                        <div className="text-2xl font-bold">
                           ${(portfolio.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                        <div>
                           <span className="text-xs text-muted-foreground block mb-1">Unrealized</span>
                           <Badge variant={(portfolio.totalUnrealizedPnl || 0) >= 0 ? "success" : "destructive"}>
                              {(portfolio.totalUnrealizedPnl || 0) >= 0 ? '+' : ''}${(portfolio.totalUnrealizedPnl || 0).toLocaleString(undefined, { notation: "compact" })}
                           </Badge>
                        </div>
                        <div>
                           <span className="text-xs text-muted-foreground block mb-1">Realized</span>
                           <Badge variant={(portfolio.totalRealizedPnl || 0) >= 0 ? "success" : "destructive"}>
                              {(portfolio.totalRealizedPnl || 0) >= 0 ? '+' : ''}${(portfolio.totalRealizedPnl || 0).toLocaleString(undefined, { notation: "compact" })}
                           </Badge>
                        </div>
                     </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

       {/* Recent Activity Mini-Section */}
      <div className="mt-12">
        <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <Link href="/transactions" className="block group">
              <Card variant="glass" className="hover:border-primary/50 transition-colors">
                 <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                       <Plus className="w-5 h-5" />
                    </div>
                    <div>
                       <div className="font-semibold group-hover:text-primary transition-colors">Add Transaction</div>
                       <div className="text-sm text-muted-foreground">Record a new buy or sell order</div>
                    </div>
                 </CardContent>
              </Card>
           </Link>
           <Link href="/alerts" className="block group">
              <Card variant="glass" className="hover:border-primary/50 transition-colors">
                 <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500">
                       <ArrowUpRight className="w-5 h-5" />
                    </div>
                    <div>
                       <div className="font-semibold group-hover:text-primary transition-colors">Price Alerts</div>
                       <div className="text-sm text-muted-foreground">Manage your notifications</div>
                    </div>
                 </CardContent>
              </Card>
           </Link>
        </div>
      </div>
    </div>
  );
}