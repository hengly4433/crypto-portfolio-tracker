import 'package:flutter/material.dart';
import '../../../core/api/api_client.dart';
import '../../../core/models/user.dart';
import '../../../core/storage/secure_storage.dart';

class AuthProvider extends ChangeNotifier {
  User? _user;
  bool _isAuthenticated = false;
  bool _isLoading = false;
  String? _error;

  User? get user => _user;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await apiClient.login(email, password);
      if (result['error'] != null) {
        _error = result['error'];
        _isLoading = false;
        notifyListeners();
        throw Exception(_error);
      }
      if (result['data'] != null) {
        _user = User.fromJson(result['data']['user']);
        _isAuthenticated = true;
      }
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString().replaceFirst('Exception: ', '');
      notifyListeners();
      rethrow;
    }
  }

  Future<void> register(String email, String password,
      {String? fullName}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result =
          await apiClient.register(email, password, fullName: fullName);
      if (result['error'] != null) {
        _error = result['error'];
        _isLoading = false;
        notifyListeners();
        throw Exception(_error);
      }
      if (result['data'] != null) {
        _user = User.fromJson(result['data']['user']);
        _isAuthenticated = true;
      }
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString().replaceFirst('Exception: ', '');
      notifyListeners();
      rethrow;
    }
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    await apiClient.logout();
    _user = null;
    _isAuthenticated = false;
    _isLoading = false;
    _error = null;
    notifyListeners();
  }

  Future<void> checkAuth() async {
    _isLoading = true;
    notifyListeners();

    final hasToken = await SecureStorage().hasToken();
    if (!hasToken) {
      _user = null;
      _isAuthenticated = false;
      _isLoading = false;
      notifyListeners();
      return;
    }

    final result = await apiClient.getCurrentUser();
    if (result['error'] != null) {
      _user = null;
      _isAuthenticated = false;
    } else if (result['data'] != null) {
      _user = User.fromJson(result['data']);
      _isAuthenticated = true;
    }
    _isLoading = false;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
