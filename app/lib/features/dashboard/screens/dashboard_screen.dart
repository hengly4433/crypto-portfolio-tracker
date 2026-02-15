import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../portfolio/providers/portfolio_provider.dart';
import '../../portfolio/screens/portfolio_detail_screen.dart';
import '../../../shared/widgets/app_card.dart';
import '../providers/market_provider.dart';
import '../widgets/dashboard_chart.dart';
import '../widgets/top_coins_widget.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PortfolioProvider>().fetchPortfolios();
      context.read<MarketProvider>().fetchTopCoins();
    });
  }

  Future<void> _onRefresh() async {
    await Future.wait([
      context.read<PortfolioProvider>().fetchPortfolios(),
      context.read<MarketProvider>().fetchTopCoins(),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    // Watch relevant providers
    final portfolioProvider = context.watch<PortfolioProvider>();
    final theme = Theme.of(context);
    final ext = theme.extension<AppThemeExtension>()!;

    // Calculate total balance
    final totalBalance = portfolioProvider.totalValue;
    final totalPnl = portfolioProvider.totalPnl;
    final totalPnlPercent = portfolioProvider.totalPnlPercent;
    final isPositive = totalPnl >= 0;

    final currencyFormat =
        NumberFormat.currency(symbol: '\$', decimalDigits: 2);

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _onRefresh,
          color: theme.primaryColor,
          child: CustomScrollView(
            slivers: [
              // 1. Header & Total Balance
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.xl),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Welcome / Avatar Row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Dashboard',
                                  style: theme.textTheme.headlineMedium),
                              Text('Welcome back!',
                                  style: TextStyle(color: ext.textTertiary)),
                            ],
                          ),
                          Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: theme.cardTheme.color,
                              shape: BoxShape.circle,
                              border: Border.all(color: ext.cardBorder),
                            ),
                            child:
                                Icon(Icons.person, color: theme.primaryColor),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.xxl),

                      // Total Balance Card
                      AppCard(
                        gradient: LinearGradient(
                          colors: [
                            theme.cardTheme.color!,
                            theme.cardTheme.color!.withOpacity(0.8),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Total Portfolio Value',
                                    style: TextStyle(color: ext.textTertiary)),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: isPositive
                                        ? ext.successBg
                                        : ext.dangerBg,
                                    borderRadius:
                                        BorderRadius.circular(AppRadius.pill),
                                  ),
                                  child: Text(
                                    '${isPositive ? '+' : ''}${totalPnlPercent.toStringAsFixed(2)}%',
                                    style: TextStyle(
                                      color:
                                          isPositive ? ext.success : ext.danger,
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              currencyFormat.format(totalBalance),
                              style: theme.textTheme.displaySmall?.copyWith(
                                fontWeight: FontWeight.bold,
                                fontSize: 32,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Icon(
                                  isPositive
                                      ? Icons.trending_up
                                      : Icons.trending_down,
                                  size: 16,
                                  color: isPositive ? ext.success : ext.danger,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  '${isPositive ? '+' : ''}${currencyFormat.format(totalPnl)}',
                                  style: TextStyle(
                                    color:
                                        isPositive ? ext.success : ext.danger,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                            // Real-time Chart
                            // We can use a mock history or portfolio history if we had it.
                            // For now, let's show market trend of BTC as a proxy or just the DashboardChart with mock/real data if available
                            // Passing data from MarketProvider top coin (e.g. BTC) as a proxy for market trend
                            Consumer<MarketProvider>(
                              builder: (ctx, market, _) {
                                if (market.topCoins.isNotEmpty) {
                                  // Use BTC sparkline as 'Market Trend'
                                  return DashboardChart(
                                    data: market.topCoins.first.sparkline,
                                    isPositive: market.topCoins.first
                                            .priceChangePercentage24h >=
                                        0,
                                  );
                                }
                                return const SizedBox(height: 24);
                              },
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // 2. Your Portfolios
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
                sliver: SliverToBoxAdapter(
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Your Portfolios',
                              style: theme.textTheme.headlineSmall),
                          Text(
                            '${portfolioProvider.portfolios.length}',
                            style: TextStyle(color: ext.textTertiary),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.md),
                      // ... Portfolio List
                      if (portfolioProvider.isLoading &&
                          portfolioProvider.portfolios.isEmpty)
                        Center(
                            child: CircularProgressIndicator(
                                color: theme.primaryColor))
                      else if (portfolioProvider.portfolios.isEmpty)
                        AppCard(
                          child: Center(
                            child: Text(
                              'No portfolios yet. Create one!',
                              style: TextStyle(color: ext.textTertiary),
                            ),
                          ),
                        )
                      else
                        ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: portfolioProvider.portfolios.length,
                          separatorBuilder: (_, __) =>
                              const SizedBox(height: AppSpacing.md),
                          itemBuilder: (context, index) {
                            final portfolio =
                                portfolioProvider.portfolios[index];
                            final pBalance = portfolio.totalValue;
                            final pPnl = portfolio.totalUnrealizedPnl +
                                portfolio.totalRealizedPnl;
                            final pIsPositive = pPnl >= 0;

                            return GestureDetector(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => PortfolioDetailScreen(
                                        portfolioId: portfolio.id),
                                  ),
                                );
                              },
                              child: AppCard(
                                child: Row(
                                  children: [
                                    Container(
                                      width: 48,
                                      height: 48,
                                      decoration: BoxDecoration(
                                        color: theme.colorScheme.onSurface
                                            .withOpacity(0.1),
                                        borderRadius:
                                            BorderRadius.circular(AppRadius.md),
                                      ),
                                      child: Icon(Icons.pie_chart_outline,
                                          color: theme.primaryColor),
                                    ),
                                    const SizedBox(width: AppSpacing.md),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(portfolio.name,
                                              style: theme.textTheme.titleMedium
                                                  ?.copyWith(
                                                      fontWeight:
                                                          FontWeight.w600)),
                                          Text(portfolio.baseCurrency,
                                              style: TextStyle(
                                                  color: ext.textTertiary,
                                                  fontSize: 12)),
                                        ],
                                      ),
                                    ),
                                    Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.end,
                                      children: [
                                        Text(currencyFormat.format(pBalance),
                                            style: theme.textTheme.titleMedium
                                                ?.copyWith(
                                                    fontWeight:
                                                        FontWeight.bold)),
                                        Text(
                                          '${pIsPositive ? '+' : ''}${currencyFormat.format(pPnl)}',
                                          style: TextStyle(
                                            color: pIsPositive
                                                ? ext.success
                                                : ext.danger,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                    ],
                  ),
                ),
              ),

              // 3. Top Coins Widget
              const SliverPadding(
                padding: EdgeInsets.all(AppSpacing.xl),
                sliver: SliverToBoxAdapter(
                  child: TopCoinsWidget(),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 80)),
            ],
          ),
        ),
      ),
    );
  }
}
