import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';
import '../../../core/models/portfolio.dart';

class PortfolioProvider extends ChangeNotifier {
  List<Portfolio> _portfolios = [];
  bool _isLoading = false;
  String? _error;
  double _totalValue = 0;
  double _totalPnl = 0;
  double _totalPnlPercent = 0;

  List<Portfolio> get portfolios => _portfolios;
  bool get isLoading => _isLoading;
  String? get error => _error;
  double get totalValue => _totalValue;
  double get totalPnl => _totalPnl;
  double get totalPnlPercent => _totalPnlPercent;

  Future<void> fetchPortfolios() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await apiClient.getPortfolios();
      if (result['error'] != null) {
        _error = result['error'];
        _isLoading = false;
        notifyListeners();
        return;
      }
      if (result['data'] != null) {
        _portfolios =
            (result['data'] as List).map((e) => Portfolio.fromJson(e)).toList();
        _calculateTotals();
      }
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> createPortfolio(String name,
      {String baseCurrency = 'USD'}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result =
          await apiClient.createPortfolio(name, baseCurrency: baseCurrency);
      if (result['error'] != null) {
        _error = result['error'];
        _isLoading = false;
        notifyListeners();
        throw Exception(_error);
      }
      if (result['data'] != null) {
        _portfolios.add(Portfolio.fromJson(result['data']));
        _calculateTotals();
      }
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      notifyListeners();
      rethrow;
    }
  }

  Future<void> updatePortfolio(String id, String name,
      {String? baseCurrency}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result =
          await apiClient.updatePortfolio(id, name, baseCurrency: baseCurrency);
      if (result['error'] != null) {
        _error = result['error'];
        _isLoading = false;
        notifyListeners();
        return;
      }
      if (result['data'] != null) {
        final index = _portfolios.indexWhere((p) => p.id == id);
        if (index != -1) {
          _portfolios[index] = Portfolio.fromJson(result['data']);
          _calculateTotals();
        } else {
          await fetchPortfolios();
        }
      }
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> deletePortfolio(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await apiClient.deletePortfolio(id);
      if (result['error'] != null) {
        _error = result['error'];
        _isLoading = false;
        notifyListeners();
        return;
      }
      _portfolios.removeWhere((p) => p.id == id);
      _calculateTotals();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  void _calculateTotals() {
    _totalValue = _portfolios.fold(0, (sum, p) => sum + p.totalValue);
    final totalUnrealized =
        _portfolios.fold<double>(0, (sum, p) => sum + p.totalUnrealizedPnl);
    _totalPnl = _portfolios.fold<double>(
        0, (sum, p) => sum + p.totalUnrealizedPnl + p.totalRealizedPnl);
    final totalCost = _totalValue - totalUnrealized;
    _totalPnlPercent = totalCost == 0 ? 0 : (_totalPnl / totalCost) * 100;
  }
}
