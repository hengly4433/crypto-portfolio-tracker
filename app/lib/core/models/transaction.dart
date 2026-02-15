class Transaction {
  final String id;
  final String side;
  final double quantity;
  final double price;
  final String transactionCurrency;
  final double grossAmount;
  final double feeAmount;
  final String? feeCurrency;
  final String tradeTime;
  final String assetId;
  final String assetSymbol;
  final String assetName;

  Transaction({
    required this.id,
    required this.side,
    required this.quantity,
    required this.price,
    required this.transactionCurrency,
    this.grossAmount = 0,
    this.feeAmount = 0,
    this.feeCurrency,
    required this.tradeTime,
    required this.assetId,
    required this.assetSymbol,
    required this.assetName,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    double parseDouble(dynamic value) {
      if (value == null) return 0.0;
      if (value is num) return value.toDouble();
      if (value is String) return double.tryParse(value) ?? 0.0;
      return 0.0;
    }

    return Transaction(
      id: json['id']?.toString() ?? '',
      side: json['side'] ?? '',
      quantity: parseDouble(json['quantity']),
      price: parseDouble(json['price']),
      transactionCurrency: json['transactionCurrency'] ?? 'USD',
      grossAmount: parseDouble(json['grossAmount']),
      feeAmount: parseDouble(json['feeAmount']),
      feeCurrency: json['feeCurrency'],
      tradeTime: json['tradeTime'] ?? '',
      assetId: json['assetId']?.toString() ?? '',
      assetSymbol: json['assetSymbol'] ?? json['asset']?['symbol'] ?? '',
      assetName: json['assetName'] ?? json['asset']?['name'] ?? '',
    );
  }
}
