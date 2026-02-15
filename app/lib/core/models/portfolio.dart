class Portfolio {
  final String id;
  final String name;
  final String baseCurrency;
  final double totalValue;
  final double totalUnrealizedPnl;
  final double totalRealizedPnl;

  Portfolio({
    required this.id,
    required this.name,
    required this.baseCurrency,
    this.totalValue = 0,
    this.totalUnrealizedPnl = 0,
    this.totalRealizedPnl = 0,
  });

  factory Portfolio.fromJson(Map<String, dynamic> json) {
    double parseDouble(dynamic value) {
      if (value == null) return 0.0;
      if (value is num) return value.toDouble();
      if (value is String) return double.tryParse(value) ?? 0.0;
      return 0.0;
    }

    return Portfolio(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      baseCurrency: json['baseCurrency'] ?? 'USD',
      totalValue: parseDouble(json['totalValue']),
      totalUnrealizedPnl: parseDouble(json['totalUnrealizedPnl']),
      totalRealizedPnl: parseDouble(json['totalRealizedPnl']),
    );
  }
}

class Position {
  final String id;
  final String assetId;
  final String assetSymbol;
  final String assetName;
  final String assetType;
  final double quantity;
  final double avgPrice;
  final double currentPrice;
  final double marketValue;
  final double costBasis;
  final double unrealizedPnl;
  final double realizedPnl;
  final double pnlPercent;
  final double weight;

  Position({
    required this.id,
    required this.assetId,
    required this.assetSymbol,
    required this.assetName,
    required this.assetType,
    this.quantity = 0,
    this.avgPrice = 0,
    this.currentPrice = 0,
    this.marketValue = 0,
    this.costBasis = 0,
    this.unrealizedPnl = 0,
    this.realizedPnl = 0,
    this.pnlPercent = 0,
    this.weight = 0,
  });

  factory Position.fromJson(Map<String, dynamic> json) {
    double parseDouble(dynamic value) {
      if (value == null) return 0.0;
      if (value is num) return value.toDouble();
      if (value is String) return double.tryParse(value) ?? 0.0;
      return 0.0;
    }

    return Position(
      id: json['id']?.toString() ?? '',
      assetId: json['assetId']?.toString() ?? '',
      assetSymbol: json['assetSymbol'] ?? '',
      assetName: json['assetName'] ?? '',
      assetType: json['assetType'] ?? '',
      quantity: parseDouble(json['quantity']),
      avgPrice: parseDouble(json['avgPrice']),
      currentPrice: parseDouble(json['currentPrice']),
      marketValue: parseDouble(json['marketValue']),
      costBasis: parseDouble(json['costBasis']),
      unrealizedPnl: parseDouble(json['unrealizedPnl']),
      realizedPnl: parseDouble(json['realizedPnl']),
      pnlPercent: parseDouble(json['pnlPercent']),
      weight: parseDouble(json['weight']),
    );
  }
}

class PortfolioSummary {
  final String id;
  final String name;
  final String baseCurrency;
  final double totalValue;
  final double totalUnrealizedPnl;
  final double totalRealizedPnl;
  final double dailyChange;
  final double dailyChangePercent;
  final List<Position> positions;
  final List<AllocationItem> allocation;
  final List<PerformancePoint> performance;

  PortfolioSummary({
    required this.id,
    required this.name,
    required this.baseCurrency,
    this.totalValue = 0,
    this.totalUnrealizedPnl = 0,
    this.totalRealizedPnl = 0,
    this.dailyChange = 0,
    this.dailyChangePercent = 0,
    this.positions = const [],
    this.allocation = const [],
    this.performance = const [],
  });

  factory PortfolioSummary.fromJson(Map<String, dynamic> json) {
    double parseDouble(dynamic value) {
      if (value == null) return 0.0;
      if (value is num) return value.toDouble();
      if (value is String) return double.tryParse(value) ?? 0.0;
      return 0.0;
    }

    return PortfolioSummary(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      baseCurrency: json['baseCurrency'] ?? 'USD',
      totalValue: parseDouble(json['totalValue']),
      totalUnrealizedPnl: parseDouble(json['totalUnrealizedPnl']),
      totalRealizedPnl: parseDouble(json['totalRealizedPnl']),
      dailyChange: parseDouble(json['dailyChange']),
      dailyChangePercent: parseDouble(json['dailyChangePercent']),
      positions: (json['positions'] as List?)
              ?.map((e) => Position.fromJson(e))
              .toList() ??
          [],
      allocation: (json['allocation'] as List?)
              ?.map((e) => AllocationItem.fromJson(e))
              .toList() ??
          [],
      performance: (json['performance'] as List?)
              ?.map((e) => PerformancePoint.fromJson(e))
              .toList() ??
          [],
    );
  }
}

class AllocationItem {
  final String assetType;
  final double value;
  final double percentage;

  AllocationItem(
      {required this.assetType, required this.value, required this.percentage});

  factory AllocationItem.fromJson(Map<String, dynamic> json) {
    double parseDouble(dynamic value) {
      if (value == null) return 0.0;
      if (value is num) return value.toDouble();
      if (value is String) return double.tryParse(value) ?? 0.0;
      return 0.0;
    }

    return AllocationItem(
      assetType: json['assetType'] ?? '',
      value: parseDouble(json['value']),
      percentage: parseDouble(json['percentage']),
    );
  }
}

class PerformancePoint {
  final String date;
  final double value;
  final double pnl;

  PerformancePoint(
      {required this.date, required this.value, required this.pnl});

  factory PerformancePoint.fromJson(Map<String, dynamic> json) {
    double parseDouble(dynamic value) {
      if (value == null) return 0.0;
      if (value is num) return value.toDouble();
      if (value is String) return double.tryParse(value) ?? 0.0;
      return 0.0;
    }

    return PerformancePoint(
      date: json['date'] ?? '',
      value: parseDouble(json['value']),
      pnl: parseDouble(json['pnl']),
    );
  }
}
