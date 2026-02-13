import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
      {/* Left Column - Form */}
      <div className="flex flex-col justify-center items-center p-8 lg:p-12 xl:p-16 bg-white dark:bg-gray-900 overflow-y-auto">
        <div className="w-full max-w-[400px] space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {title}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {description}
            </p>
          </div>
          {children}
        </div>
      </div>

      {/* Right Column - Hero */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gray-900 relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-900 opacity-90" />
        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-20" />
        
        {/* Content */}
        <div className="relative z-10 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
                <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                </svg>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">CryptoTracker</span>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Manage your crypto portfolio with confidence.
          </h2>
          <p className="text-lg text-blue-100/90 leading-relaxed">
            Track real-time prices, manage your assets, and analyze your portfolio performance all in one place. Join thousands of users who trust us with their crypto journey.
          </p>
        </div>
        
        <div className="relative z-10 flex items-center gap-4 text-sm text-blue-200/60">
            <span>© 2024 CryptoTracker Inc.</span>
            <span>•</span>
            <Link href="#" className="hover:text-blue-200 transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="#" className="hover:text-blue-200 transition-colors">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}
