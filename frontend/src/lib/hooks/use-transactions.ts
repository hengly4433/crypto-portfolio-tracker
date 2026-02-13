import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, Transaction, CreateTransactionInput } from '@/lib/api-client';

export function useTransactions(portfolioId: string, page = 1, limit = 50) {
  return useQuery({
    queryKey: ['transactions', portfolioId, page, limit],
    queryFn: async () => {
      const result = await apiClient.getPortfolioTransactions(portfolioId, page, limit);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: !!portfolioId,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ portfolioId, transaction }: { portfolioId: string; transaction: CreateTransactionInput }) => {
      const result = await apiClient.createTransaction(portfolioId, transaction);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', variables.portfolioId] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-summary', variables.portfolioId] });
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ portfolioId, transactionId }: { portfolioId: string; transactionId: string }) => {
      const result = await apiClient.deleteTransaction(portfolioId, transactionId);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', variables.portfolioId] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-summary', variables.portfolioId] });
    },
  });
}
