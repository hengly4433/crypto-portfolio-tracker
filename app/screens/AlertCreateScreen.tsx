import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { usePortfolioStore } from '../store/portfolio-store';
import { useAlertStore } from '../store/alert-store';
import Card from '../components/Card';
import Button from '../components/Button';
import { colors, borderRadius, spacing } from '../lib/theme';

type RouteParams = {
  portfolioId?: string;
};

type AlertType = 'PRICE_ABOVE' | 'PRICE_BELOW' | 'PERCENT_CHANGE' | 'PORTFOLIO_DRAWDOWN' | 'TARGET_PNL';

export default function AlertCreateScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { portfolioId: routePortfolioId } = route.params as RouteParams;

  const { portfolios } = usePortfolioStore();
  const { createAlert, isLoading } = useAlertStore();

  const [portfolioId, setPortfolioId] = useState(routePortfolioId || '');
  const [alertType, setAlertType] = useState<AlertType>('PRICE_ABOVE');
  const [assetSymbol, setAssetSymbol] = useState('');
  const [assetId, setAssetId] = useState('');
  const [conditionValue, setConditionValue] = useState('');
  const [lookbackWindow, setLookbackWindow] = useState('');

  const handleSubmit = async () => {
    if (!portfolioId) {
      Alert.alert('Error', 'Please select a portfolio');
      return;
    }
    if (
      ['PRICE_ABOVE', 'PRICE_BELOW', 'PERCENT_CHANGE'].includes(alertType) &&
      !assetSymbol.trim()
    ) {
      Alert.alert('Error', 'Please enter asset symbol');
      return;
    }
    if (!conditionValue.trim() || parseFloat(conditionValue) <= 0) {
      Alert.alert('Error', 'Please enter a valid condition value');
      return;
    }

    try {
      await createAlert({
        portfolioId,
        assetId: assetId || undefined,
        alertType,
        conditionValue: parseFloat(conditionValue),
        lookbackWindowMinutes: lookbackWindow ? parseInt(lookbackWindow) : undefined,
      });

      Alert.alert('Success', 'Alert created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create alert');
    }
  };

  const typeOptions: { type: AlertType; label: string; icon: string }[] = [
    { type: 'PRICE_ABOVE', label: 'Price Above', icon: 'arrow-up' },
    { type: 'PRICE_BELOW', label: 'Price Below', icon: 'arrow-down' },
    { type: 'PERCENT_CHANGE', label: '% Change', icon: 'trending-up' },
    { type: 'PORTFOLIO_DRAWDOWN', label: 'Drawdown', icon: 'alert-circle' },
    { type: 'TARGET_PNL', label: 'Target P&L', icon: 'flag' },
  ];

  const conditionLabels: Record<AlertType, string> = {
    PRICE_ABOVE: 'Price Above (USD)',
    PRICE_BELOW: 'Price Below (USD)',
    PERCENT_CHANGE: 'Percentage Change (%)',
    PORTFOLIO_DRAWDOWN: 'Maximum Drawdown (%)',
    TARGET_PNL: 'Target P&L (USD)',
  };

  const showAssetFields = ['PRICE_ABOVE', 'PRICE_BELOW', 'PERCENT_CHANGE'].includes(alertType);
  const showLookback = ['PERCENT_CHANGE', 'PORTFOLIO_DRAWDOWN'].includes(alertType);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Portfolio */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Portfolio</Text>
        {portfolios.length === 0 ? (
          <Text style={styles.errorText}>No portfolios available.</Text>
        ) : (
          <View style={styles.pillRow}>
            {portfolios.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.pill, portfolioId === p.id && styles.pillActive]}
                onPress={() => setPortfolioId(p.id)}
              >
                <Text style={[styles.pillText, portfolioId === p.id && styles.pillTextActive]}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Card>

      {/* Alert Type */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Alert Type</Text>
        <View style={styles.typeGrid}>
          {typeOptions.map((opt) => (
            <TouchableOpacity
              key={opt.type}
              style={[styles.typeBtn, alertType === opt.type && styles.typeBtnActive]}
              onPress={() => setAlertType(opt.type)}
            >
              <Ionicons
                name={opt.icon as any}
                size={18}
                color={alertType === opt.type ? colors.white : colors.primary}
              />
              <Text style={[styles.typeBtnText, alertType === opt.type && styles.typeBtnTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Asset (conditional) */}
      {showAssetFields && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Asset</Text>
          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Symbol *</Text>
              <TextInput
                style={styles.input}
                value={assetSymbol}
                onChangeText={setAssetSymbol}
                placeholder="e.g., BTC"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Asset ID</Text>
              <TextInput
                style={styles.input}
                value={assetId}
                onChangeText={setAssetId}
                placeholder="Optional"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </Card>
      )}

      {/* Condition */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Condition</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{conditionLabels[alertType]}</Text>
          <TextInput
            style={styles.input}
            value={conditionValue}
            onChangeText={setConditionValue}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
          />
        </View>
        {showLookback && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Lookback Window (minutes)</Text>
            <TextInput
              style={styles.input}
              value={lookbackWindow}
              onChangeText={setLookbackWindow}
              placeholder="e.g., 60"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
            />
            <Text style={styles.helpText}>Time period to calculate the change over</Text>
          </View>
        )}
      </Card>

      <Button
        title={isLoading ? 'Creating...' : 'Create Alert'}
        onPress={handleSubmit}
        disabled={portfolios.length === 0 || isLoading}
        loading={isLoading}
        size="large"
        style={styles.submitBtn}
      />

      <View style={{ height: 40 }} />
    </ScrollView>
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
  section: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    textAlign: 'center',
    padding: spacing.md,
    backgroundColor: colors.dangerBg,
    borderRadius: borderRadius.sm,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.white,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.transparent,
  },
  typeBtnActive: {
    backgroundColor: colors.primary,
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  typeBtnTextActive: {
    color: colors.white,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
  },
  helpText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
});