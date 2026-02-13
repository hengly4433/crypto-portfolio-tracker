import { useQuery } from '@tanstack/react-query';
import { apiClient, Asset } from '@/lib/api-client';

export function useAssets() {
  return useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const result = await apiClient.getAssets();
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    staleTime: 5 * 60 * 1000, // Assets rarely change, 5 min stale time
  });
}
