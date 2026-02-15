import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/api/api_client.dart';
import '../../../core/models/transaction.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../providers/portfolio_detail_provider.dart';

class TransactionCreateScreen extends StatefulWidget {
  final String portfolioId;
  final Transaction? initialTransaction;

  const TransactionCreateScreen({
    super.key,
    required this.portfolioId,
    this.initialTransaction,
  });

  @override
  State<TransactionCreateScreen> createState() =>
      _TransactionCreateScreenState();
}

class _TransactionCreateScreenState extends State<TransactionCreateScreen> {
  String _side = 'BUY';
  final _quantityController = TextEditingController();
  final _priceController = TextEditingController();
  final _feeController = TextEditingController(text: '0');
  final _searchController = TextEditingController();
  DateTime _tradeDate = DateTime.now();
  String? _selectedAssetId;
  String? _selectedAssetSymbol;
  String? _selectedAssetName;
  List<dynamic> _searchResults = [];
  bool _searching = false;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialTransaction != null) {
      final tx = widget.initialTransaction!;
      _side = tx.side;
      _quantityController.text = tx.quantity.toString();
      _priceController.text = tx.price.toString();
      _feeController.text = tx.feeAmount.toString();
      _tradeDate = DateTime.tryParse(tx.tradeTime) ?? DateTime.now();
      _selectedAssetId = tx.assetId;
      _selectedAssetSymbol = tx.assetSymbol;
      // tx.assetName might not exist in Transaction model flat properties?
      // Provider usually maps asset details.
      // Let's check Transaction model later. Assuming assetSymbol is there.
      // Or tx.asset?.symbol if it's nested.
      // I'll assume flattened properties or safe defaults.
      _searchController.text = _selectedAssetSymbol ?? '';
    }
  }

  @override
  void dispose() {
    _quantityController.dispose();
    _priceController.dispose();
    _feeController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  double get _totalAmount {
    final qty = double.tryParse(_quantityController.text) ?? 0;
    final price = double.tryParse(_priceController.text) ?? 0;
    final fee = double.tryParse(_feeController.text) ?? 0;
    return (qty * price) + fee;
  }

  Future<void> _searchAssets(String query) async {
    if (query.isEmpty) {
      setState(() => _searchResults = []);
      return;
    }
    setState(() => _searching = true);
    final result = await apiClient.searchCoins(query);
    if (result['data'] != null) {
      setState(() {
        _searchResults = result['data'] as List;
        _searching = false;
      });
    } else {
      setState(() => _searching = false);
    }
  }

  void _selectAsset(dynamic asset) {
    setState(() {
      _selectedAssetId = asset['id']?.toString();
      _selectedAssetSymbol = asset['symbol'] ?? '';
      _selectedAssetName = asset['name'] ?? '';
      _searchController.text = '$_selectedAssetSymbol - $_selectedAssetName';
      _searchResults = [];
    });
  }

  Future<void> _selectDate() async {
    final theme = Theme.of(context);
    final picked = await showDatePicker(
      context: context,
      initialDate: _tradeDate,
      firstDate: DateTime(2010),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: theme.copyWith(
            colorScheme: theme.colorScheme.copyWith(
                primary: theme.primaryColor, surface: theme.cardTheme.color),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) setState(() => _tradeDate = picked);
  }

  Future<void> _handleSubmit() async {
    final ext = Theme.of(context).extension<AppThemeExtension>()!;

    if (_selectedAssetId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: const Text('Please select an asset'),
            backgroundColor: ext.danger),
      );
      return;
    }
    final qty = double.tryParse(_quantityController.text);
    final price = double.tryParse(_priceController.text);
    if (qty == null || qty <= 0 || price == null || price < 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: const Text('Please enter valid quantity and price'),
            backgroundColor: ext.danger),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      final data = {
        'assetId': _selectedAssetId,
        'side': _side,
        'quantity': qty,
        'price': price,
        'feeAmount': double.tryParse(_feeController.text) ?? 0,
        'date': _tradeDate.toUtc().toIso8601String(),
        'transactionCurrency': 'USD',
      };

      if (widget.initialTransaction != null) {
        await context.read<PortfolioDetailProvider>().updateTransaction(
            widget.initialTransaction!.id, widget.portfolioId, data);
      } else {
        await context
            .read<PortfolioDetailProvider>()
            .createTransaction(widget.portfolioId, data);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(widget.initialTransaction != null
                  ? 'Transaction updated!'
                  : 'Transaction created!'),
              backgroundColor: ext.success),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(e.toString().replaceFirst('Exception: ', '')),
              backgroundColor: ext.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormat =
        NumberFormat.currency(symbol: '\$', decimalDigits: 2);
    final theme = Theme.of(context);
    final ext = theme.extension<AppThemeExtension>()!;
    final isEdit = widget.initialTransaction != null;

    return Scaffold(
      appBar:
          AppBar(title: Text(isEdit ? 'Edit Transaction' : 'New Transaction')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Side Toggle
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('TRANSACTION TYPE',
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: ext.textTertiary,
                          letterSpacing: 0.5)),
                  const SizedBox(height: AppSpacing.md),
                  Row(children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _side = 'BUY'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: _side == 'BUY'
                                ? ext.successBg
                                : theme.cardTheme.color,
                            borderRadius: BorderRadius.circular(AppRadius.md),
                            border: Border.all(
                                color: _side == 'BUY'
                                    ? ext.success
                                    : ext.cardBorder),
                          ),
                          child: Center(
                              child: Text('BUY',
                                  style: TextStyle(
                                    color: _side == 'BUY'
                                        ? ext.success
                                        : ext.textTertiary,
                                    fontWeight: FontWeight.w700,
                                  ))),
                        ),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _side = 'SELL'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: _side == 'SELL'
                                ? ext.dangerBg
                                : theme.cardTheme.color,
                            borderRadius: BorderRadius.circular(AppRadius.md),
                            border: Border.all(
                                color: _side == 'SELL'
                                    ? ext.danger
                                    : ext.cardBorder),
                          ),
                          child: Center(
                              child: Text('SELL',
                                  style: TextStyle(
                                    color: _side == 'SELL'
                                        ? ext.danger
                                        : ext.textTertiary,
                                    fontWeight: FontWeight.w700,
                                  ))),
                        ),
                      ),
                    ),
                  ]),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),

            // Asset Search
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('ASSET',
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: ext.textTertiary,
                          letterSpacing: 0.5)),
                  const SizedBox(height: AppSpacing.sm),
                  TextField(
                    controller: _searchController,
                    style: theme.textTheme.bodyMedium,
                    decoration: InputDecoration(
                      hintText: 'Search for a coin...',
                      hintStyle: TextStyle(color: ext.textTertiary),
                      prefixIcon:
                          Icon(Icons.search, size: 18, color: ext.textTertiary),
                      suffixIcon: _searching
                          ? Padding(
                              padding: const EdgeInsets.all(12),
                              child: SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: theme.primaryColor)),
                            )
                          : null,
                    ),
                    onChanged: _searchAssets,
                  ),
                  if (_searchResults.isNotEmpty)
                    Container(
                      constraints: const BoxConstraints(maxHeight: 200),
                      margin: const EdgeInsets.only(top: 8),
                      decoration: BoxDecoration(
                        color: theme.cardTheme.color,
                        borderRadius: BorderRadius.circular(AppRadius.md),
                        border: Border.all(color: ext.cardBorder),
                      ),
                      child: ListView.builder(
                        shrinkWrap: true,
                        itemCount: _searchResults.length,
                        itemBuilder: (ctx, i) {
                          final asset = _searchResults[i];
                          return ListTile(
                            dense: true,
                            leading: (asset['thumb'] != null &&
                                    asset['thumb'].toString().isNotEmpty)
                                ? Image.network(
                                    asset['thumb'],
                                    width: 24,
                                    height: 24,
                                    errorBuilder:
                                        (context, error, stackTrace) => Icon(
                                            Icons.monetization_on,
                                            size: 24,
                                            color: ext.textTertiary),
                                  )
                                : Icon(Icons.monetization_on,
                                    size: 24, color: ext.textTertiary),
                            title: Text(asset['symbol'] ?? '',
                                style: theme.textTheme.bodyMedium
                                    ?.copyWith(fontWeight: FontWeight.w600)),
                            subtitle: Text(asset['name'] ?? '',
                                style: TextStyle(
                                    color: ext.textTertiary, fontSize: 12)),
                            onTap: () => _selectAsset(asset),
                          );
                        },
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),

            // Quantity & Price
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('DETAILS',
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: ext.textTertiary,
                          letterSpacing: 0.5)),
                  const SizedBox(height: AppSpacing.md),
                  _buildField('Quantity', _quantityController, 'e.g. 0.5'),
                  const SizedBox(height: AppSpacing.md),
                  _buildField(
                      'Price per Unit (\$)', _priceController, 'e.g. 50000'),
                  const SizedBox(height: AppSpacing.md),
                  _buildField('Fee (\$)', _feeController, '0.00'),
                  const SizedBox(height: AppSpacing.md),
                  Text('TRADE DATE',
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: ext.textTertiary,
                          letterSpacing: 0.5)),
                  const SizedBox(height: AppSpacing.sm),
                  GestureDetector(
                    onTap: _selectDate,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 14),
                      decoration: BoxDecoration(
                        color: theme.cardTheme.color,
                        borderRadius: BorderRadius.circular(AppRadius.md),
                        border: Border.all(color: ext.cardBorder),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.calendar_today,
                              size: 16, color: ext.textTertiary),
                          const SizedBox(width: 8),
                          Text(
                            DateFormat('MMM d, yyyy').format(_tradeDate),
                            style: theme.textTheme.bodyMedium
                                ?.copyWith(fontSize: 15),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),

            // Total Preview
            AppCard(
              variant: AppCardVariant.elevated,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Total Amount',
                      style: theme.textTheme.bodySmall?.copyWith(fontSize: 14)),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: Text(
                      currencyFormat.format(_totalAmount),
                      key: ValueKey(_totalAmount),
                      style: TextStyle(
                        color: _side == 'BUY' ? ext.danger : ext.success,
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xxl),

            // Submit
            SizedBox(
              width: double.infinity,
              child: AppButton(
                title:
                    '${_side == 'BUY' ? 'Buy' : 'Sell'} ${_selectedAssetSymbol ?? 'Asset'}',
                onPressed: _handleSubmit,
                loading: _submitting,
                size: AppButtonSize.large,
              ),
            ),
            const SizedBox(height: AppSpacing.xxl),
          ],
        ),
      ),
    );
  }

  Widget _buildField(
      String label, TextEditingController controller, String hint) {
    final theme = Theme.of(context);
    final ext = theme.extension<AppThemeExtension>()!;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(),
            style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: ext.textTertiary,
                letterSpacing: 0.5)),
        const SizedBox(height: AppSpacing.sm),
        TextField(
          controller: controller,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          style: theme.textTheme.bodyMedium,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: ext.textTertiary),
          ),
          onChanged: (_) => setState(() {}),
        ),
      ],
    );
  }
}
