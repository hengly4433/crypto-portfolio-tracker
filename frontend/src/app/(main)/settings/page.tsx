'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { apiClient, UserSettings } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Settings, Globe, Palette, Shield, User, Save } from 'lucide-react';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD', 'SGD', 'HKD'];
const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Australia/Sydney',
];
const LOCALES = ['en-US', 'en-GB', 'fr-FR', 'de-DE', 'ja-JP', 'zh-CN', 'ko-KR', 'es-ES'];

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      const result = await apiClient.getSettings();
      if (result.data) {
        setSettings(result.data);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (user?.fullName) {
      setFullName(user.fullName);
    }
  }, [user]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const result = await apiClient.updateSettings({
        baseCurrency: settings.baseCurrency,
        timezone: settings.timezone,
        locale: settings.locale,
        darkMode: settings.darkMode,
      });
      if (result.data) {
        setSettings(result.data);
        toast.success('Settings saved successfully');
      } else {
        toast.error(result.error || 'Failed to save settings');
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-500" />
              Profile
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ''} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
          </CardContent>
        </Card>

        {/* Regional */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-cyan-500" />
              Regional
            </CardTitle>
            <CardDescription>Currency, timezone, and locale preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Base Currency</Label>
              <Select
                value={settings?.baseCurrency || 'USD'}
                onValueChange={(value: string) => setSettings((s) => s ? { ...s, baseCurrency: value } : s)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select
                value={settings?.timezone || 'UTC'}
                onValueChange={(value: string) => setSettings((s) => s ? { ...s, timezone: value } : s)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Locale</Label>
              <Select
                value={settings?.locale || 'en-US'}
                onValueChange={(value: string) => setSettings((s) => s ? { ...s, locale: value } : s)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCALES.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-violet-500" />
              Appearance
            </CardTitle>
            <CardDescription>Visual preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="darkMode">Dark Mode</Label>
              <Switch
                id="darkMode"
                checked={settings?.darkMode ?? false}
                onCheckedChange={(checked: boolean) => setSettings((s) => s ? { ...s, darkMode: checked } : s)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              Security
            </CardTitle>
            <CardDescription>Account security options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="destructive"
              onClick={logout}
              className="w-full"
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
