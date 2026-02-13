'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Loader2, Edit, Trash2 } from 'lucide-react';

interface Transaction {
  id: string;
  portfolioId: string;
  portfolioName: string;
  assetId: string;
  assetSymbol: string;
  assetName: string;
  side: string;
  quantity: number;
  price: number;
  transactionCurrency: string;
  grossAmount: number;
  feeAmount: number;
  tradeTime: string;
  note?: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      
      // Load transactions from all portfolios
      await loadAllTransactions();

    } catch (err) {
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllTransactions = async () => {
    // In a real app, you would have an endpoint to get all transactions across portfolios
    // For now, we'll simulate with empty array or fetch properly if endpoint exists
    // setTransactions([]); 
    // Mocking some data for visual verification if API returns empty
     setTransactions([]);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
         <div className="animate-pulse flex flex-col items-center gap-4">
           <div className="w-12 h-12 bg-primary/20 rounded-full animate-bounce" />
           <div className="text-lg text-muted-foreground font-medium">Loading Transactions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your buy, sell, and transfer transactions
          </p>
        </div>
        <Link href="/transactions/new">
          <Button variant="glow" className="gap-2">
            <Plus className="w-4 h-4" /> Add Transaction
          </Button>
        </Link>
      </div>

      {error && (
        <Card className="mb-6 border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card variant="glass">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transaction History</CardTitle>
          <div className="flex gap-2">
             <Button variant="ghost" size="icon">
                <Search className="w-4 h-4" />
             </Button>
             <Button variant="ghost" size="icon">
                <Filter className="w-4 h-4" />
             </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                 <Search className="w-8 h-8 text-muted-foreground opacity-50" />
              </div>
              <p className="text-muted-foreground mb-4">
                No transactions found. Start by adding your first transaction.
              </p>
              <Link href="/transactions/new">
                <Button variant="outline">
                  + Add First Transaction
                </Button>
              </Link>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-muted-foreground">
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Portfolio</th>
                    <th className="px-6 py-3 font-medium">Asset</th>
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 font-medium">Quantity</th>
                    <th className="px-6 py-3 font-medium">Price</th>
                    <th className="px-6 py-3 font-medium">Amount</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(transaction.tradeTime).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/portfolio/${transaction.portfolioId}`}
                          className="hover:text-primary transition-colors hover:underline"
                        >
                          {transaction.portfolioName}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">
                          {transaction.assetSymbol}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {transaction.assetName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <Badge variant={transaction.side === 'BUY' ? 'success' : transaction.side === 'SELL' ? 'destructive' : 'secondary'}>
                           {transaction.side}
                         </Badge>
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {transaction.quantity.toLocaleString(undefined, { 
                          minimumFractionDigits: 4, 
                          maximumFractionDigits: 8 
                        })}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        ${transaction.price.toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        ${transaction.grossAmount.toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}