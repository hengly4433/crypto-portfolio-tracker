'use client';

import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  const navLinkClass =
    'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium dark:text-gray-400 dark:hover:text-gray-300';

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
                Crypto Tracker
              </Link>
            </div>
            {isAuthenticated && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/dashboard" className={navLinkClass}>Dashboard</Link>
                <Link href="/transactions" className={navLinkClass}>Transactions</Link>
                <Link href="/alerts" className={navLinkClass}>Alerts</Link>
                <Link href="/exchanges" className={navLinkClass}>Exchanges</Link>
                <Link href="/settings" className={navLinkClass}>Settings</Link>
              </div>
            )}
          </div>
          <div className="flex items-center">
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Sign out
              </button>
            ) : (
              <>
                <Link href="/login" className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium dark:text-gray-400 dark:hover:text-gray-300">
                  Sign in
                </Link>
                <Link href="/register" className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}