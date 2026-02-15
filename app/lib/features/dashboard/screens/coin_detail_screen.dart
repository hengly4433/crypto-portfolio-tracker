import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../providers/market_provider.dart';

class CoinDetailScreen extends StatefulWidget {
  final MarketCoin coin;

  const CoinDetailScreen({super.key, required this.coin});

  @override
  State<CoinDetailScreen> createState() => _CoinDetailScreenState();
}

class _CoinDetailScreenState extends State<CoinDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _selectedTimeframe = '1H';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final ext = theme.extension<AppThemeExtension>()!;
    final currencyFormat =
        NumberFormat.currency(symbol: '\$', decimalDigits: 8); // High precision
    final isPositive = widget.coin.priceChangePercentage24h >= 0;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon:
              Icon(Icons.arrow_back, color: theme.textTheme.bodyMedium?.color),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(widget.coin.symbol, style: theme.textTheme.titleLarge),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: theme.cardTheme.color,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: ext.cardBorder),
              ),
              child: Text(
                '#${widget.coin.id == 'bonk' ? '55' : '1'}', // Mock rank or pass it
                style: TextStyle(fontSize: 12, color: ext.textTertiary),
              ),
            ),
          ],
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: Icon(Icons.star_border, color: theme.primaryColor),
            onPressed: () {},
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          // Custom Tab Bar
          Container(
            height: 40,
            margin: const EdgeInsets.symmetric(vertical: 16),
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                _buildTab('Overview', true),
                _buildTab('Community', false),
                _buildTab('Markets', false),
                _buildTab('News', false),
              ],
            ),
          ),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(AppSpacing.xl),
              child: Column(
                children: [
                  // Price Header
                  Text(
                    currencyFormat.format(widget.coin.currentPrice),
                    style: theme.textTheme.displayMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      fontSize: 32,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: isPositive ? ext.successBg : ext.dangerBg,
                      borderRadius: BorderRadius.circular(AppRadius.pill),
                    ),
                    child: Text(
                      '${isPositive ? '+' : ''}${widget.coin.priceChangePercentage24h.toStringAsFixed(2)}% (24H)',
                      style: TextStyle(
                        color: isPositive ? ext.success : ext.danger,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xxl),

                  // Chart Area
                  SizedBox(
                    height: 250,
                    child: LineChart(
                      LineChartData(
                        gridData: FlGridData(
                          show: true,
                          drawVerticalLine: false,
                          horizontalInterval: widget.coin.currentPrice * 0.05,
                          getDrawingHorizontalLine: (value) => FlLine(
                            color: ext.cardBorder.withOpacity(0.5),
                            strokeWidth: 1,
                            dashArray: [5, 5],
                          ),
                        ),
                        titlesData: FlTitlesData(
                          rightTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              reservedSize: 40,
                              getTitlesWidget: (value, meta) {
                                return Text(
                                  value.toStringAsFixed(value < 1 ? 6 : 2),
                                  style: TextStyle(
                                    color: ext.textTertiary,
                                    fontSize: 10,
                                  ),
                                );
                              },
                            ),
                          ),
                          leftTitles: const AxisTitles(
                              sideTitles: SideTitles(showTitles: false)),
                          topTitles: const AxisTitles(
                              sideTitles: SideTitles(showTitles: false)),
                          bottomTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              getTitlesWidget: (value, meta) {
                                // Mock time labels
                                if (value == 0) return const Text('10:45');
                                if (value == widget.coin.sparkline.length - 1)
                                  return const Text('13:15');
                                return const SizedBox();
                              },
                            ),
                          ),
                        ),
                        borderData: FlBorderData(show: false),
                        lineBarsData: [
                          LineChartBarData(
                            spots: widget.coin.sparkline
                                .asMap()
                                .entries
                                .map((e) => FlSpot(e.key.toDouble(), e.value))
                                .toList(),
                            isCurved: true,
                            color: isPositive ? ext.success : ext.danger,
                            barWidth: 2,
                            isStrokeCapRound: true,
                            dotData: const FlDotData(show: false),
                            belowBarData: BarAreaData(
                              show: true,
                              gradient: LinearGradient(
                                colors: [
                                  (isPositive ? ext.success : ext.danger)
                                      .withOpacity(0.2),
                                  (isPositive ? ext.success : ext.danger)
                                      .withOpacity(0.0),
                                ],
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),

                  // Timeframe Selector
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: theme.cardTheme.color,
                      borderRadius: BorderRadius.circular(AppRadius.pill),
                      border: Border.all(color: ext.cardBorder),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildTimeframeBtn('1H'),
                        _buildTimeframeBtn('1D'),
                        _buildTimeframeBtn('1W'),
                        _buildTimeframeBtn('1M'),
                        _buildTimeframeBtn('1Y'),
                        _buildIconBtn(Icons.fullscreen),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xxl),

                  // Stats
                  AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Statistics', style: theme.textTheme.titleMedium),
                        const SizedBox(height: AppSpacing.lg),
                        _buildStatRow('Market Cap', '\$2.13 T', theme, ext),
                        const SizedBox(height: AppSpacing.md),
                        _buildStatRow('Volume 24h', '\$113.75 B', theme, ext),
                        const SizedBox(height: AppSpacing.md),
                        _buildStatRow('Max Supply', '21.00 M', theme, ext),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTab(String label, bool isSelected) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      child: AppButton(
        title: label,
        onPressed: () {},
        variant:
            isSelected ? AppButtonVariant.primary : AppButtonVariant.secondary,
        size: AppButtonSize.small,
      ),
    );
  }

  Widget _buildTimeframeBtn(String label) {
    final isSelected = _selectedTimeframe == label;
    final theme = Theme.of(context);
    final ext = theme.extension<AppThemeExtension>()!;

    return GestureDetector(
      onTap: () => setState(() => _selectedTimeframe = label),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? theme.primaryColor : Colors.transparent,
          borderRadius: BorderRadius.circular(AppRadius.pill),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : ext.textTertiary,
            fontWeight: FontWeight.w600,
            fontSize: 12,
          ),
        ),
      ),
    );
  }

  Widget _buildIconBtn(IconData icon) {
    final theme = Theme.of(context);
    final ext = theme.extension<AppThemeExtension>()!;
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        border: Border.all(color: ext.cardBorder),
        shape: BoxShape.circle,
      ),
      child: Icon(icon, size: 16, color: ext.textTertiary),
    );
  }

  Widget _buildStatRow(
      String label, String value, ThemeData theme, AppThemeExtension ext) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(color: ext.textTertiary)),
        Text(value,
            style: theme.textTheme.bodyMedium
                ?.copyWith(fontWeight: FontWeight.w600)),
      ],
    );
  }
}
