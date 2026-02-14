'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await login(email, password);
      
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success('Welcome back!');
      router.push('/');
    } catch (err) {
      setError('An unexpected error occurred');
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      description="Enter your email to sign in to your account"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-lg animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300"
          >
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10 transition-all duration-200"
              placeholder="name@example.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:text-primary/80 dark:text-primary/90 font-medium transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10 transition-all duration-200"
              placeholder="Enter your password"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-10 transition-all duration-200 shadow-md hover:shadow-lg"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign in
        </Button>
      </form>

      <div className="text-center text-sm">
        <span className="text-gray-500 dark:text-gray-400">
          Don't have an account?{' '}
        </span>
        <Link
          href="/register"
          className="font-medium text-primary hover:text-primary/80 dark:text-primary/90 transition-colors"
        >
          Sign up
        </Link>
      </div>
    </AuthLayout>
  );
}