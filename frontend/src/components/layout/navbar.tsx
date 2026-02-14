'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { ModeToggle } from '@/components/mode-toggle';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/alerts', label: 'Alerts' },
  { href: '/exchanges', label: 'Exchanges' },
  { href: '/settings', label: 'Settings' },
];

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold tracking-tight text-foreground">
                Crypto Tracker
              </Link>
            </div>
            {isAuthenticated && (
              <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      isActive(item.href)
                        ? 'bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Sign out
              </button>
            ) : (
              <>
                <Link href="/login" className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium transition-colors duration-200">
                  Sign in
                </Link>
                <Link href="/register" className="px-4 py-2 text-sm font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
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