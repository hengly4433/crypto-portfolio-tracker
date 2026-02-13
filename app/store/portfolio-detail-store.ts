import { create } from 'zustand';
import { apiClient } from '../lib/api-client';

export interface Position {
  id: string;
  assetId: string;
  assetSymbol: string;
  assetName: string;
  assetType: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnl: number;
  realizedPnl: number;
  pnlPercent: number;
  weight: number;
}

export interface Transaction {
  id: string;
  side: string;
  quantity: number;
  price: number;
  transactionCurrency: string;
  grossAmount: number;
  feeAmount: number;
  feeCurrency?: string;
  tradeTime: string;
  assetSymbol: string;
  assetName: string;
}

export interface PortfolioSummary {
  id: string;
  name: string;
  baseCurrency: string;
  totalValue: number;
  totalUnrealizedPnl: number;
  totalRealizedPnl: number;
  dailyChange: number;
  dailyChangePercent: number;
  positions: Position[];
  allocation: Array<{
    assetType: string;
    value: number;
    percentage: number;
  }>;
  performance: Array<{
    date: string;
    value: number;
    pnl: number;
  }>;
}

interface PortfolioDetailState {
  summary: PortfolioSummary | null;
  positions: Position[];
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchPortfolioSummary: (portfolioId: string) => Promise<void>;
  fetchPortfolioPositions: (portfolioId: string) => Promise<void>;
  fetchPortfolioTransactions: (portfolioId: string) => Promise<void>;
  createTransaction: (
    portfolioId: string,
    transaction: any
  ) => Promise<void>;
  clearData: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePortfolioDetailStore = create<PortfolioDetailState>((set, get) => ({
  summary: null,
  positions: [],
  transactions: [],
  isLoading: false,
  error: null,

  fetchPortfolioSummary: async (portfolioId: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await apiClient.getPortfolioSummary(portfolioId);
      
      if (result.error) {
        set({ error: result.error, isLoading: false });
        throw new Error(result.error);
      }
      
      if (result.data) {
        set({ 
          summary: result.data, 
          isLoading: false,
        });
      }
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch portfolio summary', 
        isLoading: false 
      });
      throw error;
    }
  },

  fetchPortfolioPositions: async (portfolioId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Note: We don't have a direct positions endpoint yet
      // For now, we'll get positions from summary
      const result = await apiClient.getPortfolioSummary(portfolioId);
      
      if (result.error) {
        set({ error: result.error, isLoading: false });
        throw new Error(result.error);
      }
      
      if (result.data) {
        set({ 
          positions: result.data.positions || [], 
          isLoading: false,
        });
      }
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch portfolio positions', 
        isLoading: false 
      });
      throw error;
    }
  },

  fetchPortfolioTransactions: async (portfolioId: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await apiClient.getPortfolioTransactions(portfolioId);
      
      if (result.error) {
        set({ error: result.error, isLoading: false });
        throw new Error(result.error);
      }
      
      if (result.data) {
        set({ 
          transactions: result.data, 
          isLoading: false,
        });
      }
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch portfolio transactions', 
        isLoading: false 
      });
      throw error;
    }
  },

  createTransaction: async (portfolioId: string, transaction: any) => {
    set({ isLoading: true, error: null });
    try {
      const result = await apiClient.createTransaction(portfolioId, transaction);
      
      if (result.error) {
        set({ error: result.error, isLoading: false });
        throw new Error(result.error);
      }
      
      // Refresh data after creating transaction
      await get().fetchPortfolioSummary(portfolioId);
      await get().fetchPortfolioTransactions(portfolioId);
      
      set({ isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to create transaction', 
        isLoading: false 
      });
      throw error;
    }
  },

  clearData: () => {
    set({ 
      summary: null, 
      positions: [], 
      transactions: [], 
      error: null 
    });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));