'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

export function HeroActions() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsAuthenticated(apiClient.isAuthenticated());
    setMounted(true);
  }, []);

  // Default to Guest view during SSR and initial mount to prevent hydration mismatch
  if (!mounted || !isAuthenticated) {
    return (
      <>
        <Link
          href="/register"
          className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
        >
          Get Started Free
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-blue-600 bg-white dark:bg-gray-800 dark:text-blue-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Sign In
        </Link>
      </>
    );
  }

  return (
    <>
      <Link
        href="/dashboard"
        className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
      >
        Go to Dashboard
      </Link>
      <Link
        href="/portfolios"
        className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-blue-600 bg-white dark:bg-gray-800 dark:text-blue-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        View Portfolios
      </Link>
    </>
  );
}

export function CtaActions() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsAuthenticated(apiClient.isAuthenticated());
    setMounted(true);
  }, []);

  if (!mounted || !isAuthenticated) {
    return (
      <>
        <Link
          href="/register"
          className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-blue-600 bg-white rounded-xl hover:bg-gray-50 transition-colors"
        >
          Start Free Trial
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-transparent border-2 border-white rounded-xl hover:bg-white/10 transition-colors"
        >
          Sign In
        </Link>
      </>
    );
  }

  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-blue-600 bg-white rounded-xl hover:bg-gray-50 transition-colors"
    >
      Go to Dashboard
    </Link>
  );
}
