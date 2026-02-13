import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, Portfolio } from '../lib/api-client';

interface PortfolioState {
  portfolios: Portfolio[];
  currentPortfolio: Portfolio | null;
  isLoading: boolean;
  error: string | null;
  totalValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  
  // Actions
  fetchPortfolios: () => Promise<void>;
  fetchPortfolioById: (id: string) => Promise<void>;
  createPortfolio: (name: string, baseCurrency?: string) => Promise<void>;
  deletePortfolio: (id: string) => Promise<void>;
  setCurrentPortfolio: (portfolio: Portfolio | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  calculateTotals: () => void;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      portfolios: [],
      currentPortfolio: null,
      isLoading: false,
      error: null,
      totalValue: 0,
      totalPnl: 0,
      totalPnlPercent: 0,

      fetchPortfolios: async () => {
        set({ isLoading: true, error: null });
        try {
          const result = await apiClient.getPortfolios();
          
          if (result.error) {
            set({ error: result.error, isLoading: false });
            throw new Error(result.error);
          }
          
          if (result.data) {
            set({ 
              portfolios: result.data, 
              isLoading: false,
            });
            get().calculateTotals();
          }
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to fetch portfolios', 
            isLoading: false 
          });
          throw error;
        }
      },

      fetchPortfolioById: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await apiClient.getPortfolio(id);
          
          if (result.error) {
            set({ error: result.error, isLoading: false });
            throw new Error(result.error);
          }
          
          if (result.data) {
            set({ 
              currentPortfolio: result.data, 
              isLoading: false 
            });
          }
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to fetch portfolio', 
            isLoading: false 
          });
          throw error;
        }
      },

      createPortfolio: async (name: string, baseCurrency = 'USD') => {
        set({ isLoading: true, error: null });
        try {
          const result = await apiClient.createPortfolio(name, baseCurrency);
          
          if (result.error) {
            set({ error: result.error, isLoading: false });
            throw new Error(result.error);
          }
          
          if (result.data) {
            const newPortfolio = result.data;
            set(state => ({ 
              portfolios: [...state.portfolios, newPortfolio],
              isLoading: false 
            }));
            get().calculateTotals();
          }
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to create portfolio', 
            isLoading: false 
          });
          throw error;
        }
      },

      deletePortfolio: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          // Note: Need to add deletePortfolio method to apiClient
          // For now, we'll filter it out locally
          set(state => ({ 
            portfolios: state.portfolios.filter(p => p.id !== id),
            isLoading: false,
            currentPortfolio: state.currentPortfolio?.id === id ? null : state.currentPortfolio,
          }));
          get().calculateTotals();
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to delete portfolio', 
            isLoading: false 
          });
          throw error;
        }
      },

      setCurrentPortfolio: (portfolio: Portfolio | null) => {
        set({ currentPortfolio: portfolio });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      calculateTotals: () => {
        const { portfolios } = get();
        const totalVal = portfolios.reduce((sum, p) => 
          sum + (p.totalValue || 0), 0);
        const totalUnrealized = portfolios.reduce((sum, p) => 
          sum + (p.totalUnrealizedPnl || 0), 0);
        const totalPnlVal = portfolios.reduce((sum, p) => 
          sum + (p.totalUnrealizedPnl || 0) + (p.totalRealizedPnl || 0), 0);
        
        // Calculate cost basis: Total Value - Unrealized PnL
        const totalCost = totalVal - totalUnrealized;
        
        // Calculate percentage: (Total PnL / Cost Basis) * 100
        // Use 0 if cost is 0 to avoid division by zero
        const totalPnlPercentVal = totalCost === 0 ? 0 : (totalPnlVal / totalCost) * 100;
        
        set({ 
          totalValue: totalVal, 
          totalPnl: totalPnlVal,
          totalPnlPercent: totalPnlPercentVal
        });
      },
    }),
    {
      name: 'portfolio-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        portfolios: state.portfolios,
        currentPortfolio: state.currentPortfolio,
        totalValue: state.totalValue,
        totalPnl: state.totalPnl,
        totalPnlPercent: state.totalPnlPercent,
      }),
    }
  )
);