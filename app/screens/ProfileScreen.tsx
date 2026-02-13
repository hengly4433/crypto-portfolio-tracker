import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/auth-store';
import Card from '../components/Card';
import { colors, borderRadius, spacing, shadows } from '../lib/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  const SettingItem = ({
    icon,
    label,
    value,
    onPress,
    danger,
    showArrow = true,
  }: {
    icon: string;
    label: string;
    value?: string;
    onPress?: () => void;
    danger?: boolean;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.settingIcon, danger && styles.settingIconDanger]}>
        <Ionicons
          name={icon as any}
          size={18}
          color={danger ? colors.danger : colors.primary}
        />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, danger && styles.settingLabelDanger]}>{label}</Text>
        {value && <Text style={styles.settingValue}>{value}</Text>}
      </View>
      {showArrow && onPress && (
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Profile</Text>

        {/* User Info */}
        <Card style={styles.userCard}>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.fullName ? user.fullName[0].toUpperCase() : user?.email?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>
        </Card>

        {/* Account Section */}
        <Text style={styles.sectionLabel}>Account</Text>
        <Card style={styles.settingsCard}>
          <SettingItem icon="person-outline" label="Edit Profile" onPress={() => {}} />
          <View style={styles.divider} />
          <SettingItem icon="lock-closed-outline" label="Change Password" onPress={() => {}} />
          <View style={styles.divider} />
          <SettingItem icon="shield-checkmark-outline" label="Security" onPress={() => {}} />
        </Card>

        {/* Preferences */}
        <Text style={styles.sectionLabel}>Preferences</Text>
        <Card style={styles.settingsCard}>
          <SettingItem icon="cash-outline" label="Default Currency" value="USD" onPress={() => {}} />
          <View style={styles.divider} />
          <SettingItem icon="notifications-outline" label="Notifications" onPress={() => {}} />
          <View style={styles.divider} />
          <SettingItem icon="language-outline" label="Language" value="English" onPress={() => {}} />
        </Card>

        {/* Support */}
        <Text style={styles.sectionLabel}>Support</Text>
        <Card style={styles.settingsCard}>
          <SettingItem icon="help-circle-outline" label="Help Center" onPress={() => {}} />
          <View style={styles.divider} />
          <SettingItem icon="chatbox-outline" label="Contact Us" onPress={() => {}} />
          <View style={styles.divider} />
          <SettingItem icon="document-text-outline" label="Terms of Service" onPress={() => {}} />
        </Card>

        {/* Danger Zone */}
        <Text style={styles.sectionLabel}>Danger Zone</Text>
        <Card style={styles.settingsCard}>
          <SettingItem
            icon="log-out-outline"
            label="Sign Out"
            onPress={handleLogout}
            danger
            showArrow={false}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="trash-outline"
            label="Delete Account"
            onPress={handleDeleteAccount}
            danger
            showArrow={false}
          />
        </Card>

        <Text style={styles.version}>CryptoTracker v1.0.0</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.xl,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xxl,
  },
  userCard: {
    marginBottom: spacing.xxl,
    padding: spacing.xl,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(91, 127, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  settingsCard: {
    marginBottom: spacing.xl,
    padding: 0,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(91, 127, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingIconDanger: {
    backgroundColor: colors.dangerBg,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  settingLabelDanger: {
    color: colors.danger,
  },
  settingValue: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 62,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
});