import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_badge.dart';
import '../../../shared/widgets/app_dialog.dart';
import '../providers/portfolio_detail_provider.dart';

class PortfolioDetailScreen extends StatefulWidget {
  final String portfolioId;
  const PortfolioDetailScreen({super.key, required this.portfolioId});

  @override
  State<PortfolioDetailScreen> createState() => _PortfolioDetailScreenState();
}

class _PortfolioDetailScreenState extends State<PortfolioDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _currencyFormat = NumberFormat.currency(symbol: '\$', decimalDigits: 2);

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  void _loadData() {
    final provider = context.read<PortfolioDetailProvider>();
    provider.fetchSummary(widget.portfolioId);
    provider.fetchTransactions(widget.portfolioId);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _onRefresh() async {
    final provider = context.read<PortfolioDetailProvider>();
    await provider.fetchSummary(widget.portfolioId);
    await provider.fetchTransactions(widget.portfolioId);
  }

  @override
  Widget build(BuildContext context) {
    final detail = context.watch<PortfolioDetailProvider>();
    final summary = detail.summary;
    final pnlIsPositive = (summary?.totalUnrealizedPnl ?? 0) >= 0;
    final theme = Theme.of(context);
    final ext = theme.extension<AppThemeExtension>()!;

    return Scaffold(
      appBar: AppBar(
        title: Text(summary?.name ?? 'Portfolio'),
        actions: [
          IconButton(
            icon: Icon(Icons.add_circle_outline,
                color: theme.colorScheme.primary),
            onPressed: () {
              Navigator.of(context)
                  .pushNamed('/portfolio/${widget.portfolioId}/transaction/new')
                  .then((_) => _loadData());
            },
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.of(context)
              .pushNamed('/portfolio/${widget.portfolioId}/transaction/new')
              .then((_) => _loadData());
        },
        backgroundColor: theme.colorScheme.primary,
        elevation: 4,
        child: Icon(Icons.add, color: theme.colorScheme.onPrimary),
      ),
      body: RefreshIndicator(
        onRefresh: _onRefresh,
        color: theme.primaryColor,
        child: detail.isLoading && summary == null
            ? Center(
                child: CircularProgressIndicator(color: theme.primaryColor))
            : ListView(
                padding: const EdgeInsets.all(AppSpacing.xl),
                children: [
                  // Summary Card
                  if (summary != null) ...[
                    AppCard(
                      variant: AppCardVariant.elevated,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Total Value', style: theme.textTheme.bodySmall),
                          const SizedBox(height: 4),
                          Text(
                            _currencyFormat.format(summary.totalValue),
                            style: theme.textTheme.headlineLarge,
                          ),
                          const SizedBox(height: AppSpacing.sm),
                          Row(children: [
                            AppBadge(
                              text:
                                  '${pnlIsPositive ? '+' : ''}${_currencyFormat.format(summary.totalUnrealizedPnl)}',
                              variant: pnlIsPositive
                                  ? AppBadgeVariant.success
                                  : AppBadgeVariant.destructive,
                              size: AppBadgeSize.small,
                            ),
                            const SizedBox(width: 8),
                            Text('Unrealized PnL',
                                style: theme.textTheme.bodySmall),
                          ]),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xxl),
                  ],

                  // Tab Bar
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: ext
                          .cardHover, // Use cardHover for a subtle background
                      borderRadius: BorderRadius.circular(AppRadius.pill),
                      border:
                          Border.all(color: ext.cardBorder.withOpacity(0.5)),
                    ),
                    child: TabBar(
                      controller: _tabController,
                      onTap: (_) => setState(() {}),
                      indicator: BoxDecoration(
                        color: theme.colorScheme.primary,
                        borderRadius: BorderRadius.circular(AppRadius.pill),
                        boxShadow: [
                          BoxShadow(
                            color: theme.colorScheme.primary.withOpacity(0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      splashFactory: NoSplash.splashFactory,
                      overlayColor: MaterialStateProperty.resolveWith<Color?>(
                        (Set<MaterialState> states) {
                          return states.contains(MaterialState.focused)
                              ? null
                              : Colors.transparent;
                        },
                      ),
                      labelColor: Colors.white,
                      labelStyle: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                      unselectedLabelColor: ext.textSecondary,
                      unselectedLabelStyle: const TextStyle(
                        fontWeight: FontWeight.w500,
                        fontSize: 14,
                      ),
                      dividerColor: Colors.transparent,
                      indicatorSize: TabBarIndicatorSize.tab,
                      tabs: const [
                        Tab(
                          height: 36,
                          text: 'Positions',
                        ),
                        Tab(
                          height: 36,
                          text: 'Transactions',
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: AppSpacing.lg),

                  // Tab Content
                  if (_tabController.index == 0)
                    _buildPositions(detail)
                  else
                    _buildTransactions(detail),
                ],
              ),
      ),
    );
  }

  Widget _buildPositions(PortfolioDetailProvider detail) {
    final theme = Theme.of(context);
    final ext = theme.extension<AppThemeExtension>()!;

    if (detail.positions.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Center(
          child: Column(children: [
            Icon(Icons.account_balance_wallet_outlined,
                size: 40, color: ext.textTertiary),
            const SizedBox(height: AppSpacing.md),
            Text('No positions yet',
                style: theme.textTheme.bodySmall?.copyWith(fontSize: 15)),
            const SizedBox(height: 4),
            Text('Add a transaction to start tracking',
                style: theme.textTheme.bodySmall),
          ]),
        ),
      );
    }

    return Column(
      children: detail.positions.map((pos) {
        final isPosP = pos.unrealizedPnl >= 0;
        return AppCard(
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: theme.primaryColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
                child: Center(
                    child: Text(
                  pos.assetSymbol.length > 3
                      ? pos.assetSymbol.substring(0, 3)
                      : pos.assetSymbol,
                  style: TextStyle(
                      color: theme.primaryColor,
                      fontWeight: FontWeight.w700,
                      fontSize: 11),
                )),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(pos.assetSymbol,
                        style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w600, fontSize: 15)),
                    Text(
                        '${pos.quantity.toStringAsFixed(4)} @ ${_currencyFormat.format(pos.avgPrice)}',
                        style:
                            TextStyle(color: ext.textTertiary, fontSize: 12)),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(_currencyFormat.format(pos.marketValue),
                      style: theme.textTheme.bodyMedium
                          ?.copyWith(fontWeight: FontWeight.w600)),
                  Row(mainAxisSize: MainAxisSize.min, children: [
                    Icon(isPosP ? Icons.arrow_upward : Icons.arrow_downward,
                        size: 12, color: isPosP ? ext.success : ext.danger),
                    const SizedBox(width: 2),
                    Text(
                      '${isPosP ? '+' : ''}${pos.pnlPercent.toStringAsFixed(2)}%',
                      style: TextStyle(
                          color: isPosP ? ext.success : ext.danger,
                          fontSize: 12),
                    ),
                  ]),
                ],
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildTransactions(PortfolioDetailProvider detail) {
    final theme = Theme.of(context);
    final ext = theme.extension<AppThemeExtension>()!;

    if (detail.transactions.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Center(
          child: Column(children: [
            Icon(Icons.receipt_long_outlined,
                size: 40, color: ext.textTertiary),
            const SizedBox(height: AppSpacing.md),
            Text('No transactions yet',
                style: theme.textTheme.bodySmall?.copyWith(fontSize: 15)),
          ]),
        ),
      );
    }

    return Column(
      children: detail.transactions.map((t) {
        final isBuy = t.side.toUpperCase() == 'BUY';
        return AppCard(
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: (isBuy ? ext.success : ext.danger).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                child: Icon(
                  isBuy ? Icons.arrow_downward : Icons.arrow_upward,
                  size: 18,
                  color: isBuy ? ext.success : ext.danger,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('${t.side.toUpperCase()} ${t.assetSymbol}',
                        style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w600, fontSize: 14)),
                    Text(
                        '${t.quantity.toStringAsFixed(4)} @ ${_currencyFormat.format(t.price)}',
                        style:
                            TextStyle(color: ext.textTertiary, fontSize: 12)),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(_currencyFormat.format(t.grossAmount + t.feeAmount),
                      style: TextStyle(
                          color: isBuy ? ext.danger : ext.success,
                          fontWeight: FontWeight.w600,
                          fontSize: 14)),
                  if (t.tradeTime.isNotEmpty)
                    Text(
                      _formatDate(t.tradeTime),
                      style: TextStyle(color: ext.textTertiary, fontSize: 11),
                    ),
                ],
              ),
              const SizedBox(width: AppSpacing.sm),
              PopupMenuButton<String>(
                icon: Icon(Icons.more_vert, color: ext.textTertiary, size: 20),
                onSelected: (value) {
                  if (value == 'edit') {
                    Navigator.of(context).pushNamed(
                      '/portfolio/${widget.portfolioId}/transaction/${t.id}/edit',
                      arguments: {'transaction': t},
                    ).then((_) => _loadData());
                  } else if (value == 'delete') {
                    _confirmDeleteTransaction(t.id);
                  }
                },
                itemBuilder: (context) => [
                  PopupMenuItem(
                    value: 'edit',
                    child: Row(children: [
                      Icon(Icons.edit, size: 18, color: ext.textSecondary),
                      const SizedBox(width: 8),
                      Text('Edit', style: theme.textTheme.bodyMedium),
                    ]),
                  ),
                  PopupMenuItem(
                    value: 'delete',
                    child: Row(children: [
                      Icon(Icons.delete, size: 18, color: ext.danger),
                      const SizedBox(width: 8),
                      Text('Delete', style: TextStyle(color: ext.danger)),
                    ]),
                  ),
                ],
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  void _confirmDeleteTransaction(String transactionId) {
    showAppDialog(
      context: context,
      type: AppDialogType.danger,
      icon: Icons.delete_outline_rounded,
      title: 'Delete Transaction',
      message: 'Are you sure you want to delete this transaction? This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: () async {
        await context
            .read<PortfolioDetailProvider>()
            .deleteTransaction(transactionId, widget.portfolioId);
      },
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
