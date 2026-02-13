import { HeroActions, CtaActions } from '@/components/home/home-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-background">
        {/* Background Gradients/Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-primary/20 blur-[120px] rounded-full opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[100px] rounded-full opacity-30 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
          <div className="text-center max-w-4xl mx-auto animate-fade-in-up">
            <Badge variant="glass" className="mb-6 px-4 py-1.5 text-sm uppercase tracking-wider">
              ✨ The Future of Tracking
            </Badge>
            <h1 className="text-5xl md:text-8xl font-bold tracking-tight mb-8">
              Track Your <br />
              <span className="text-gradient">Crypto Wealth</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Real-time analytics, intelligent alerts, and multi-asset support. 
              Experience the most powerful portfolio tracker built for the modern investor.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <HeroActions />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
             <h2 className="text-4xl md:text-5xl font-bold mb-6">Why Choose Us?</h2>
             <p className="text-lg text-muted-foreground">Built for speed, accuracy, and beauty.</p>
          </div>
        
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card variant="glass-hover" className="h-full">
              <CardHeader>
                <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-4 text-3xl">
                  📊
                </div>
                <CardTitle className="text-2xl">Real-Time Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Live updates on holdings, total value, and P&L. Visualize your growth with interactive, beautiful charts.
                </p>
              </CardContent>
            </Card>

            <Card variant="glass-hover" className="h-full">
              <CardHeader>
                <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-4 text-3xl">
                  💰
                </div>
                <CardTitle className="text-2xl">Multi-Asset Engine</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Seamlessly track Crypto, Forex, Gold, and Fiat. A unified view for your entire financial portfolio.
                </p>
              </CardContent>
            </Card>

            <Card variant="glass-hover" className="h-full">
              <CardHeader>
                <div className="w-14 h-14 bg-pink-500/20 rounded-2xl flex items-center justify-center mb-4 text-3xl">
                  🔔
                </div>
                <CardTitle className="text-2xl">Smart Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-lg leading-relaxed">
                   Set custom price targets and P&L thresholds. Get notified instantly so you never miss a move.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-muted/50 py-32 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-20">
            Start Tracking in Minutes
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
             {/* Connector Line */}
             <div className="hidden md:block absolute top-8 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            {[
              { title: "Sign Up", desc: "Create your free account instantly", icon: "1" },
              { title: "Add Assets", desc: "Connect wallets or add manually", icon: "2" },
              { title: "Track", desc: "Monitor real-time performance", icon: "3" },
              { title: "Optimize", desc: "Make data-driven decisions", icon: "4" }
            ].map((step, i) => (
              <div key={i} className="text-center relative z-10">
                <div className="w-16 h-16 bg-background border-2 border-primary/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                  <span className="text-2xl font-bold text-primary">{step.icon}</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="relative rounded-3xl p-12 overflow-hidden text-center group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 opacity-80" />
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10" />
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
              Ready to Upgrade Your Portfolio?
            </h2>
            <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
              Join thousands of smart investors taking control of their financial future.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <CtaActions />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
