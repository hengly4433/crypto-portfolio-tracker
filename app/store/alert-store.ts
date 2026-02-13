import { create } from 'zustand';
import { apiClient } from '../lib/api-client';

export interface AlertItem {
  id: string;
  portfolioId?: string;
  portfolioName?: string;
  assetId?: string;
  assetSymbol?: string;
  assetName?: string;
  alertType: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'PERCENT_CHANGE' | 'PORTFOLIO_DRAWDOWN' | 'TARGET_PNL';
  conditionValue: number;
  lookbackWindowMinutes?: number;
  isActive: boolean;
  lastTriggeredAt?: string;
  createdAt: string;
}

interface AlertState {
  alerts: AlertItem[];
  isLoading: boolean;
  error: string | null;

  fetchAlerts: () => Promise<void>;
  createAlert: (data: any) => Promise<void>;
  updateAlert: (id: string, data: any) => Promise<void>;
  toggleAlert: (id: string, isActive: boolean) => Promise<void>;
  deleteAlert: (id: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  isLoading: false,
  error: null,

  fetchAlerts: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await apiClient.getAlerts();
      if (result.error) {
        set({ error: result.error, isLoading: false });
        throw new Error(result.error);
      }
      set({ alerts: result.data || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch alerts', isLoading: false });
      throw error;
    }
  },

  createAlert: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const result = await apiClient.createAlert(data);
      if (result.error) {
        set({ error: result.error, isLoading: false });
        throw new Error(result.error);
      }
      // Refresh the list after creation
      await get().fetchAlerts();
    } catch (error: any) {
      set({ error: error.message || 'Failed to create alert', isLoading: false });
      throw error;
    }
  },

  updateAlert: async (id: string, data: any) => {
    set({ isLoading: true, error: null });
    try {
      const result = await apiClient.updateAlert(id, data);
      if (result.error) {
        set({ error: result.error, isLoading: false });
        throw new Error(result.error);
      }
      // Optimistic update
      set(state => ({
        alerts: state.alerts.map(a => a.id === id ? { ...a, ...data } : a),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to update alert', isLoading: false });
      throw error;
    }
  },

  toggleAlert: async (id: string, isActive: boolean) => {
    // Optimistic toggle
    set(state => ({
      alerts: state.alerts.map(a => a.id === id ? { ...a, isActive } : a),
    }));
    try {
      const result = await apiClient.updateAlert(id, { isActive });
      if (result.error) throw new Error(result.error);
    } catch (error: any) {
      // Revert optimistic update
      set(state => ({
        alerts: state.alerts.map(a => a.id === id ? { ...a, isActive: !isActive } : a),
        error: error.message || 'Failed to toggle alert',
      }));
    }
  },

  deleteAlert: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await apiClient.deleteAlert(id);
      if (result.error) {
        set({ error: result.error, isLoading: false });
        throw new Error(result.error);
      }
      set(state => ({
        alerts: state.alerts.filter(a => a.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete alert', isLoading: false });
      throw error;
    }
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
}));
