import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';
import '../../../core/models/alert.dart';

class AlertProvider extends ChangeNotifier {
  List<AlertItem> _alerts = [];
  bool _isLoading = false;
  String? _error;

  List<AlertItem> get alerts => _alerts;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchAlerts() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await apiClient.getAlerts();
      if (result['error'] != null) {
        _error = result['error'];
        _isLoading = false;
        notifyListeners();
        return;
      }
      if (result['data'] != null) {
        _alerts =
            (result['data'] as List).map((e) => AlertItem.fromJson(e)).toList();
      }
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> createAlert(Map<String, dynamic> data) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await apiClient.createAlert(data);
      if (result['error'] != null) {
        _error = result['error'];
        _isLoading = false;
        notifyListeners();
        throw Exception(_error);
      }
      await fetchAlerts();
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> toggleAlert(String id, bool isActive) async {
    // Optimistic update
    final idx = _alerts.indexWhere((a) => a.id == id);
    if (idx >= 0) {
      _alerts[idx] = _alerts[idx].copyWith(isActive: isActive);
      notifyListeners();
    }

    try {
      final result = await apiClient.updateAlert(id, {'isActive': isActive});
      if (result['error'] != null) {
        // Revert on failure
        if (idx >= 0) {
          _alerts[idx] = _alerts[idx].copyWith(isActive: !isActive);
          notifyListeners();
        }
      }
    } catch (e) {
      if (idx >= 0) {
        _alerts[idx] = _alerts[idx].copyWith(isActive: !isActive);
        notifyListeners();
      }
    }
  }

  Future<void> deleteAlert(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await apiClient.deleteAlert(id);
      if (result['error'] != null) {
        _error = result['error'];
        _isLoading = false;
        notifyListeners();
        return;
      }
      _alerts.removeWhere((a) => a.id == id);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }
}
