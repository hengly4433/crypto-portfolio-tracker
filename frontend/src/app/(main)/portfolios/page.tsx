'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Wallet, TrendingUp, ArrowRight, Loader2 } from 'lucide-react';

interface Portfolio {
  id: string;
  name: string;
  baseCurrency: string;
  description?: string;
  totalValue?: number;
  totalUnrealizedPnl?: number;
  totalRealizedPnl?: number;
  createdAt: string;
  updatedAt: string;
}

export default function PortfoliosPage() {
  const router = useRouter();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      }
    } catch (err) {
      setError('Failed to load portfolios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePortfolio = async () => {
    const name = prompt('Enter portfolio name:');
    const baseCurrency = prompt('Enter base currency (e.g., USD, USDT, KHR):', 'USD');
    
    if (!name || !baseCurrency) return;

    try {
      const result = await apiClient.createPortfolio(name, baseCurrency);
      if (result.error) {
        alert(result.error);
        return;
      }
      loadPortfolios();
    } catch (err) {
      alert('Failed to create portfolio');
    }
  };

  const handleDeletePortfolio = async (portfolioId: string, portfolioName: string) => {
    if (!confirm(`Are you sure you want to delete "${portfolioName}"? This action cannot be undone.`)) {
      return;
    }
    
    // In a real app, you would call apiClient.deletePortfolio(portfolioId)
    // alert(`Portfolio "${portfolioName}" deletion would be implemented here`);
     // Mock deletion for now or call API if available
    loadPortfolios();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center gap-4">
           <div className="w-12 h-12 bg-primary/20 rounded-full animate-bounce" />
           <div className="text-lg text-muted-foreground font-medium">Loading Portfolios...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolios</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your investment portfolios
          </p>
        </div>
        <Button onClick={handleCreatePortfolio} variant="glow" className="gap-2">
          <Plus className="w-4 h-4" /> Create Portfolio
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {portfolios.length === 0 ? (
        <Card variant="glass" className="text-center py-12">
           <CardContent className="flex flex-col items-center">
              <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-6">
                <Wallet className="w-10 h-10 text-muted-foreground opacity-50" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Portfolios Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Create your first portfolio to start tracking your cryptocurrency, forex, and gold investments.
              </p>
              <Button onClick={handleCreatePortfolio} variant="default">
                Create Your First Portfolio
              </Button>
           </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map((portfolio) => (
            <Card key={portfolio.id} variant="glass-hover" className="group">
              <CardHeader className="pb-3">
                 <div className="flex items-start justify-between">
                    <div>
                       <Link href={`/portfolio/${portfolio.id}`}>
                          <CardTitle className="text-xl hover:text-primary transition-colors cursor-pointer flex items-center gap-2">
                             {portfolio.name}
                             <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                          </CardTitle>
                       </Link>
                       <CardDescription className="mt-1">
                          Base Currency: {portfolio.baseCurrency}
                       </CardDescription>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mt-1 -mr-2"
                        onClick={() => handleDeletePortfolio(portfolio.id, portfolio.name)}
                    >
                       <Trash2 className="w-4 h-4" />
                    </Button>
                 </div>
                 {portfolio.description && (
                   <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                     {portfolio.description}
                   </p>
                 )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-sm text-muted-foreground">Total Value</span>
                    <span className="text-2xl font-bold">
                      ${(portfolio.totalValue || 0).toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                     <div>
                        <span className="text-xs text-muted-foreground block mb-1">Unrealized P&L</span>
                        <span className={`text-sm font-medium flex items-center gap-1 ${(portfolio.totalUnrealizedPnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                           <TrendingUp className="w-3 h-3" />
                           {(portfolio.totalUnrealizedPnl || 0) >= 0 ? '+' : ''}
                           ${(portfolio.totalUnrealizedPnl || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                     </div>
                     <div className="text-right">
                        <span className="text-xs text-muted-foreground block mb-1">Realized P&L</span>
                        <span className={`text-sm font-medium ${(portfolio.totalRealizedPnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                           {(portfolio.totalRealizedPnl || 0) >= 0 ? '+' : ''}
                           ${(portfolio.totalRealizedPnl || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                     </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tips Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card variant="glass" className="bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
            <CardContent className="p-6">
               <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Wallet className="w-5 h-5 text-blue-500" />
               </div>
               <h3 className="font-semibold mb-2">Diversify Holdings</h3>
               <p className="text-sm text-muted-foreground">
                  Create separate portfolios for different asset classes: crypto, forex, and gold for better risk management.
               </p>
            </CardContent>
         </Card>
         <Card variant="glass" className="bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
            <CardContent className="p-6">
               <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-5 h-5 text-green-500" />
               </div>
               <h3 className="font-semibold mb-2">Regular Monitoring</h3>
               <p className="text-sm text-muted-foreground">
                  Check your portfolios regularly and set up alerts to stay informed about significant price movements.
               </p>
            </CardContent>
         </Card>
         <Card variant="glass" className="bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20">
            <CardContent className="p-6">
               <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Loader2 className="w-5 h-5 text-purple-500" />
               </div>
               <h3 className="font-semibold mb-2">Performance Analysis</h3>
               <p className="text-sm text-muted-foreground">
                  Use the analytics dashboard to compare portfolio performance and make data-driven investment decisions.
               </p>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}