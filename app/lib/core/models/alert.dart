enum AlertType {
  priceAbove('PRICE_ABOVE', 'Price Above'),
  priceBelow('PRICE_BELOW', 'Price Below'),
  percentChange('PERCENT_CHANGE', 'Percent Change'),
  portfolioDrawdown('PORTFOLIO_DRAWDOWN', 'Portfolio Drawdown'),
  targetPnl('TARGET_PNL', 'Target PnL');

  final String value;
  final String label;
  const AlertType(this.value, this.label);

  static AlertType fromString(String s) {
    return AlertType.values.firstWhere(
      (e) => e.value == s,
      orElse: () => AlertType.priceAbove,
    );
  }
}

class AlertItem {
  final String id;
  final String? portfolioId;
  final String? portfolioName;
  final String? assetId;
  final String? assetSymbol;
  final String? assetName;
  final AlertType alertType;
  final double conditionValue;
  final int? lookbackWindowMinutes;
  final bool isActive;
  final String? lastTriggeredAt;
  final String createdAt;

  AlertItem({
    required this.id,
    this.portfolioId,
    this.portfolioName,
    this.assetId,
    this.assetSymbol,
    this.assetName,
    required this.alertType,
    required this.conditionValue,
    this.lookbackWindowMinutes,
    this.isActive = true,
    this.lastTriggeredAt,
    required this.createdAt,
  });

  factory AlertItem.fromJson(Map<String, dynamic> json) {
    double parseDouble(dynamic value) {
      if (value == null) return 0.0;
      if (value is num) return value.toDouble();
      if (value is String) return double.tryParse(value) ?? 0.0;
      return 0.0;
    }

    return AlertItem(
      id: json['id']?.toString() ?? '',
      portfolioId: json['portfolioId']?.toString(),
      portfolioName: json['portfolioName'],
      assetId: json['assetId']?.toString(),
      assetSymbol: json['assetSymbol'],
      assetName: json['assetName'],
      alertType: AlertType.fromString(json['alertType'] ?? 'PRICE_ABOVE'),
      conditionValue: parseDouble(json['conditionValue']),
      lookbackWindowMinutes: json['lookbackWindowMinutes'],
      isActive: json['isActive'] ?? true,
      lastTriggeredAt: json['lastTriggeredAt'],
      createdAt: json['createdAt'] ?? '',
    );
  }

  AlertItem copyWith({bool? isActive}) {
    return AlertItem(
      id: id,
      portfolioId: portfolioId,
      portfolioName: portfolioName,
      assetId: assetId,
      assetSymbol: assetSymbol,
      assetName: assetName,
      alertType: alertType,
      conditionValue: conditionValue,
      lookbackWindowMinutes: lookbackWindowMinutes,
      isActive: isActive ?? this.isActive,
      lastTriggeredAt: lastTriggeredAt,
      createdAt: createdAt,
    );
  }
}
