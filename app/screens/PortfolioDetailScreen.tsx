import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { usePortfolioDetailStore } from '../store/portfolio-detail-store';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { colors, borderRadius, spacing } from '../lib/theme';

type Tab = 'overview' | 'positions' | 'transactions';

export default function PortfolioDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { portfolioId } = route.params;

  const {
    summary,
    positions,
    transactions,
    isLoading,
    fetchPortfolioSummary,
    fetchPortfolioTransactions,
  } = usePortfolioDetailStore();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchPortfolioSummary(portfolioId);
      fetchPortfolioTransactions(portfolioId);
    }, [portfolioId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchPortfolioSummary(portfolioId),
      fetchPortfolioTransactions(portfolioId),
    ]);
    setRefreshing(false);
  };

  if (isLoading && !summary) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const totalValue = summary?.totalValue || 0;
  const pnl = summary?.totalUnrealizedPnl || 0;
  const pnlPercent = totalValue > 0 ? (pnl / (totalValue - pnl)) * 100 : 0;
  const isPositive = pnl >= 0;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'positions', label: 'Positions' },
    { key: 'transactions', label: 'Transactions' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Balance Header */}
        <View style={styles.balanceSection}>
          <Text style={styles.portfolioName}>{summary?.name || 'Portfolio'}</Text>
          <Text style={styles.totalValue}>
            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <View style={styles.pnlRow}>
            <Ionicons
              name={isPositive ? 'trending-up' : 'trending-down'}
              size={16}
              color={isPositive ? colors.success : colors.danger}
            />
            <Text style={[styles.pnlText, { color: isPositive ? colors.success : colors.danger }]}>
              {isPositive ? '+' : ''}${pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              {' '}({isPositive ? '+' : ''}{pnlPercent.toFixed(2)}%)
            </Text>
          </View>
        </View>

        {/* Pill Tabs */}
        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            {/* Stats Row */}
            <View style={styles.statsRow}>
              <Card style={styles.statCard}>
                <Text style={styles.statLabel}>Unrealized P&L</Text>
                <Text style={[styles.statValue, { color: isPositive ? colors.success : colors.danger }]}>
                  {isPositive ? '+' : ''}${pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </Card>
              <Card style={styles.statCard}>
                <Text style={styles.statLabel}>Realized P&L</Text>
                <Text style={styles.statValue}>
                  ${(summary?.totalRealizedPnl || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </Card>
            </View>
            <View style={styles.statsRow}>
              <Card style={styles.statCard}>
                <Text style={styles.statLabel}>Positions</Text>
                <Text style={styles.statValueLarge}>{positions.length}</Text>
              </Card>
              <Card style={styles.statCard}>
                <Text style={styles.statLabel}>Transactions</Text>
                <Text style={styles.statValueLarge}>{transactions.length}</Text>
              </Card>
            </View>
          </View>
        )}

        {activeTab === 'positions' && (
          <View style={styles.tabContent}>
            {positions.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="layers-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No positions</Text>
                <Text style={styles.emptyText}>Add a transaction to create a position</Text>
              </Card>
            ) : (
              positions.map((pos: any, index: number) => {
                const posValue = pos.marketValue || pos.quantity * pos.currentPrice || 0;
                const posPnl = pos.unrealizedPnl || 0;
                const posPositive = posPnl >= 0;
                return (
                  <Card key={index} style={styles.positionCard}>
                    <View style={styles.positionRow}>
                      <View style={styles.positionIcon}>
                        <Text style={styles.positionSymbolIcon}>
                          {(pos.symbol || '?').slice(0, 1)}
                        </Text>
                      </View>
                      <View style={styles.positionInfo}>
                        <Text style={styles.positionSymbol}>{pos.symbol}</Text>
                        <Text style={styles.positionName}>{pos.name || pos.assetType}</Text>
                      </View>
                      <View style={styles.positionValues}>
                        <Text style={styles.positionValue}>
                          ${posValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                        <Text style={[styles.positionPnl, { color: posPositive ? colors.success : colors.danger }]}>
                          {posPositive ? '+' : ''}{posPnl.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.positionDetails}>
                      <View style={styles.positionDetail}>
                        <Text style={styles.detailLabel}>Qty</Text>
                        <Text style={styles.detailValue}>{pos.quantity}</Text>
                      </View>
                      <View style={styles.positionDetail}>
                        <Text style={styles.detailLabel}>Avg Price</Text>
                        <Text style={styles.detailValue}>${pos.avgPrice?.toFixed(2)}</Text>
                      </View>
                      <View style={styles.positionDetail}>
                        <Text style={styles.detailLabel}>Current</Text>
                        <Text style={styles.detailValue}>${pos.currentPrice?.toFixed(2)}</Text>
                      </View>
                      <View style={styles.positionDetail}>
                        <Text style={styles.detailLabel}>Weight</Text>
                        <Text style={styles.detailValue}>{(pos.weight || 0).toFixed(1)}%</Text>
                      </View>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        )}

        {activeTab === 'transactions' && (
          <View style={styles.tabContent}>
            {transactions.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No transactions</Text>
                <Text style={styles.emptyText}>Record your first trade</Text>
              </Card>
            ) : (
              transactions.map((tx: any, index: number) => {
                const isBuy = tx.side === 'BUY';
                return (
                  <Card key={index} style={styles.txCard}>
                    <View style={styles.txRow}>
                      <View style={[styles.txIcon, { backgroundColor: isBuy ? colors.successBg : colors.dangerBg }]}>
                        <Ionicons
                          name={isBuy ? 'arrow-down-circle' : 'arrow-up-circle'}
                          size={20}
                          color={isBuy ? colors.success : colors.danger}
                        />
                      </View>
                      <View style={styles.txInfo}>
                        <Text style={styles.txSide}>{tx.side}</Text>
                        <Text style={styles.txDate}>
                          {new Date(tx.tradeTime || tx.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.txValues}>
                        <Text style={styles.txAmount}>
                          {tx.quantity} @ ${tx.price}
                        </Text>
                        <Text style={styles.txTotal}>
                          ${(tx.quantity * tx.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </Text>
                      </View>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('TransactionCreate', { portfolioId })}
      >
        <Ionicons name="add" size={26} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.xl,
  },
  balanceSection: {
    marginBottom: spacing.xxl,
  },
  portfolioName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  totalValue: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1,
    marginBottom: spacing.sm,
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.pill,
    padding: 3,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: borderRadius.pill,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  tabTextActive: {
    color: colors.white,
  },
  tabContent: {},
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.lg,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statValueLarge: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  positionCard: {
    marginBottom: spacing.sm,
  },
  positionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  positionIcon: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    backgroundColor: colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  positionSymbolIcon: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  positionInfo: {
    flex: 1,
  },
  positionSymbol: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  positionName: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 1,
  },
  positionValues: {
    alignItems: 'flex-end',
  },
  positionValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  positionPnl: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  positionDetails: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  positionDetail: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  txCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txIcon: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  txInfo: {
    flex: 1,
  },
  txSide: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  txDate: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  txValues: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  txTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});