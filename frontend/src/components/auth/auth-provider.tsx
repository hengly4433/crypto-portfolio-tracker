'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiClient, User, AuthTokens } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, fullName?: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (!apiClient.isAuthenticated()) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await apiClient.getCurrentUser();
        if (result.data) {
          setUser(result.data);
        } else {
          // Token invalid, try refresh
          const refreshed = await apiClient.refreshToken();
          if (refreshed) {
            const retry = await apiClient.getCurrentUser();
            if (retry.data) {
              setUser(retry.data);
            } else {
              apiClient.clearTokens();
            }
          } else {
            apiClient.clearTokens();
          }
        }
      } catch {
        apiClient.clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiClient.login(email, password);
    if (result.data) {
      apiClient.setTokens(result.data.tokens);
      setUser(result.data.user);
      return {};
    }
    return { error: result.error || 'Login failed' };
  }, []);

  const register = useCallback(async (email: string, password: string, fullName?: string) => {
    const result = await apiClient.register(email, password, fullName);
    if (result.data) {
      apiClient.setTokens(result.data.tokens);
      setUser(result.data.user);
      return {};
    }
    return { error: result.error || 'Registration failed' };
  }, []);

  const logout = useCallback(async () => {
    await apiClient.logout();
    apiClient.clearTokens();
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
