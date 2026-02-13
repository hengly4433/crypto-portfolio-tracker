'use client';

import { useState, useEffect } from 'react';
import { apiClient, Exchange, UserAccount } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Building2, Wallet, Link2, Settings2 } from 'lucide-react';

const exchangeTypeIcons: Record<string, typeof Building2> = {
  CEX: Building2,
  DEX: Link2,
  WALLET: Wallet,
  BROKER: Settings2,
};

export default function ExchangesPage() {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExchanges = async () => {
      const result = await apiClient.getExchanges();
      if (result.data) {
        setExchanges(result.data);
      }
      setLoading(false);
    };
    fetchExchanges();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exchanges</h1>
          <p className="text-muted-foreground mt-1">Manage your exchange connections</p>
        </div>
        <Button className="gap-2" onClick={() => toast.info('Connect exchange feature coming soon')}>
          <Plus className="h-4 w-4" />
          Connect Exchange
        </Button>
      </div>

      {exchanges.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-indigo-500" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">No exchanges connected</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Connect your first exchange to sync your portfolio data automatically.
              </p>
            </div>
            <Button className="gap-2" onClick={() => toast.info('Connect exchange feature coming soon')}>
              <Plus className="h-4 w-4" />
              Connect Your First Exchange
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exchanges.map((exchange) => {
            const Icon = exchangeTypeIcons[exchange.type] || Building2;

            return (
              <Card key={exchange.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{exchange.name}</CardTitle>
                      <CardDescription className="text-xs">{exchange.code}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={exchange.isActive ? 'default' : 'secondary'}>
                    {exchange.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <Badge variant="outline">{exchange.type}</Badge>
                  </div>
                  {exchange.websiteUrl && (
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-muted-foreground">Website</span>
                      <a
                        href={exchange.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-500 hover:underline truncate max-w-[200px]"
                      >
                        {exchange.websiteUrl.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      Manage
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => toast.info('Remove exchange feature coming soon')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
