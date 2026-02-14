'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowUpRight, TrendingUp, Wallet, LayoutGrid, Loader2, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { usePortfolios, useCreatePortfolio, useDeletePortfolio } from '@/lib/hooks/use-portfolios';
import { Portfolio } from '@/lib/api-client';
import { toast } from 'sonner';

export default function DashboardPage() {
  const router = useRouter();
  const { data: portfolios = [], isLoading, error } = usePortfolios();
  const createPortfolio = useCreatePortfolio();
  const deletePortfolio = useDeletePortfolio();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');

  const totalValue = portfolios.reduce((sum: number, p: Portfolio) =>
    sum + (p.totalValue || 0), 0);
  const totalPnl = portfolios.reduce((sum: number, p: Portfolio) =>
    sum + (p.totalUnrealizedPnl || 0) + (p.totalRealizedPnl || 0), 0);

  const handleCreatePortfolio = async () => {
    if (!newPortfolioName.trim()) return;
    try {
      await createPortfolio.mutateAsync({ name: newPortfolioName });
      setNewPortfolioName('');
      setIsCreateOpen(false);
      toast.success('Portfolio created successfully');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create portfolio');
    }
  };

  const handleDeletePortfolio = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent card click navigation
    if (!confirm('Are you sure you want to delete this portfolio? This action cannot be undone.')) {
      return;
    }
    try {
      await deletePortfolio.mutateAsync(id);
      toast.success('Portfolio deleted');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete portfolio');
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
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="glow" className="gap-2">
              <Plus className="w-4 h-4" /> New Portfolio
            </Button>
          </DialogTrigger>
          <DialogContent variant="glass" className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Portfolio</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <input
                  placeholder="Portfolio Name"
                  value={newPortfolioName}
                  onChange={(e) => setNewPortfolioName(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreatePortfolio();
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button variant="glow" onClick={handleCreatePortfolio} disabled={createPortfolio.isPending}>
                {createPortfolio.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating...</>
                ) : 'Create Portfolio'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="mb-6 p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
          {error.message}
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
            <div className="text-3xl font-bold text-foreground">
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
            <Button onClick={() => setIsCreateOpen(true)} variant="default">
              Create Portfolio
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios.map((portfolio: Portfolio) => (
              <Card key={portfolio.id} variant="glass-hover" className="group cursor-pointer relative" onClick={() => router.push(`/portfolio/${portfolio.id}`)}>
                <CardHeader className="pb-3">
                   <div className="flex justify-between items-start">
                     <div>
                       <Badge variant="outline" className="mb-2 uppercase text-[10px] tracking-wider">{portfolio.baseCurrency}</Badge>
                       <CardTitle className="text-xl group-hover:text-primary transition-colors">{portfolio.name}</CardTitle>
                     </div>
                     <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 z-10"
                          onClick={(e) => handleDeletePortfolio(e, portfolio.id)}
                          title="Delete Portfolio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <div className="p-2 bg-background/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                           <ArrowUpRight className="w-4 h-4 text-primary" />
                        </div>
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