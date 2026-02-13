'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Loader2, Edit, Trash2 } from 'lucide-react';
import { usePortfolios } from '@/lib/hooks/use-portfolios';
import { useTransactions, useDeleteTransaction } from '@/lib/hooks/use-transactions';
import { Portfolio, Transaction } from '@/lib/api-client';
import { toast } from 'sonner';

export default function TransactionsPage() {
  const { data: portfolios = [] } = usePortfolios();
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');

  // Use the first portfolio if none selected
  const activePortfolioId = selectedPortfolioId || (portfolios.length > 0 ? portfolios[0].id : '');

  const { data: txData, isLoading, error } = useTransactions(activePortfolioId);
  const deleteTransaction = useDeleteTransaction();

  const transactions: Transaction[] = txData?.data ?? (Array.isArray(txData) ? txData : []);

  const handleDelete = async (transactionId: string) => {
    if (!confirm('Delete this transaction? This will reverse the position changes.')) return;
    try {
      await deleteTransaction.mutateAsync({ portfolioId: activePortfolioId, transactionId });
      toast.success('Transaction deleted');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
         <div className="animate-pulse flex flex-col items-center gap-4">
           <Loader2 className="w-12 h-12 text-primary animate-spin" />
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

      {/* Portfolio Filter */}
      {portfolios.length > 1 && (
        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            {portfolios.map((p: Portfolio) => (
              <Button
                key={p.id}
                variant={activePortfolioId === p.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPortfolioId(p.id)}
              >
                {p.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <Card className="mb-6 border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-destructive">{error.message}</p>
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
                    <th className="px-6 py-3 font-medium">Asset</th>
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 font-medium">Quantity</th>
                    <th className="px-6 py-3 font-medium">Price</th>
                    <th className="px-6 py-3 font-medium">Amount</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map((transaction: Transaction) => (
                    <tr key={transaction.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(transaction.tradeTime || transaction.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">
                          {transaction.assetSymbol || '—'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {transaction.assetName || ''}
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
                        ${(transaction.grossAmount || transaction.price * transaction.quantity).toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(transaction.id)}
                            disabled={deleteTransaction.isPending}
                          >
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