import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/app_card.dart';
import '../providers/market_provider.dart';
import '../screens/coin_detail_screen.dart';

class TopCoinsWidget extends StatelessWidget {
  const TopCoinsWidget({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<MarketProvider>();
    final theme = Theme.of(context);
    final ext = theme.extension<AppThemeExtension>()!;
    final currencyFormat =
        NumberFormat.currency(symbol: '\$', decimalDigits: 2);

    if (provider.isLoading && provider.topCoins.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (provider.error != null) {
      return Center(
          child: Text('Failed to load market data',
              style: TextStyle(color: ext.danger)));
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Top Market Cap', style: theme.textTheme.headlineSmall),
            TextButton(
              onPressed: () {}, // TODO: Navigate to full market list
              child:
                  Text('See All', style: TextStyle(color: theme.primaryColor)),
            )
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: provider.topCoins.length.clamp(0, 5), // Show top 5
          separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.md),
          itemBuilder: (context, index) {
            final coin = provider.topCoins[index];
            final isPositive = coin.priceChangePercentage24h >= 0;

            return GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => CoinDetailScreen(coin: coin),
                  ),
                );
              },
              child: AppCard(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(AppRadius.full),
                      child: Image.network(
                        coin.image,
                        width: 32,
                        height: 32,
                        errorBuilder: (_, __, ___) => Container(
                            width: 32, height: 32, color: ext.textTertiary),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(coin.name,
                              style: theme.textTheme.bodyMedium
                                  ?.copyWith(fontWeight: FontWeight.w600)),
                          Text(coin.symbol,
                              style: TextStyle(
                                  color: ext.textTertiary, fontSize: 12)),
                        ],
                      ),
                    ),
                    // Simple mini chart placeholder or just info
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(currencyFormat.format(coin.currentPrice),
                            style: theme.textTheme.bodyMedium
                                ?.copyWith(fontWeight: FontWeight.w600)),
                        Text(
                          '${isPositive ? '+' : ''}${coin.priceChangePercentage24h.toStringAsFixed(2)}%',
                          style: TextStyle(
                            color: isPositive ? ext.success : ext.danger,
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
    );
  }
}
