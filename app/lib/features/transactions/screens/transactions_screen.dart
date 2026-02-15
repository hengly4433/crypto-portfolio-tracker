import 'package:flutter/material.dart';

import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/api/api_client.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_badge.dart';

class TransactionsScreen extends StatefulWidget {
  const TransactionsScreen({super.key});

  @override
  State<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends State<TransactionsScreen> {
  List<dynamic> _transactions = [];
  bool _isLoading = false;
  final _currencyFormat = NumberFormat.currency(symbol: '\$', decimalDigits: 2);

  @override
  void initState() {
    super.initState();
    _loadTransactions();
  }

  Future<void> _loadTransactions() async {
    setState(() => _isLoading = true);
    // Load transactions across all portfolios
    final portfoliosResult = await apiClient.getPortfolios();
    if (portfoliosResult['data'] != null) {
      final allTransactions = <dynamic>[];
      for (final p in portfoliosResult['data'] as List) {
        final txResult = await apiClient.getPortfolioTransactions(p['id']);
        if (txResult['data'] != null) {
          for (final t in txResult['data'] as List) {
            t['portfolioName'] = p['name'];
            allTransactions.add(t);
          }
        }
      }
      // Sort by date descending
      allTransactions.sort((a, b) {
        final dateA = DateTime.tryParse(a['tradeTime'] ?? '') ?? DateTime(2000);
        final dateB = DateTime.tryParse(b['tradeTime'] ?? '') ?? DateTime(2000);
        return dateB.compareTo(dateA);
      });
      if (mounted) setState(() => _transactions = allTransactions);
    }
    if (mounted) setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final ext = theme.extension<AppThemeExtension>()!;

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadTransactions,
          color: theme.primaryColor,
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  child: Text('Transactions',
                      style: theme.textTheme.headlineMedium),
                ),
              ),
              if (_isLoading && _transactions.isEmpty)
                SliverFillRemaining(
                  child: Center(
                      child:
                          CircularProgressIndicator(color: theme.primaryColor)),
                )
              else if (_transactions.isEmpty)
                SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.receipt_long_outlined,
                            size: 48, color: ext.textTertiary),
                        const SizedBox(height: AppSpacing.lg),
                        Text('No transactions yet',
                            style: theme.textTheme.bodySmall
                                ?.copyWith(fontSize: 16)),
                      ],
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final t = _transactions[index];
                        final isBuy =
                            (t['side'] ?? '').toString().toUpperCase() == 'BUY';
                        final qty = (t['quantity'] ?? 0).toDouble();
                        final price = (t['price'] ?? 0).toDouble();
                        final gross =
                            (t['grossAmount'] ?? qty * price).toDouble();

                        return AppCard(
                          child: Row(
                            children: [
                              Container(
                                width: 36,
                                height: 36,
                                decoration: BoxDecoration(
                                  color: (isBuy ? ext.success : ext.danger)
                                      .withOpacity(0.12),
                                  borderRadius:
                                      BorderRadius.circular(AppRadius.sm),
                                ),
                                child: Icon(
                                  isBuy
                                      ? Icons.arrow_downward
                                      : Icons.arrow_upward,
                                  size: 18,
                                  color: isBuy ? ext.success : ext.danger,
                                ),
                              ),
                              const SizedBox(width: AppSpacing.md),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(children: [
                                      Text(
                                        '${(t['side'] ?? '').toString().toUpperCase()} ${t['assetSymbol'] ?? ''}',
                                        style: theme.textTheme.bodyMedium
                                            ?.copyWith(
                                                fontWeight: FontWeight.w600,
                                                fontSize: 14),
                                      ),
                                      const SizedBox(width: 8),
                                      AppBadge(
                                        text: t['portfolioName'] ?? '',
                                        size: AppBadgeSize.small,
                                        variant: AppBadgeVariant.secondary,
                                      ),
                                    ]),
                                    const SizedBox(height: 2),
                                    Text(
                                      '${qty.toStringAsFixed(4)} @ ${_currencyFormat.format(price)}',
                                      style: TextStyle(
                                          color: ext.textTertiary,
                                          fontSize: 12),
                                    ),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    _currencyFormat.format(gross),
                                    style: TextStyle(
                                      color: isBuy ? ext.danger : ext.success,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14,
                                    ),
                                  ),
                                  if (t['tradeTime'] != null)
                                    Text(
                                      _formatDate(t['tradeTime']),
                                      style: TextStyle(
                                          color: ext.textTertiary,
                                          fontSize: 11),
                                    ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                      childCount: _transactions.length,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('MMM d, yyyy').format(date);
    } catch (_) {
      return dateStr;
    }
  }
}
