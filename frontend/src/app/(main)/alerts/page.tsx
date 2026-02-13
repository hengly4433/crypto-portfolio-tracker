'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, TrendingUp, TrendingDown, Target, Activity, Trash2, Power, Eye, EyeOff } from 'lucide-react';

interface Alert {
  id: string;
  portfolioId?: string;
  portfolioName?: string;
  assetId?: string;
  assetSymbol?: string;
  assetName?: string;
  alertType: string;
  conditionValue: number;
  lookbackWindowMinutes?: number;
  isActive: boolean;
  lastTriggeredAt?: string;
  createdAt: string;
}

interface Portfolio {
  id: string;
  name: string;
}

interface Asset {
  id: string;
  symbol: string;
  name: string;
}

export default function AlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state - in a real app, extract this to a separate component
  const [portfolioId, setPortfolioId] = useState('');
  const [assetId, setAssetId] = useState('');
  const [alertType, setAlertType] = useState('PRICE_ABOVE');
  const [conditionValue, setConditionValue] = useState('');
  const [lookbackWindowMinutes, setLookbackWindowMinutes] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!apiClient.isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load data in parallel
      const [portfoliosResult, assetsResult, alertsResult] = await Promise.all([
        apiClient.getPortfolios(),
        apiClient.getAssets(),
        apiClient.getAlerts()
      ]);

      if (!portfoliosResult.error && portfoliosResult.data) {
        setPortfolios(portfoliosResult.data);
        if (portfoliosResult.data.length > 0) {
          setPortfolioId(portfoliosResult.data[0].id);
        }
      }

      if (!assetsResult.error && assetsResult.data) {
        setAssets(assetsResult.data);
         if (assetsResult.data.length > 0) {
          setAssetId(assetsResult.data[0].id);
        }
      }

      if (!alertsResult.error && alertsResult.data) {
        setAlerts(alertsResult.data);
      } else if (alertsResult.error) {
        // Only set error if alerts fail, as others might just be empty
        // setError(alertsResult.error);
      }

    } catch (err) {
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!conditionValue) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const alertData = {
        portfolioId: portfolioId || undefined,
        assetId: assetId || undefined,
        alertType,
        conditionValue: parseFloat(conditionValue),
        lookbackWindowMinutes: lookbackWindowMinutes ? parseInt(lookbackWindowMinutes) : undefined,
        isActive,
      };

      const result = await apiClient.createAlert(alertData);
      if (result.error) {
        alert(`Error: ${result.error}`);
        return;
      }

      alert('Alert created successfully!');
      setShowAddForm(false);
      resetForm();
      loadData();
    } catch (err) {
      alert('Failed to create alert');
    }
  };

  const resetForm = () => {
    setPortfolioId(portfolios.length > 0 ? portfolios[0].id : '');
    setAssetId(assets.length > 0 ? assets[0].id : '');
    setAlertType('PRICE_ABOVE');
    setConditionValue('');
    setLookbackWindowMinutes('');
    setIsActive(true);
  };

  const handleToggleAlert = async (alertId: string, currentStatus: boolean) => {
    try {
      // simulate optimistic update
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, isActive: !currentStatus } : a));
       
      // In a real app, you would call apiClient.updateAlert(alertId, { isActive: !currentStatus })
      // loadData(); // Reload to confirm
    } catch (err) {
      // Revert on error
      loadData();
      alert('Failed to update alert');
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) {
      return;
    }
    
    // Optimistic update
    setAlerts(alerts.filter(a => a.id !== alertId));

    // In a real app, you would call apiClient.deleteAlert(alertId)
    // alert('Alert deletion would be implemented here');
    // loadData();
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'PRICE_ABOVE': return 'Price Above';
      case 'PRICE_BELOW': return 'Price Below';
      case 'PERCENT_CHANGE': return 'Percent Change';
      case 'PORTFOLIO_DRAWDOWN': return 'Portfolio Drawdown';
      case 'TARGET_PNL': return 'Target P&L';
      default: return type;
    }
  };

  const getAlertTypeIcon = (type: string) => {
      switch (type) {
        case 'PRICE_ABOVE': return <TrendingUp className="w-4 h-4 text-green-500" />;
        case 'PRICE_BELOW': return <TrendingDown className="w-4 h-4 text-red-500" />;
        case 'PERCENT_CHANGE': return <Activity className="w-4 h-4 text-blue-500" />;
        case 'PORTFOLIO_DRAWDOWN': return <TrendingDown className="w-4 h-4 text-red-500" />;
        case 'TARGET_PNL': return <Target className="w-4 h-4 text-green-500" />;
        default: return <Bell className="w-4 h-4" />;
      }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
         <div className="animate-pulse flex flex-col items-center gap-4">
           <div className="w-12 h-12 bg-primary/20 rounded-full animate-bounce" />
           <div className="text-lg text-muted-foreground font-medium">Loading Alerts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
          <p className="mt-2 text-muted-foreground">
            Set up notifications for price movements and portfolio changes
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} variant="glow" className="gap-2">
            {showAddForm ? 'Cancel' : (
                <>
                    <Bell className="w-4 h-4" /> Create New Alert
                </>
            )}
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Add Alert Form - Inline for now */}
      {showAddForm && (
        <Card variant="glass" className="mb-8 border-primary/20 animate-fade-in-up">
          <CardHeader>
            <CardTitle>Create New Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Alert Type *</label>
                  <select
                    value={alertType}
                    onChange={(e) => setAlertType(e.target.value)}
                    className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="PRICE_ABOVE" className="bg-background text-foreground">Price Above</option>
                    <option value="PRICE_BELOW" className="bg-background text-foreground">Price Below</option>
                    <option value="PERCENT_CHANGE" className="bg-background text-foreground">Percent Change</option>
                    <option value="PORTFOLIO_DRAWDOWN" className="bg-background text-foreground">Portfolio Drawdown</option>
                    <option value="TARGET_PNL" className="bg-background text-foreground">Target P&L</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Condition Value *</label>
                  <input
                    type="number"
                    step="any"
                    value={conditionValue}
                    onChange={(e) => setConditionValue(e.target.value)}
                    className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter value"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Portfolio (Optional)</label>
                  <select
                    value={portfolioId}
                    onChange={(e) => setPortfolioId(e.target.value)}
                    className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="" className="bg-background text-foreground">Select Portfolio</option>
                    {portfolios.map((portfolio) => (
                      <option key={portfolio.id} value={portfolio.id} className="bg-background text-foreground">
                        {portfolio.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Asset (Optional)</label>
                  <select
                    value={assetId}
                    onChange={(e) => setAssetId(e.target.value)}
                    className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="" className="bg-background text-foreground">Select Asset</option>
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id} className="bg-background text-foreground">
                        {asset.symbol} - {asset.name}
                      </option>
                    ))}
                  </select>
                </div>

                {alertType === 'PERCENT_CHANGE' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Lookback Window (Minutes)</label>
                    <input
                      type="number"
                      value={lookbackWindowMinutes}
                      onChange={(e) => setLookbackWindowMinutes(e.target.value)}
                      className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="60"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" variant="glow">
                  Create Alert
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      <Card variant="glass">
        <CardHeader>
            <CardTitle className="text-xl">Active Alerts</CardTitle>
            <CardDescription>{alerts.filter(a => a.isActive).length} alerts currently monitoring the market</CardDescription>
        </CardHeader>
        <CardContent>
            {alerts.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                        <Bell className="w-8 h-8 text-muted-foreground opacity-50" />
                    </div>
                    <p className="text-muted-foreground mb-4">
                        No alerts set up. Create your first alert to get notified about market movements.
                    </p>
                    <Button onClick={() => setShowAddForm(true)} variant="outline">
                         Create First Alert
                    </Button>
                </div>
            ) : (
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-left text-muted-foreground">
                                <th className="px-6 py-3 font-medium">Type</th>
                                <th className="px-6 py-3 font-medium">Target</th>
                                <th className="px-6 py-3 font-medium">Condition</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Last Triggered</th>
                                <th className="px-6 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {alerts.map((alert) => (
                                <tr key={alert.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {getAlertTypeIcon(alert.alertType)}
                                            <span>{getAlertTypeLabel(alert.alertType)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{alert.assetSymbol || alert.portfolioName || 'Global'}</div>
                                        <div className="text-xs text-muted-foreground">{alert.assetName || (alert.portfolioName ? 'Portfolio' : 'All Assets')}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {alert.alertType === 'PERCENT_CHANGE' ? (
                                            <span className="font-mono">{alert.conditionValue}% {alert.lookbackWindowMinutes ? `in ${alert.lookbackWindowMinutes}m` : ''}</span>
                                        ) : (
                                            <span className="font-mono">${alert.conditionValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={alert.isActive ? 'success' : 'secondary'}>
                                            {alert.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {alert.lastTriggeredAt 
                                            ? new Date(alert.lastTriggeredAt).toLocaleDateString() + ' ' + new Date(alert.lastTriggeredAt).toLocaleTimeString()
                                            : 'Never'
                                        }
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                onClick={() => handleToggleAlert(alert.id, alert.isActive)}
                                                className={alert.isActive ? "text-yellow-500 hover:text-yellow-600" : "text-green-500 hover:text-green-600"}
                                                title={alert.isActive ? "Disable Rule" : "Enable Rule"}
                                            >
                                                {alert.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                onClick={() => handleDeleteAlert(alert.id)}
                                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </CardContent>
      </Card>
      
      {/* Alert Examples */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="glass" className="bg-white/5 border-none">
          <CardContent className="p-6">
             <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-blue-500" />
                <h3 className="font-medium">Price Alerts</h3>
             </div>
             <p className="text-sm text-muted-foreground">
                Get notified when an asset reaches a specific price target. Useful for setting buy/sell limits.
             </p>
          </CardContent>
        </Card>
        <Card variant="glass" className="bg-white/5 border-none">
          <CardContent className="p-6">
             <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-5 h-5 text-purple-500" />
                <h3 className="font-medium">Portfolio Alerts</h3>
             </div>
             <p className="text-sm text-muted-foreground">
                Monitor overall portfolio performance and get alerts for drawdowns or target P&L levels.
             </p>
          </CardContent>
        </Card>
        <Card variant="glass" className="bg-white/5 border-none">
          <CardContent className="p-6">
             <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-green-500" />
                <h3 className="font-medium">Volatility Alerts</h3>
             </div>
             <p className="text-sm text-muted-foreground">
                Track significant price movements over specific time periods to catch market trends early.
             </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}