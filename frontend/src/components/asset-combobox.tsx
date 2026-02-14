"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Globe, Loader2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Asset, apiClient } from "@/lib/api-client"
import { useAssets } from "@/lib/hooks/use-assets"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { toast } from "sonner"

interface AssetComboboxProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export function AssetCombobox({ value, onChange, disabled, className }: AssetComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const debouncedSearch = useDebounce(searchQuery, 500)
  const queryClient = useQueryClient()

  // Local assets
  const { data: localAssets = [], isLoading: isLoadingLocal } = useAssets()

  // Global search
  const { data: globalResults = [], isLoading: isLoadingGlobal } = useQuery({
    queryKey: ['assets', 'search', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return []
      const result = await apiClient.searchAssets(debouncedSearch)
      if (result.error) throw new Error(result.error)
      return result.data || []
    },
    enabled: debouncedSearch.length >= 2,
  })

  // Create asset mutation
  const createAsset = useMutation({
    mutationFn: async (assetData: any) => {
      const result = await apiClient.createAsset(assetData)
      if (result.error) throw new Error(result.error)
      return result.data
    },
    onSuccess: (newAsset) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      onChange(newAsset.id)
      setOpen(false)
      toast.success(`Imported ${newAsset.symbol}`)
    },
    onError: (error) => {
      toast.error(`Failed to import asset: ${error.message}`)
    }
  })

  const handleSelect = (asset: Asset) => {
    onChange(asset.id)
    setOpen(false)
  }

  const handleImport = async (globalAsset: any) => {
    // Check if checks already exist locally to avoid duplicates (client-side check)
    const existing = localAssets.find(a => a.coingeckoId === globalAsset.id)
    if (existing) {
      handleSelect(existing)
      return
    }

    // Create new asset
    createAsset.mutate({
      symbol: globalAsset.symbol.toUpperCase(),
      name: globalAsset.name,
      assetType: 'CRYPTO',
      coingeckoId: globalAsset.id,
      isActive: true,
      precision: 8
    })
  }

  const selectedAsset = localAssets.find(asset => asset.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between bg-white/5 border-white/10 hover:bg-white/10 hover:text-foreground", className)}
          disabled={disabled}
        >
          {selectedAsset ? (
            <div className="flex items-center gap-2 truncate">
                <span className="font-bold">{selectedAsset.symbol}</span>
                <span className="text-muted-foreground truncate">{selectedAsset.name}</span>
            </div>
          ) : (
            "Select asset..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-background/95 backdrop-blur-xl border-white/10 left-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search assets..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
                {isLoadingGlobal ? (
                    <div className="flex items-center justify-center p-4 gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Searching CoinGecko...
                    </div>
                ) : (
                    "No assets found."
                )}
            </CommandEmpty>
            
            <CommandGroup heading="My Assets">
              {localAssets
                .filter(asset => 
                    !searchQuery || 
                    asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    asset.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((asset) => (
                <CommandItem
                  key={asset.id}
                  value={asset.symbol + ' ' + asset.name} // Composite value for better fuzzy filtering if needed
                  onSelect={() => handleSelect(asset)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === asset.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                      <span className="font-medium">{asset.symbol}</span>
                      <span className="text-xs text-muted-foreground">{asset.name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            {globalResults.length > 0 && (
                <>
                <CommandSeparator />
                <CommandGroup heading="Global Search (CoinGecko)">
                    {globalResults.map((coin: any) => {
                        // Check if already in my assets
                        const isImported = localAssets.some(a => a.coingeckoId === coin.id)
                        
                        return (
                            <CommandItem
                                key={coin.id}
                                value={'global_' + coin.id}
                                onSelect={() => handleImport(coin)}
                                disabled={isImported || createAsset.isPending}
                            >
                                <div className="mr-2 h-4 w-4 flex items-center justify-center">
                                    {isImported ? (
                                        <Check className="h-4 w-4 opacity-50" />
                                    ) : createAsset.isPending ? (
                                         <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <Globe className="h-3 w-3" />
                                    )}
                                </div>
                                <div className="flex flex-col flex-1 overflow-hidden">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{coin.symbol}</span>
                                        {coin.thumb && <img src={coin.thumb} alt="" className="w-4 h-4 rounded-full" />}
                                    </div>
                                    <span className="text-xs text-muted-foreground truncate">{coin.name}</span>
                                </div>
                                {!isImported && (
                                    <Plus className="h-3 w-3 ml-auto opacity-50" />
                                )}
                            </CommandItem>
                        )
                    })}
                </CommandGroup>
                </>
            )}
            
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
