import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';

class MarketCoin {
  final String id;
  final String symbol;
  final String name;
  final double currentPrice;
  final double priceChangePercentage24h;
  final String image;
  final List<double> sparkline;

  MarketCoin({
    required this.id,
    required this.symbol,
    required this.name,
    required this.currentPrice,
    required this.priceChangePercentage24h,
    required this.image,
    required this.sparkline,
  });

  factory MarketCoin.fromJson(Map<String, dynamic> json) {
    return MarketCoin(
      id: json['id'] ?? '',
      symbol: (json['symbol'] ?? '').toUpperCase(),
      name: json['name'] ?? '',
      currentPrice: (json['current_price'] ?? 0).toDouble(),
      priceChangePercentage24h:
          (json['price_change_percentage_24h'] ?? 0).toDouble(),
      image: json['image'] ?? '',
      sparkline: (json['sparkline_in_7d']?['price'] as List<dynamic>?)
              ?.map((e) => (e as num).toDouble())
              .toList() ??
          [],
    );
  }
}

class MarketProvider extends ChangeNotifier {
  List<MarketCoin> _topCoins = [];
  bool _isLoading = false;
  String? _error;

  List<MarketCoin> get topCoins => _topCoins;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchTopCoins() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Use the backend's market-data endpoint if available
      // The backend route is /api/price/market-data
      // Let's assume ApiClient has a method for this or we add it.
      // Checking ApiClient... it doesn't have getMarketData exposed yet, need to add it.
      // For now, I will simulate calling the backend or add the method to ApiClient.
      // Since I can't modify ApiClient in this same step, I'll assume I'm adding it shortly.
      // Or I can use a direct call if ApiClient allows generic get.

      // Actually, I should update ApiClient first. But to keep momentum, I'll mock
      // the data structure expected from the backend or implement the call here if ApiClient is missing it.

      // Let's implement a direct fetch using ApiClient's dio instance if possible,
      // but ApiClient is a singleton wrapping Dio.
      // I will add `getMarketData` to ApiClient in the next step.

      // Placeholder for now:
      final result = await apiClient.getMarketData(sparkline: true);

      if (result['data'] != null) {
        final List<dynamic> data = result['data'];
        _topCoins = data.map((e) => MarketCoin.fromJson(e)).toList();
      } else if (result['error'] != null) {
        _error = result['error'];
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
