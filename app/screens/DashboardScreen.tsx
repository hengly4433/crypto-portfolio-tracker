import React, { useEffect, useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePortfolioStore } from '../store/portfolio-store';
import { useAuthStore } from '../store/auth-store';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { colors, borderRadius, spacing, shadows } from '../lib/theme';

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const {
    portfolios,
    totalValue,
    totalPnl,
    totalPnlPercent,
    fetchPortfolios,
    createPortfolio,
    isLoading,
    error,
  } = usePortfolioStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newPortfolioCurrency, setNewPortfolioCurrency] = useState('USD');

  useFocusEffect(
    useCallback(() => {
      fetchPortfolios();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPortfolios();
    setRefreshing(false);
  };

  const handleCreatePortfolio = async () => {
    if (!newPortfolioName.trim()) {
      Alert.alert('Error', 'Please enter a portfolio name');
      return;
    }
    try {
      await createPortfolio(newPortfolioName.trim(), newPortfolioCurrency);
      setShowCreateModal(false);
      setNewPortfolioName('');
      setNewPortfolioCurrency('USD');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create portfolio');
    }
  };

  const pnlColor = totalPnl >= 0 ? colors.success : colors.danger;
  const pnlIcon = totalPnl >= 0 ? 'trending-up' : 'trending-down';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Welcome back{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}
            </Text>
            <Text style={styles.headerSubtitle}>Here's your portfolio overview</Text>
          </View>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => navigation.navigate('Alerts')}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Total Balance Card */}
        <Card variant="elevated" style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceValue}>
            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <View style={styles.pnlRow}>
            <Ionicons name={pnlIcon as any} size={16} color={pnlColor} />
            <Text style={[styles.pnlText, { color: pnlColor }]}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Badge variant={totalPnl >= 0 ? 'success' : 'destructive'} size="small">
              {totalPnlPercent >= 0 ? '+' : ''}{totalPnlPercent.toFixed(2)}%
            </Badge>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => setShowCreateModal(true)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(91, 127, 255, 0.12)' }]}>
              <Ionicons name="add-circle" size={24} color={colors.primary} />
            </View>
            <Text style={styles.quickActionText}>New Portfolio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('TransactionCreate', {})}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.successBg }]}>
              <Ionicons name="swap-horizontal" size={24} color={colors.success} />
            </View>
            <Text style={styles.quickActionText}>Trade</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('AlertCreate', {})}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.warningBg }]}>
              <Ionicons name="notifications" size={24} color={colors.warning} />
            </View>
            <Text style={styles.quickActionText}>Set Alert</Text>
          </TouchableOpacity>
        </View>

        {/* Portfolios Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Portfolios</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Portfolios')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {portfolios.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="briefcase-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No portfolios yet</Text>
              <Text style={styles.emptyText}>Create your first portfolio to start tracking</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Ionicons name="add" size={18} color={colors.primary} />
                <Text style={styles.emptyButtonText}>Create Portfolio</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            portfolios.slice(0, 3).map((portfolio) => {
              const pnl = portfolio.totalUnrealizedPnl || 0;
              const value = portfolio.totalValue || 0;
              const isPositive = pnl >= 0;
              return (
                <TouchableOpacity
                  key={portfolio.id}
                  onPress={() => navigation.navigate('PortfolioDetail', { portfolioId: portfolio.id })}
                >
                  <Card style={styles.portfolioCard}>
                    <View style={styles.portfolioRow}>
                      <View style={styles.portfolioIcon}>
                        <Ionicons name="briefcase" size={20} color={colors.primary} />
                      </View>
                      <View style={styles.portfolioInfo}>
                        <Text style={styles.portfolioName}>{portfolio.name}</Text>
                        <Text style={styles.portfolioCurrency}>{portfolio.baseCurrency}</Text>
                      </View>
                      <View style={styles.portfolioValues}>
                        <Text style={styles.portfolioValue}>
                          ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                        <Text style={[styles.portfolioPnl, { color: isPositive ? colors.success : colors.danger }]}>
                          {isPositive ? '+' : ''}${pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Create Portfolio Modal */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Portfolio</Text>

            <View style={styles.modalInput}>
              <Text style={styles.modalLabel}>Name</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="e.g., My Crypto Portfolio"
                placeholderTextColor={colors.textMuted}
                value={newPortfolioName}
                onChangeText={setNewPortfolioName}
              />
            </View>

            <View style={styles.modalInput}>
              <Text style={styles.modalLabel}>Base Currency</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="USD"
                placeholderTextColor={colors.textMuted}
                value={newPortfolioCurrency}
                onChangeText={setNewPortfolioCurrency}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCreateButton}
                onPress={handleCreatePortfolio}
              >
                <Text style={styles.modalCreateText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 2,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  balanceCard: {
    marginBottom: spacing.xxl,
    padding: spacing.xxl,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  balanceValue: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1,
    marginBottom: spacing.md,
  },
  pnlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pnlText: {
    fontSize: 15,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
    gap: spacing.md,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  portfolioCard: {
    marginBottom: spacing.sm,
  },
  portfolioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  portfolioIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(91, 127, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  portfolioInfo: {
    flex: 1,
  },
  portfolioName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  portfolioCurrency: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  portfolioValues: {
    alignItems: 'flex-end',
  },
  portfolioValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  portfolioPnl: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  modalInput: {
    marginBottom: spacing.lg,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalTextInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  modalCreateButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    ...shadows.glow(colors.primary),
  },
  modalCreateText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});