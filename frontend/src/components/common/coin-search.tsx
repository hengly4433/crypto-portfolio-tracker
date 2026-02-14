import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Plus, Check } from 'lucide-react';
import { apiClient, Asset, CoinSearchResult } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CoinSearchProps {
  onSelect: (asset: Asset) => void;
  selectedAssetId?: string;
  className?: string;
}

export function CoinSearch({ onSelect, selectedAssetId, className }: CoinSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  const [localAssets, setLocalAssets] = useState<Asset[]>([]);
  const [remoteResults, setRemoteResults] = useState<CoinSearchResult[]>([]);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load local assets on mount
  useEffect(() => {
    loadLocalAssets();
  }, []);

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query);
      } else {
        setRemoteResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const loadLocalAssets = async () => {
    const res = await apiClient.getAssets();
    if (res.data) {
      setLocalAssets(res.data);
    }
  };

  const performSearch = async (q: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.searchAssets(q);
      if (res.data) {
        // Filter out coins that are already in local assets (by coingeckoId)
        const existingIds = new Set(localAssets.map(a => a.coingeckoId));
        setRemoteResults(res.data.filter(coin => !existingIds.has(coin.id)));
      }
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLocal = (asset: Asset) => {
    onSelect(asset);
    setQuery(''); // Reset query or keep it? Maybe keep checking name
    setIsOpen(false);
  };

  const handleSelectRemote = async (coin: CoinSearchResult) => {
    try {
      setIsAdding(true);
      // Create the asset
      const res = await apiClient.createAsset({
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        coingeckoId: coin.id,
        assetType: 'CRYPTO'
      });

      if (res.data) {
        // Add to local assets list
        setLocalAssets(prev => [...prev, res.data!]);
        onSelect(res.data);
        toast.success(`Added ${coin.name} to assets`);
        setIsOpen(false);
        setQuery('');
      } else {
        toast.error('Failed to add asset');
      }
    } catch (error) {
      toast.error('Error adding asset');
    } finally {
      setIsAdding(false);
    }
  };

  // Filter local assets based on query
  const filteredLocalAssets = localAssets.filter(a => 
    a.name.toLowerCase().includes(query.toLowerCase()) || 
    a.symbol.toLowerCase().includes(query.toLowerCase())
  );

  const selectedAsset = localAssets.find(a => a.id === selectedAssetId);

  return (
    <div className={cn("relative w-full z-50", className)} ref={wrapperRef}>
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? query : (selectedAsset ? `${selectedAsset.symbol} – ${selectedAsset.name}` : query)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onClick={() => {
            setIsOpen(true);
            if (selectedAsset) setQuery(''); 
          }}
          placeholder={selectedAsset ? `${selectedAsset.symbol} – ${selectedAsset.name}` : "Search coin (e.g. Bitcoin)..."}
          className="w-full h-10 pl-9 pr-4 rounded-lg text-sm bg-background dark:bg-black/20 border border-input shadow-sm transition-all outline-none placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-4 focus-visible:ring-primary/10"
          disabled={isAdding}
        />
        {isAdding && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          </div>
        )}
      </div>

      {isOpen && (query.length > 0 || filteredLocalAssets.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 p-1 bg-popover border border-border rounded-xl shadow-2xl z-[100] max-h-[320px] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          
          {/* Local Matches */}
          {filteredLocalAssets.length > 0 && (
            <div className="mb-2">
              <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-70">
                My Assets
              </div>
              {filteredLocalAssets.map(asset => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => handleSelectLocal(asset)}
                  className="w-full px-3 py-2.5 flex items-center gap-3 rounded-lg hover:bg-white/5 hover:shadow-sm transition-all text-left group border border-transparent hover:border-white/5"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xs font-bold text-primary group-hover:scale-110 transition-transform">
                    {asset.symbol.substring(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold flex items-center gap-2 truncate">
                      {asset.symbol}
                      {selectedAssetId === asset.id && <Check className="w-3.5 h-3.5 text-primary" />}
                    </div>
                    <div className="text-xs text-muted-foreground truncate opacity-80">{asset.name}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Remote Matches */}
          {remoteResults.length > 0 && (
            <div>
              <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-t border-white/10 mt-1 pt-3 opacity-70">
                Global Search
              </div>
              {remoteResults.map(coin => (
                <button
                  key={coin.id}
                  type="button"
                  onClick={() => handleSelectRemote(coin)}
                  className="w-full px-3 py-2.5 flex items-center gap-3 rounded-lg hover:bg-white/5 hover:shadow-sm transition-all text-left group border border-transparent hover:border-white/5"
                >
                  {coin.thumb ? (
                    <img src={coin.thumb} alt={coin.symbol} className="w-8 h-8 rounded-full group-hover:scale-110 transition-transform" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">?</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold flex items-center gap-2">
                      <span className="truncate">{coin.symbol}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">NEW</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate opacity-80">{coin.name}</div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                    <Plus className="w-3.5 h-3.5 text-primary" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="py-6 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-xs opacity-70">Searching CoinGecko...</span>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && query.length >= 2 && filteredLocalAssets.length === 0 && remoteResults.length === 0 && (
            <div className="py-8 text-center">
               <p className="text-sm text-muted-foreground block">No coins found</p>
               <p className="text-xs text-muted-foreground/50 mt-1">Try searching by full name</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
