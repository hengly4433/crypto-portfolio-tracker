import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, Portfolio, PortfolioSummary, PerformancePoint, PositionSummary } from '@/lib/api-client';

export function usePortfolios() {
  return useQuery({
    queryKey: ['portfolios'],
    queryFn: async () => {
      const result = await apiClient.getPortfolios();
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function usePortfolio(id: string) {
  return useQuery({
    queryKey: ['portfolio', id],
    queryFn: async () => {
      const result = await apiClient.getPortfolio(id);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: !!id,
  });
}

export function usePortfolioSummary(id: string) {
  return useQuery({
    queryKey: ['portfolio-summary', id],
    queryFn: async () => {
      const result = await apiClient.getPortfolioSummary(id);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function usePortfolioPerformance(id: string, days = 30) {
  return useQuery({
    queryKey: ['portfolio-performance', id, days],
    queryFn: async () => {
      const result = await apiClient.getPortfolioPerformance(id, days);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: !!id,
  });
}

export function useTopPerformers(id: string, limit = 5) {
  return useQuery({
    queryKey: ['top-performers', id, limit],
    queryFn: async () => {
      const result = await apiClient.getTopPerformers(id, limit);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: !!id,
  });
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, baseCurrency }: { name: string; baseCurrency?: string }) => {
      const result = await apiClient.createPortfolio(name, baseCurrency);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
}

export function useDeletePortfolio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await apiClient.deletePortfolio(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
}
