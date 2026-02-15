import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';
import '../../../core/models/portfolio.dart';
import '../../../core/models/transaction.dart' as tx;

class PortfolioDetailProvider extends ChangeNotifier {
  PortfolioSummary? _summary;
  List<Position> _positions = [];
  List<tx.Transaction> _transactions = [];
  bool _isLoading = false;
  String? _error;

  PortfolioSummary? get summary => _summary;
  List<Position> get positions => _positions;
  List<tx.Transaction> get transactions => _transactions;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchSummary(String portfolioId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await apiClient.getPortfolioSummary(portfolioId);
      if (result['error'] != null) {
        _error = result['error'];
        _isLoading = false;
        notifyListeners();
        return;
      }
      if (result['data'] != null) {
        _summary = PortfolioSummary.fromJson(result['data']);
        _positions = _summary!.positions;
      }
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchTransactions(String portfolioId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await apiClient.getPortfolioTransactions(portfolioId);
      if (result['error'] != null) {
        _error = result['error'];
        _isLoading = false;
        notifyListeners();
        return;
      }
      if (result['data'] != null) {
        var txList = [];
        // Backend returns paginated response: { data: [...], pagination: ... }
        if (result['data'] is Map && result['data']['data'] is List) {
          txList = result['data']['data'];
        } else if (result['data'] is List) {
          // Fallback if backend returns direct list
          txList = result['data'];
        }

        _transactions = txList.map((e) => tx.Transaction.fromJson(e)).toList();
      }
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> createTransaction(
      String portfolioId, Map<String, dynamic> data) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await apiClient.createTransaction(portfolioId, data);
      if (result['error'] != null) {
        _error = result['error'];
        _isLoading = false;
        notifyListeners();
        throw Exception(_error);
      }
      await fetchSummary(portfolioId);
      await fetchTransactions(portfolioId);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> updateTransaction(String transactionId, String portfolioId,
      Map<String, dynamic> data) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result =
          await apiClient.updateTransaction(transactionId, portfolioId, data);
      if (result['error'] != null) {
        _error = result['error'];
        _isLoading = false;
        notifyListeners();
        return;
      }
      await fetchSummary(portfolioId);
      await fetchTransactions(portfolioId);
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> deleteTransaction(
      String transactionId, String portfolioId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result =
          await apiClient.deleteTransaction(transactionId, portfolioId);
      if (result['error'] != null) {
        _error = result['error'];
        _isLoading = false;
        notifyListeners();
        return;
      }
      await fetchSummary(portfolioId);
      await fetchTransactions(portfolioId);
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  void clearData() {
    _summary = null;
    _positions = [];
    _transactions = [];
    _error = null;
    notifyListeners();
  }
}
