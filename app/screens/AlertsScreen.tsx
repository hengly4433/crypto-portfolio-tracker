import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAlertStore, AlertItem } from '../store/alert-store';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { colors, borderRadius, spacing } from '../lib/theme';

const alertTypeLabels: Record<string, string> = {
  PRICE_ABOVE: 'Price Above',
  PRICE_BELOW: 'Price Below',
  PERCENT_CHANGE: '% Change',
  PORTFOLIO_DRAWDOWN: 'Drawdown',
  TARGET_PNL: 'Target P&L',
};

const alertTypeIcons: Record<string, string> = {
  PRICE_ABOVE: 'arrow-up',
  PRICE_BELOW: 'arrow-down',
  PERCENT_CHANGE: 'trending-up',
  PORTFOLIO_DRAWDOWN: 'alert-circle',
  TARGET_PNL: 'flag',
};

export default function AlertsScreen() {
  const navigation = useNavigation<any>();
  const {
    alerts,
    isLoading,
    fetchAlerts,
    toggleAlert,
    deleteAlert,
  } = useAlertStore();

  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchAlerts();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchAlerts();
    } catch {}
    setRefreshing(false);
  };

  const handleToggle = (id: string, currentState: boolean) => {
    toggleAlert(id, !currentState);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Alert', 'Are you sure you want to delete this alert?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteAlert(id),
      },
    ]);
  };

  const renderAlert = ({ item }: { item: AlertItem }) => {
    const iconName = alertTypeIcons[item.alertType] || 'notifications';
    const typeLabel = alertTypeLabels[item.alertType] || item.alertType;

    return (
      <Card style={styles.alertCard}>
        <View style={styles.alertRow}>
          <View style={[styles.alertIcon, { backgroundColor: item.isActive ? 'rgba(91, 127, 255, 0.12)' : colors.elevated }]}>
            <Ionicons
              name={iconName as any}
              size={20}
              color={item.isActive ? colors.primary : colors.textMuted}
            />
          </View>
          <View style={styles.alertInfo}>
            <View style={styles.alertHeader}>
              <Text style={styles.alertType}>{typeLabel}</Text>
              <Badge
                variant={item.isActive ? 'success' : 'secondary'}
                size="small"
              >
                {item.isActive ? 'Active' : 'Paused'}
              </Badge>
            </View>
            {item.assetSymbol && (
              <Text style={styles.alertAsset}>{item.assetSymbol}</Text>
            )}
            <Text style={styles.alertCondition}>
              {item.alertType.includes('PERCENT') || item.alertType.includes('DRAWDOWN')
                ? `${item.conditionValue}%`
                : `$${Number(item.conditionValue).toLocaleString()}`}
              {item.lookbackWindowMinutes ? ` · ${item.lookbackWindowMinutes}m window` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.alertActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleToggle(item.id, item.isActive)}
          >
            <Ionicons
              name={item.isActive ? 'pause' : 'play'}
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.actionText}>{item.isActive ? 'Pause' : 'Resume'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleDelete(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
            <Text style={[styles.actionText, { color: colors.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Alerts</Text>
          <Text style={styles.subtitle}>{alerts.length} alert{alerts.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AlertCreate', {})}
        >
          <Ionicons name="add" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      {isLoading && alerts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={alerts}
          renderItem={renderAlert}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No alerts set</Text>
              <Text style={styles.emptyText}>Create an alert to get notified about price movements</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('AlertCreate', {})}
              >
                <Ionicons name="add" size={18} color={colors.primary} />
                <Text style={styles.emptyButtonText}>Create Alert</Text>
              </TouchableOpacity>
            </Card>
          }
        />
      )}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: spacing.xl,
    paddingTop: 0,
  },
  alertCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  alertIcon: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  alertInfo: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertType: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  alertAsset: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 3,
  },
  alertCondition: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 3,
  },
  alertActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
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
    textAlign: 'center',
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
});