import React, { useEffect, useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
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
import Card from '../components/Card';
import Badge from '../components/Badge';
import { colors, borderRadius, spacing, shadows } from '../lib/theme';

export default function PortfolioScreen() {
  const navigation = useNavigation<any>();
  const {
    portfolios,
    fetchPortfolios,
    createPortfolio,
    deletePortfolio,
    isLoading,
  } = usePortfolioStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCurrency, setNewCurrency] = useState('USD');

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

  const handleCreate = async () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    try {
      await createPortfolio(newName.trim(), newCurrency);
      setShowCreateModal(false);
      setNewName('');
      setNewCurrency('USD');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create');
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Portfolio', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePortfolio(id);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  const renderPortfolio = ({ item }: { item: any }) => {
    const value = item.totalValue || 0;
    const pnl = item.totalUnrealizedPnl || 0;
    const isPositive = pnl >= 0;

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('PortfolioDetail', { portfolioId: item.id })}
        onLongPress={() => handleDelete(item.id, item.name)}
        activeOpacity={0.7}
      >
        <Card style={styles.portfolioCard}>
          <View style={styles.cardTop}>
            <View style={styles.iconBox}>
              <Ionicons name="briefcase" size={22} color={colors.primary} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardCurrency}>{item.baseCurrency}</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item.id, item.name)}
            >
              <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.cardBottom}>
            <View>
              <Text style={styles.valueLabel}>Value</Text>
              <Text style={styles.valueAmount}>
                ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.pnlArea}>
              <Text style={styles.valueLabel}>P&L</Text>
              <View style={styles.pnlRow}>
                <Text style={[styles.pnlAmount, { color: isPositive ? colors.success : colors.danger }]}>
                  {isPositive ? '+' : ''}${pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <Ionicons
                  name={isPositive ? 'arrow-up' : 'arrow-down'}
                  size={12}
                  color={isPositive ? colors.success : colors.danger}
                />
              </View>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Portfolios</Text>
          <Text style={styles.subtitle}>{portfolios.length} portfolio{portfolios.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={portfolios}
        renderItem={renderPortfolio}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Ionicons name="briefcase-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No portfolios</Text>
            <Text style={styles.emptyText}>Tap + to create your first portfolio</Text>
          </Card>
        }
      />

      {/* Create Modal */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Portfolio</Text>
            <View style={styles.modalInput}>
              <Text style={styles.modalLabel}>Name</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="Portfolio name"
                placeholderTextColor={colors.textMuted}
                value={newName}
                onChangeText={setNewName}
              />
            </View>
            <View style={styles.modalInput}>
              <Text style={styles.modalLabel}>Currency</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="USD"
                placeholderTextColor={colors.textMuted}
                value={newCurrency}
                onChangeText={setNewCurrency}
                autoCapitalize="characters"
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreateModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
                <Text style={styles.createText}>Create</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glow(colors.primary),
  },
  list: {
    padding: spacing.xl,
    paddingTop: 0,
  },
  portfolioCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(91, 127, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardCurrency: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  valueLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  valueAmount: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pnlArea: {
    alignItems: 'flex-end',
  },
  pnlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pnlAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl + spacing.xl,
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
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
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
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  createBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  createText: {
    color: colors.white,
    fontWeight: '700',
  },
});