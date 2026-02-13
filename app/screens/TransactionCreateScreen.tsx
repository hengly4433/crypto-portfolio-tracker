import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { usePortfolioStore } from '../store/portfolio-store';
import { usePortfolioDetailStore } from '../store/portfolio-detail-store';
import Card from '../components/Card';
import Button from '../components/Button';
import { colors, borderRadius, spacing } from '../lib/theme';

type RouteParams = {
  portfolioId?: string;
};

type TransactionType = 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAWAL';

export default function TransactionCreateScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { portfolioId: routePortfolioId } = route.params as RouteParams;

  const { portfolios } = usePortfolioStore();
  const { createTransaction, isLoading } = usePortfolioDetailStore();

  const [portfolioId, setPortfolioId] = useState(routePortfolioId || '');
  const [transactionType, setTransactionType] = useState<TransactionType>('BUY');
  const [assetSymbol, setAssetSymbol] = useState('');
  const [assetId, setAssetId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [transactionCurrency, setTransactionCurrency] = useState('USD');
  const [feeAmount, setFeeAmount] = useState('0');
  const [feeCurrency, setFeeCurrency] = useState('USD');
  const [note, setNote] = useState('');
  const [tradeDate, setTradeDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (portfolios.length > 0 && !portfolioId) {
      setPortfolioId(portfolios[0].id);
    }
  }, [portfolios, portfolioId]);

  const handleSubmit = async () => {
    if (!portfolioId) {
      Alert.alert('Error', 'Please select a portfolio');
      return;
    }
    if (!assetSymbol.trim()) {
      Alert.alert('Error', 'Please enter asset symbol');
      return;
    }
    if (!assetId.trim()) {
      Alert.alert('Error', 'Please enter asset ID');
      return;
    }
    if (!quantity.trim() || parseFloat(quantity) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }
    if (!price.trim() || parseFloat(price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    try {
      await createTransaction(portfolioId, {
        assetId,
        side: transactionType,
        quantity: parseFloat(quantity),
        price: parseFloat(price),
        transactionCurrency,
        feeAmount: parseFloat(feeAmount) || 0,
        feeCurrency,
        tradeTime: tradeDate.toISOString(),
        note: note.trim() || undefined,
      });

      Alert.alert('Success', 'Transaction created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create transaction');
    }
  };

  const onDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setTradeDate(selectedDate);
  };

  const typeOptions: { type: TransactionType; label: string; icon: string }[] = [
    { type: 'BUY', label: 'Buy', icon: 'arrow-down-circle' },
    { type: 'SELL', label: 'Sell', icon: 'arrow-up-circle' },
    { type: 'DEPOSIT', label: 'Deposit', icon: 'log-in' },
    { type: 'WITHDRAWAL', label: 'Withdraw', icon: 'log-out' },
  ];

  const total = (parseFloat(quantity) || 0) * (parseFloat(price) || 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Portfolio Selection */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Portfolio</Text>
        {portfolios.length === 0 ? (
          <Text style={styles.errorText}>No portfolios available. Create one first.</Text>
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

      {/* Transaction Type */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Type</Text>
        <View style={styles.typeGrid}>
          {typeOptions.map((opt) => (
            <TouchableOpacity
              key={opt.type}
              style={[styles.typeBtn, transactionType === opt.type && styles.typeBtnActive]}
              onPress={() => setTransactionType(opt.type)}
            >
              <Ionicons
                name={opt.icon as any}
                size={20}
                color={transactionType === opt.type ? colors.white : colors.primary}
              />
              <Text style={[styles.typeBtnText, transactionType === opt.type && styles.typeBtnTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Asset Details */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Asset Details</Text>

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
            <Text style={styles.inputLabel}>Asset ID *</Text>
            <TextInput
              style={styles.input}
              value={assetId}
              onChangeText={setAssetId}
              placeholder="e.g., 1"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Quantity *</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Price *</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Total Calculation */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
      </Card>

      {/* Transaction Details */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Currency</Text>
            <TextInput
              style={styles.input}
              value={transactionCurrency}
              onChangeText={setTransactionCurrency}
              placeholder="USD"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Fee</Text>
            <TextInput
              style={styles.input}
              value={feeAmount}
              onChangeText={setFeeAmount}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Trade Date</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={styles.dateBtnText}>{tradeDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker value={tradeDate} mode="date" display="default" onChange={onDateChange} />
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Note</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={note}
            onChangeText={setNote}
            placeholder="Optional note..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>
      </Card>

      <Button
        title={isLoading ? 'Creating...' : 'Create Transaction'}
        onPress={handleSubmit}
        disabled={isLoading || portfolios.length === 0}
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
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: 'rgba(91, 127, 255, 0.08)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(91, 127, 255, 0.2)',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  dateBtnText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
});