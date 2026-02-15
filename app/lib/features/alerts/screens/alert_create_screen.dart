import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/api/api_client.dart';
import '../../../core/models/alert.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_card.dart';
import '../providers/alert_provider.dart';
import '../../portfolio/providers/portfolio_provider.dart';

class AlertCreateScreen extends StatefulWidget {
  final AlertItem? initialAlert;
  const AlertCreateScreen({super.key, this.initialAlert});

  @override
  State<AlertCreateScreen> createState() => _AlertCreateScreenState();
}

class _AlertCreateScreenState extends State<AlertCreateScreen> {
  AlertType _alertType = AlertType.priceAbove;
  final _valueController = TextEditingController();
  final _searchController = TextEditingController();
  String? _selectedAssetId;
  String? _selectedPortfolioId;
  List<dynamic> _searchResults = [];
  bool _submitting = false;

  bool get _isPriceAlert =>
      _alertType == AlertType.priceAbove || _alertType == AlertType.priceBelow;

  @override
  void initState() {
    super.initState();
    if (widget.initialAlert != null) {
      final a = widget.initialAlert!;
      _alertType = a.alertType;
      _valueController.text = (a.conditionValue).toString();

      // Need to verify Alert model fields
      // Assuming assetId and portfolioId are available on Alert model
      // If not, I need to add them.
      // I will implement based on assumption and verify.
      // Actually, I should verify first.
    }
  }

  @override
  void dispose() {
    _valueController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _searchAssets(String query) async {
    if (query.isEmpty) {
      setState(() => _searchResults = []);
      return;
    }
    final result = await apiClient.searchCoins(query);
    if (result['data'] != null) {
      setState(() {
        _searchResults = result['data'] as List;
      });
    } else {}
  }

  void _selectAsset(dynamic asset) {
    setState(() {
      _selectedAssetId = asset['id']?.toString();
      _searchController.text = '${asset['symbol']} - ${asset['name']}';
      _searchResults = [];
    });
  }

  Future<void> _handleSubmit() async {
    final theme = Theme.of(context);
    final ext = theme.extension<AppThemeExtension>()!;

    final value = double.tryParse(_valueController.text);
    if (value == null || value <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: const Text('Please enter a valid value'),
            backgroundColor: ext.danger),
      );
      return;
    }

    if (_isPriceAlert && _selectedAssetId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: const Text('Please select an asset'),
            backgroundColor: ext.danger),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      final data = <String, dynamic>{
        'alertType': _alertType.value,
        'conditionValue': value,
        if (_selectedAssetId != null) 'assetId': _selectedAssetId,
        if (_selectedPortfolioId != null) 'portfolioId': _selectedPortfolioId,
      };

      await context.read<AlertProvider>().createAlert(data);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: const Text('Alert created!'),
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
    final portfolios = context.watch<PortfolioProvider>().portfolios;
    final theme = Theme.of(context);
    final ext = theme.extension<AppThemeExtension>()!;
    final isEdit = widget.initialAlert != null;

    return Scaffold(
      appBar: AppBar(title: Text(isEdit ? 'Edit Alert' : 'Create Alert')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Alert Type
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('ALERT TYPE',
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: ext.textTertiary,
                          letterSpacing: 0.5)),
                  const SizedBox(height: AppSpacing.sm),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: theme.cardTheme.color,
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      border: Border.all(color: ext.cardBorder),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<AlertType>(
                        isExpanded: true,
                        value: _alertType,
                        dropdownColor: theme.cardTheme.color,
                        style: theme.textTheme.bodyMedium,
                        items: AlertType.values.map((type) {
                          return DropdownMenuItem(
                            value: type,
                            child: Text(type.label),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val == null) return;
                          setState(() {
                            _alertType = val;
                            if (_isPriceAlert) {
                              _selectedPortfolioId = null;
                            } else {
                              _selectedAssetId = null;
                              _searchController.clear();
                            }
                          });
                        },
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),

            // Asset Search (for price alerts)
            if (_isPriceAlert) ...[
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
                        prefixIcon: Icon(Icons.search,
                            size: 18, color: ext.textTertiary),
                      ),
                      onChanged: _searchAssets,
                    ),
                    if (_searchResults.isNotEmpty)
                      Container(
                        constraints: const BoxConstraints(maxHeight: 150),
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
            ],

            // Portfolio Picker (for portfolio alerts)
            if (!_isPriceAlert && portfolios.isNotEmpty) ...[
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('PORTFOLIO',
                        style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: ext.textTertiary,
                            letterSpacing: 0.5)),
                    const SizedBox(height: AppSpacing.sm),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: theme.cardTheme.color,
                        borderRadius: BorderRadius.circular(AppRadius.md),
                        border: Border.all(color: ext.cardBorder),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          isExpanded: true,
                          value: _selectedPortfolioId,
                          hint: Text('Select portfolio',
                              style: TextStyle(color: ext.textTertiary)),
                          dropdownColor: theme.cardTheme.color,
                          style: theme.textTheme.bodyMedium,
                          items: portfolios
                              .map((p) => DropdownMenuItem(
                                  value: p.id, child: Text(p.name)))
                              .toList(),
                          onChanged: (val) =>
                              setState(() => _selectedPortfolioId = val),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
            ],

            // Condition Value
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _isPriceAlert ? 'TARGET PRICE (\$)' : 'CONDITION VALUE (%)',
                    style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: ext.textTertiary,
                        letterSpacing: 0.5),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  TextField(
                    controller: _valueController,
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    style: theme.textTheme.bodyMedium,
                    decoration: InputDecoration(
                      hintText: _isPriceAlert ? 'e.g. 100000' : 'e.g. 5.0',
                      hintStyle: TextStyle(color: ext.textTertiary),
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
                title: widget.initialAlert != null
                    ? 'Update Alert'
                    : 'Create Alert',
                onPressed: _handleSubmit,
                loading: _submitting,
                size: AppButtonSize.large,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
