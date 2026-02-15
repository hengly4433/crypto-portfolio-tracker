import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_badge.dart';
import '../../../shared/widgets/app_dialog.dart';
import '../providers/alert_provider.dart';

class AlertsScreen extends StatefulWidget {
  const AlertsScreen({super.key});

  @override
  State<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends State<AlertsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AlertProvider>().fetchAlerts();
    });
  }

  Future<void> _onRefresh() async {
    await context.read<AlertProvider>().fetchAlerts();
  }

  void _confirmDelete(String id) {
    showAppDialog(
      context: context,
      type: AppDialogType.danger,
      icon: Icons.delete_outline_rounded,
      title: 'Delete Alert',
      message: 'Are you sure you want to delete this alert? This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: () {
        context.read<AlertProvider>().deleteAlert(id);
      },
    );
  }

  String _formatAlertType(String type) {
    switch (type) {
      case 'PRICE_ABOVE':
        return 'Price Above';
      case 'PRICE_BELOW':
        return 'Price Below';
      case 'PERCENT_CHANGE':
        return '% Change';
      case 'PORTFOLIO_DRAWDOWN':
        return 'Drawdown';
      case 'TARGET_PNL':
        return 'Target PnL';
      default:
        return type;
    }
  }

  @override
  Widget build(BuildContext context) {
    final alertProv = context.watch<AlertProvider>();
    final theme = Theme.of(context);
    final ext = theme.extension<AppThemeExtension>()!;
    final currencyFormat =
        NumberFormat.currency(symbol: '\$', decimalDigits: 2);

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
                      Text('Alerts', style: theme.textTheme.headlineMedium),
                      Container(
                        decoration: BoxDecoration(
                          color: theme.colorScheme.primary,
                          borderRadius: BorderRadius.circular(AppRadius.md),
                        ),
                        child: IconButton(
                          icon: Icon(Icons.add,
                              color: theme.colorScheme.onPrimary),
                          onPressed: () => Navigator.of(context)
                              .pushNamed('/alerts/new')
                              .then((_) => _onRefresh()),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (alertProv.isLoading && alertProv.alerts.isEmpty)
                SliverFillRemaining(
                  child: Center(
                      child:
                          CircularProgressIndicator(color: theme.primaryColor)),
                )
              else if (alertProv.alerts.isEmpty)
                SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.notifications_none,
                            size: 48, color: ext.textTertiary),
                        const SizedBox(height: AppSpacing.lg),
                        Text('No alerts',
                            style: theme.textTheme.bodySmall?.copyWith(
                                fontSize: 16, color: ext.textSecondary)),
                        const SizedBox(height: AppSpacing.sm),
                        Text('Create alerts to track price changes',
                            style: theme.textTheme.bodySmall
                                ?.copyWith(color: ext.textTertiary)),
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
                        final alert = alertProv.alerts[index];
                        return AppCard(
                          child: Row(
                            children: [
                              Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  color: (alert.isActive
                                          ? theme.primaryColor
                                          : ext.textTertiary)
                                      .withOpacity(0.12),
                                  borderRadius:
                                      BorderRadius.circular(AppRadius.md),
                                ),
                                child: Icon(
                                  Icons.notifications_active,
                                  size: 20,
                                  color: alert.isActive
                                      ? theme.primaryColor
                                      : ext.textTertiary,
                                ),
                              ),
                              const SizedBox(width: AppSpacing.md),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(children: [
                                      if (alert.assetSymbol != null)
                                        Text(alert.assetSymbol!,
                                            style: theme.textTheme.bodyMedium
                                                ?.copyWith(
                                                    fontWeight: FontWeight.w600,
                                                    fontSize: 15)),
                                      if (alert.portfolioName != null)
                                        Text(alert.portfolioName!,
                                            style: theme.textTheme.bodyMedium
                                                ?.copyWith(
                                                    fontWeight: FontWeight.w600,
                                                    fontSize: 15)),
                                      const SizedBox(width: 8),
                                      AppBadge(
                                        text: _formatAlertType(
                                            alert.alertType.value),
                                        size: AppBadgeSize.small,
                                        variant: alert.alertType.value
                                                    .contains('ABOVE') ||
                                                alert.alertType.value
                                                    .contains('TARGET')
                                            ? AppBadgeVariant.success
                                            : AppBadgeVariant.warning,
                                      ),
                                    ]),
                                    const SizedBox(height: 2),
                                    Text(
                                      alert.alertType.value
                                                  .contains('PERCENT') ||
                                              alert.alertType.value
                                                  .contains('DRAWDOWN')
                                          ? '${alert.conditionValue.toStringAsFixed(1)}%'
                                          : currencyFormat
                                              .format(alert.conditionValue),
                                      style: TextStyle(
                                          color: ext.textTertiary,
                                          fontSize: 13),
                                    ),
                                  ],
                                ),
                              ),
                              Switch(
                                value: alert.isActive,
                                onChanged: (val) =>
                                    alertProv.toggleAlert(alert.id, val),
                                activeColor: theme.primaryColor,
                                inactiveTrackColor: theme.colorScheme.surface,
                              ),
                              PopupMenuButton<String>(
                                icon: Icon(Icons.more_vert,
                                    color: ext.textTertiary),
                                onSelected: (value) {
                                  if (value == 'edit') {
                                    Navigator.of(context).pushNamed(
                                        '/alerts/${alert.id}/edit',
                                        arguments: {
                                          'alert': alert
                                        }).then((_) => _onRefresh());
                                  } else if (value == 'delete') {
                                    _confirmDelete(alert.id);
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
                                              color: ext.danger, fontSize: 14)),
                                    ]),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                      childCount: alertProv.alerts.length,
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
