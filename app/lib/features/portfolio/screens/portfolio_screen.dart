import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_dialog.dart';
import '../../../core/models/portfolio.dart';
import '../providers/portfolio_provider.dart';

class PortfolioScreen extends StatefulWidget {
  const PortfolioScreen({super.key});

  @override
  State<PortfolioScreen> createState() => _PortfolioScreenState();
}

class _PortfolioScreenState extends State<PortfolioScreen> {
  final _currencyFormat = NumberFormat.currency(symbol: '\$', decimalDigits: 2);
  final _nameController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PortfolioProvider>().fetchPortfolios();
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _onRefresh() async {
    await context.read<PortfolioProvider>().fetchPortfolios();
  }

  void _showCreateDialog([Portfolio? portfolio]) {
    _nameController.text = portfolio?.name ?? '';
    final isEdit = portfolio != null;

    showAppDialog(
      context: context,
      type: AppDialogType.info,
      icon: isEdit ? Icons.edit_outlined : Icons.add_chart_rounded,
      title: isEdit ? 'Edit Portfolio' : 'New Portfolio',
      message: isEdit
          ? 'Update the name of your portfolio.'
          : 'Give your portfolio a name to get started.',
      confirmLabel: isEdit ? 'Update' : 'Create',
      onConfirm: () async {
        if (_nameController.text.isNotEmpty) {
          try {
            if (isEdit) {
              await context.read<PortfolioProvider>().updatePortfolio(
                  portfolio.id, _nameController.text.trim());
            } else {
              await context
                  .read<PortfolioProvider>()
                  .createPortfolio(_nameController.text.trim());
            }
          } catch (_) {}
        }
      },
      content: TextField(
        controller: _nameController,
        autofocus: true,
        style: Theme.of(context).textTheme.bodyMedium,
        decoration: InputDecoration(
          hintText: 'Portfolio name',
          hintStyle: TextStyle(
              color: Theme.of(context)
                  .extension<AppThemeExtension>()!
                  .textTertiary),
        ),
      ),
    );
  }

  void _confirmDelete(String id, String name) {
    showAppDialog(
      context: context,
      type: AppDialogType.danger,
      icon: Icons.delete_outline_rounded,
      title: 'Delete Portfolio',
      message: 'Are you sure you want to delete "$name"? All associated data will be permanently removed.',
      confirmLabel: 'Delete',
      onConfirm: () {
        context.read<PortfolioProvider>().deletePortfolio(id);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PortfolioProvider>();
    final theme = Theme.of(context);
    final ext = theme.extension<AppThemeExtension>()!;

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _onRefresh,
          color: theme.primaryColor,
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Portfolios', style: theme.textTheme.headlineMedium),
                      Container(
                        decoration: BoxDecoration(
                          color: theme.colorScheme.primary,
                          borderRadius: BorderRadius.circular(AppRadius.md),
                        ),
                        child: IconButton(
                          icon: Icon(Icons.add,
                              color: theme.colorScheme.onPrimary),
                          onPressed: _showCreateDialog,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (provider.isLoading && provider.portfolios.isEmpty)
                SliverFillRemaining(
                  child: Center(
                      child:
                          CircularProgressIndicator(color: theme.primaryColor)),
                )
              else if (provider.portfolios.isEmpty)
                SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.pie_chart_outline,
                            size: 48, color: ext.textTertiary),
                        const SizedBox(height: AppSpacing.lg),
                        Text('No portfolios',
                            style: theme.textTheme.bodySmall?.copyWith(
                                fontSize: 16, color: ext.textSecondary)),
                        const SizedBox(height: AppSpacing.lg),
                        AppButton(
                            title: 'Create Portfolio',
                            onPressed: _showCreateDialog),
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
                        final p = provider.portfolios[index];
                        final pPnl = p.totalUnrealizedPnl + p.totalRealizedPnl;
                        final isPosP = pPnl >= 0;
                        return Dismissible(
                          key: Key(p.id),
                          direction: DismissDirection.endToStart,
                          background: Container(
                            alignment: Alignment.centerRight,
                            padding: const EdgeInsets.only(right: 20),
                            margin: const EdgeInsets.symmetric(vertical: 4),
                            decoration: BoxDecoration(
                              color: ext.dangerBg,
                              borderRadius: BorderRadius.circular(AppRadius.lg),
                            ),
                            child: Icon(Icons.delete, color: ext.danger),
                          ),
                          confirmDismiss: (_) async {
                            _confirmDelete(p.id, p.name);
                            return false;
                          },
                          child: AppCard(
                            onTap: () => Navigator.of(context)
                                .pushNamed('/portfolio/${p.id}'),
                            child: Row(
                              children: [
                                Container(
                                  width: 44,
                                  height: 44,
                                  decoration: BoxDecoration(
                                    color: theme.colorScheme.onSurface
                                        .withOpacity(0.1),
                                    borderRadius:
                                        BorderRadius.circular(AppRadius.md),
                                  ),
                                  child: Icon(Icons.pie_chart,
                                      size: 22, color: theme.primaryColor),
                                ),
                                const SizedBox(width: AppSpacing.md),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(p.name,
                                          style: theme.textTheme.titleMedium
                                              ?.copyWith(
                                                  fontWeight: FontWeight.w600,
                                                  fontSize: 16)),
                                      const SizedBox(height: 2),
                                      Text(p.baseCurrency,
                                          style: TextStyle(
                                              color: ext.textTertiary,
                                              fontSize: 12)),
                                    ],
                                  ),
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(_currencyFormat.format(p.totalValue),
                                        style: theme.textTheme.bodyMedium
                                            ?.copyWith(
                                                fontWeight: FontWeight.w600,
                                                fontSize: 15)),
                                    const SizedBox(height: 2),
                                    Text(
                                      '${isPosP ? '+' : ''}${_currencyFormat.format(pPnl)}',
                                      style: TextStyle(
                                          color:
                                              isPosP ? ext.success : ext.danger,
                                          fontSize: 12),
                                    ),
                                  ],
                                ),
                                const SizedBox(width: AppSpacing.sm),
                                PopupMenuButton<String>(
                                  icon: Icon(Icons.more_vert,
                                      color: ext.textTertiary),
                                  onSelected: (value) {
                                    if (value == 'edit') {
                                      _showCreateDialog(p);
                                    } else if (value == 'delete') {
                                      _confirmDelete(p.id, p.name);
                                    }
                                  },
                                  itemBuilder: (context) => [
                                    PopupMenuItem(
                                      value: 'edit',
                                      child: Row(children: [
                                        Icon(Icons.edit,
                                            size: 18, color: ext.textSecondary),
                                        const SizedBox(width: 8),
                                        Text('Edit',
                                            style: theme.textTheme.bodyMedium),
                                      ]),
                                    ),
                                    PopupMenuItem(
                                      value: 'delete',
                                      child: Row(children: [
                                        Icon(Icons.delete,
                                            size: 18, color: ext.danger),
                                        const SizedBox(width: 8),
                                        Text('Delete',
                                            style: TextStyle(
                                                color: ext.danger,
                                                fontSize: 14)),
                                      ]),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                      childCount: provider.portfolios.length,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
