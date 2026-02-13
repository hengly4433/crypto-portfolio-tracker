import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePortfolioStore } from '../store/portfolio-store';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { Ionicons } from '@expo/vector-icons';

export default function TransactionsScreen() {
  const navigation = useNavigation();
  const { portfolios, isLoading, fetchPortfolios } = usePortfolioStore();

  const [refreshing, setRefreshing] = useState(false);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await fetchPortfolios();
      // In a real app, we would fetch all transactions across portfolios
      // For now, we'll use sample data
      loadSampleTransactions();
    } catch (err) {
      // Error is handled in store
    }
  };

  const loadSampleTransactions = () => {
    const sampleTransactions = [
      {
        id: '1',
        portfolioId: '1',
        portfolioName: 'My Portfolio',
        side: 'BUY',
        quantity: 0.5,
        price: 52000,
        transactionCurrency: 'USD',
        grossAmount: 26000,
        feeAmount: 26,
        feeCurrency: 'USD',
        tradeTime: '2024-01-15T10:30:00Z',
        assetSymbol: 'BTC',
        assetName: 'Bitcoin',
      },
      {
        id: '2',
        portfolioId: '1',
        portfolioName: 'My Portfolio',
        side: 'BUY',
        quantity: 3.2,
        price: 3500,
        transactionCurrency: 'USD',
        grossAmount: 11200,
        feeAmount: 11.2,
        feeCurrency: 'USD',
        tradeTime: '2024-01-14T14:45:00Z',
        assetSymbol: 'ETH',
        assetName: 'Ethereum',
      },
      {
        id: '3',
        portfolioId: '2',
        portfolioName: 'Trading Portfolio',
        side: 'SELL',
        quantity: 25,
        price: 140,
        transactionCurrency: 'USD',
        grossAmount: 3500,
        feeAmount: 3.5,
        feeCurrency: 'USD',
        tradeTime: '2024-01-13T09:15:00Z',
        assetSymbol: 'SOL',
        assetName: 'Solana',
      },
      {
        id: '4',
        portfolioId: '1',
        portfolioName: 'My Portfolio',
        side: 'BUY',
        quantity: 100,
        price: 1.2,
        transactionCurrency: 'USD',
        grossAmount: 120,
        feeAmount: 1.2,
        feeCurrency: 'USD',
        tradeTime: '2024-01-12T16:20:00Z',
        assetSymbol: 'ADA',
        assetName: 'Cardano',
      },
    ];
    setAllTransactions(sampleTransactions);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddTransaction = () => {
    if (portfolios.length === 0) {
      Alert.alert(
        'No Portfolios',
        'Please create a portfolio first before adding transactions.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Create Portfolio', 
            onPress: () => navigation.navigate('Portfolios') 
          },
        ]
      );
      return;
    }
    
    // Navigate to transaction create screen
    // For now, show alert
    Alert.alert('Info', 'Transaction creation will be implemented');
  };

  const handleTransactionPress = (transaction: any) => {
    // Show transaction details
    Alert.alert(
      'Transaction Details',
      `${transaction.side} ${transaction.quantity} ${transaction.assetSymbol} at $${transaction.price}`,
      [
        { text: 'OK', style: 'default' },
      ]
    );
  };

  const handlePortfolioPress = (portfolioId: string) => {
    navigation.navigate('PortfolioDetail', { portfolioId });
  };

  const renderTransactionItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => handleTransactionPress(item)}>
      <Card style={styles.transactionItem}>
        <View style={styles.transactionHeader}>
          <View style={styles.transactionTitle}>
            <Badge 
              variant={item.side === 'BUY' ? 'success' : item.side === 'SELL' ? 'destructive' : 'secondary'}
              size="small"
            >
              {item.side}
            </Badge>
            <Text style={styles.transactionAsset}>{item.assetSymbol}</Text>
          </View>
          <Text style={styles.transactionDate}>
            {new Date(item.tradeTime).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.transactionDetails}>
          <View style={styles.transactionRow}>
            <Text style={styles.transactionLabel}>Portfolio:</Text>
            <TouchableOpacity onPress={() => handlePortfolioPress(item.portfolioId)}>
              <Text style={styles.transactionPortfolio}>{item.portfolioName}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.transactionRow}>
            <Text style={styles.transactionLabel}>Quantity:</Text>
            <Text style={styles.transactionValue}>{item.quantity} {item.assetSymbol}</Text>
          </View>

          <View style={styles.transactionRow}>
            <Text style={styles.transactionLabel}>Price:</Text>
            <Text style={styles.transactionValue}>${item.price.toLocaleString()}</Text>
          </View>

          <View style={styles.transactionRow}>
            <Text style={styles.transactionLabel}>Total:</Text>
            <Text style={styles.transactionValue}>${item.grossAmount.toLocaleString()}</Text>
          </View>

          <View style={styles.transactionRow}>
            <Text style={styles.transactionLabel}>Fee:</Text>
            <Text style={styles.transactionValue}>${item.feeAmount} {item.feeCurrency}</Text>
          </View>
        </View>

        <View style={styles.transactionFooter}>
          <Text style={styles.transactionAssetName}>{item.assetName}</Text>
          <Ionicons name="chevron-forward" size={16} color="#007AFF" />
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <Text style={styles.subtitle}>Your trading history across all portfolios</Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="New Transaction"
          onPress={handleAddTransaction}
          icon={<Ionicons name="add" size={20} color="#fff" />}
          style={styles.addButton}
        />
      </View>

      <FlatList
        data={allTransactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="swap-horizontal-outline" size={48} color="#ccc" />
            </View>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptyDescription}>
              Add your first transaction to start tracking your trades
            </Text>
            <Button
              title="Add Transaction"
              onPress={handleAddTransaction}
              style={styles.emptyButton}
            />
          </Card>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  actions: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  addButton: {
    width: '100%',
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  transactionItem: {
    marginBottom: 12,
    padding: 16,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionAsset: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  transactionDate: {
    fontSize: 12,
    color: '#888',
  },
  transactionDetails: {
    gap: 6,
    marginBottom: 12,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLabel: {
    fontSize: 12,
    color: '#666',
  },
  transactionValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  transactionPortfolio: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  transactionAssetName: {
    fontSize: 12,
    color: '#888',
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyButton: {
    width: '100%',
  },
});