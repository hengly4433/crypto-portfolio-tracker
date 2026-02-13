'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Coins, Banknote, Landmark, Globe, Loader2, ArrowRight } from 'lucide-react';

interface Asset {
  id: string;
  symbol: string;
  name: string;
  assetType: string;
  baseCurrency?: string;
  quoteCurrency?: string;
  coingeckoId?: string;
  precision: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AssetsPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);

  useEffect(() => {
    if (!apiClient.isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadAssets();
  }, [router]);

  const loadAssets = async () => {
    try {
      setIsLoading(true);
      const result = await apiClient.getAssets();
      
      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data) {
        setAssets(result.data);
      }
    } catch (err) {
      setError('Failed to load assets');
    } finally {
      setIsLoading(false);
    }
  };

  const getAssetTypeLabel = (type: string) => {
    switch (type) {
      case 'CRYPTO': return 'Cryptocurrency';
      case 'FOREX': return 'Forex';
      case 'COMMODITY': return 'Commodity';
      case 'FIAT': return 'Fiat';
      default: return type;
    }
  };

  const filteredAssets = assets.filter(asset =>
    (filterType ? asset.assetType === filterType : true) &&
    (asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center gap-4">
           <div className="w-12 h-12 bg-primary/20 rounded-full animate-bounce" />
           <div className="text-lg text-muted-foreground font-medium">Loading Assets...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
        <p className="mt-2 text-muted-foreground">
          Browse and manage available cryptocurrencies, forex pairs, and commodities
        </p>
      </div>

      {error && (
        <Card className="mb-6 border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <input
               type="text"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full md:w-96 pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/50"
               placeholder="Search by symbol or name..."
             />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
                variant={filterType === null ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setFilterType(null)}
            >
              All
            </Button>
            <Button 
                variant={filterType === 'CRYPTO' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setFilterType('CRYPTO')}
            >
              Crypto
            </Button>
            <Button 
                variant={filterType === 'FOREX' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setFilterType('FOREX')}
            >
              Forex
            </Button>
            <Button 
                variant={filterType === 'COMMODITY' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setFilterType('COMMODITY')} // Mocking 'COMMODITY' type
            >
              Commodity
            </Button>
          </div>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssets.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
               <Search className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            <p className="text-muted-foreground">
              No assets found. {searchTerm && 'Try a different search term.'}
            </p>
            {searchTerm && (
                <Button variant="link" onClick={() => setSearchTerm('')} className="mt-2">
                    Clear Search
                </Button>
            )}
          </div>
        ) : (
          filteredAssets.map((asset) => (
            <Card key={asset.id} variant="glass-hover" className="group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold
                        ${asset.assetType === 'CRYPTO' ? 'bg-purple-500/20 text-purple-500' : 
                          asset.assetType === 'FOREX' ? 'bg-blue-500/20 text-blue-500' :
                          asset.assetType === 'COMMODITY' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-green-500/20 text-green-500'}
                     `}>
                        {asset.symbol.substring(0, 1)}
                     </div>
                     <div>
                        <h3 className="font-bold text-lg leading-none">{asset.symbol}</h3>
                        <p className="text-sm text-muted-foreground">{asset.name}</p>
                     </div>
                  </div>
                  <Badge variant={asset.isActive ? 'success' : 'secondary'}>
                     {asset.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium">{getAssetTypeLabel(asset.assetType)}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Market Pair</span>
                    <span className="font-medium">
                      {asset.baseCurrency && asset.quoteCurrency ? (
                        `${asset.baseCurrency}/${asset.quoteCurrency}`
                      ) : (
                        'N/A'
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Added</span>
                    <span>
                      {new Date(asset.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Button size="sm" variant="ghost" className="flex-1">Details</Button>
                   <Button size="sm" variant="outline" className="flex-1 gap-1">
                      Trade <ArrowRight className="w-3 h-3" />
                   </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Asset Types Summary Cards */}
      <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="glass" className="bg-gradient-to-br from-purple-500/10 to-transparent">
             <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mb-3">
                   <Coins className="w-5 h-5 text-purple-500" />
                </div>
                <h3 className="font-medium">Crypto</h3>
                <p className="text-xs text-muted-foreground mt-1">Bitcoin, Ethereum, +50 more</p>
             </CardContent>
          </Card>
          <Card variant="glass" className="bg-gradient-to-br from-blue-500/10 to-transparent">
             <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mb-3">
                   <Banknote className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="font-medium">Forex</h3>
                <p className="text-xs text-muted-foreground mt-1">Major & Minor Pairs</p>
             </CardContent>
          </Card>
          <Card variant="glass" className="bg-gradient-to-br from-yellow-500/10 to-transparent">
             <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center mb-3">
                   <Landmark className="w-5 h-5 text-yellow-500" />
                </div>
                <h3 className="font-medium">Commodities</h3>
                <p className="text-xs text-muted-foreground mt-1">Gold, Silver, Oil</p>
             </CardContent>
          </Card>
          <Card variant="glass" className="bg-gradient-to-br from-green-500/10 to-transparent">
             <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
                   <Globe className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="font-medium">Fiat</h3>
                <p className="text-xs text-muted-foreground mt-1">USD, EUR, KHR</p>
             </CardContent>
          </Card>
      </div>
    </div>
  );
}