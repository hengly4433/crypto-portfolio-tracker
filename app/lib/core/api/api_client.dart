import 'package:dio/dio.dart';
import '../storage/secure_storage.dart';
import '../models/user.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late final Dio _dio;
  final SecureStorage _storage = SecureStorage();
  String? _token;

  // Default to localhost, can be overridden via env
  static const String _defaultBaseUrl = 'http://localhost:3001/api';

  ApiClient._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: _defaultBaseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {'Content-Type': 'application/json'},
      ),
    );

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        _token ??= await _storage.getAccessToken();
        if (_token != null) {
          options.headers['Authorization'] = 'Bearer $_token';
        }
        handler.next(options);
      },
      onError: (DioException error, handler) async {
        if (error.response?.statusCode == 401 &&
            _token != null &&
            !error.requestOptions.path.contains('/auth/login') &&
            !error.requestOptions.path.contains('/auth/refresh')) {
          try {
            final refreshToken = await _storage.getRefreshToken();
            if (refreshToken == null) {
              await logout();
              return handler.next(error);
            }

            // Attempt to refresh token
            final response = await _dio.post(
              '/auth/refresh',
              data: {'refreshToken': refreshToken},
            );

            if (response.statusCode == 200 && response.data != null) {
              final newAccessToken = response.data['accessToken'];
              final newRefreshToken = response.data['refreshToken'];

              if (newAccessToken != null && newRefreshToken != null) {
                await _storage.saveTokens(
                  accessToken: newAccessToken,
                  refreshToken: newRefreshToken,
                );
                _token = newAccessToken;

                // Update the failed request's header with new token
                error.requestOptions.headers['Authorization'] =
                    'Bearer $newAccessToken';

                // Retry the request
                final cloneReq = await _dio.fetch(error.requestOptions);
                return handler.resolve(cloneReq);
              }
            }
          } catch (e) {
            // Refresh failed, user must login again
            await logout();
            return handler.next(error);
          }
        }
        handler.next(error);
      },
    ));
  }

  void setBaseUrl(String url) {
    _dio.options.baseUrl = url;
  }

  // ─── Auth ──────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> register(String email, String password,
      {String? fullName}) async {
    try {
      final response = await _dio.post('/auth/register', data: {
        'email': email,
        'password': password,
        if (fullName != null) 'fullName': fullName,
      });
      final data = response.data;
      if (data['tokens'] != null) {
        final tokens = AuthTokens.fromJson(data['tokens']);
        await _storage.saveTokens(
            accessToken: tokens.accessToken, refreshToken: tokens.refreshToken);
        _token = tokens.accessToken;
      }
      return {'data': data};
    } on DioException catch (e) {
      return {'error': e.response?.data?['message'] ?? e.message};
    }
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });
      final data = response.data;
      if (data['tokens'] != null) {
        final tokens = AuthTokens.fromJson(data['tokens']);
        await _storage.saveTokens(
            accessToken: tokens.accessToken, refreshToken: tokens.refreshToken);
        _token = tokens.accessToken;
      }
      return {'data': data};
    } on DioException catch (e) {
      return {'error': e.response?.data?['message'] ?? e.message};
    }
  }

  Future<void> logout() async {
    await _storage.clearTokens();
    _token = null;
  }

  Future<Map<String, dynamic>> getCurrentUser() async {
    try {
      final response = await _dio.get('/users/me');
      return {'data': response.data};
    } on DioException catch (e) {
      return {'error': e.response?.data?['message'] ?? e.message};
    }
  }

  // ─── Portfolios ────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getPortfolios() async {
    try {
      final response = await _dio.get('/portfolios');
      return {'data': response.data};
    } on DioException catch (e) {
      return {'error': e.response?.data?['message'] ?? e.message};
    }
  }

  Future<Map<String, dynamic>> createPortfolio(String name,
      {String baseCurrency = 'USD'}) async {
    try {
      final response = await _dio.post('/portfolios', data: {
        'name': name,
        'baseCurrency': baseCurrency,
      });
      return {'data': response.data};
    } on DioException catch (e) {
      return {'error': e.response?.data?['message'] ?? e.message};
    }
  }

  Future<Map<String, dynamic>> getPortfolio(String id) async {
    try {
      final response = await _dio.get('/portfolios/$id');
      return {'data': response.data};
    } on DioException catch (e) {
      return {'error': e.response?.data?['message'] ?? e.message};
    }
  }

  Future<Map<String, dynamic>> getPortfolioSummary(String id) async {
    try {
      final response = await _dio.get('/portfolios/$id/summary');
      return {'data': response.data};
    } on DioException catch (e) {
      return {'error': e.response?.data?['message'] ?? e.message};
    }
  }

  Future<Map<String, dynamic>> getPortfolioTransactions(String id) async {
    try {
      final response = await _dio.get('/portfolios/$id/transactions');
      return {'data': response.data};
    } on DioException catch (e) {
      return {'error': e.response?.data?['message'] ?? e.message};
    }
  }

  Future<Map<String, dynamic>> createTransaction(
      String portfolioId, Map<String, dynamic> data) async {
    try {
      final response =
          await _dio.post('/portfolios/$portfolioId/transactions', data: data);
      return {'data': response.data};
    } on DioException catch (e) {
      return {'error': e.response?.data?['message'] ?? e.message};
    }
  }

  Future<Map<String, dynamic>> updateTransaction(String transactionId,
      String portfolioId, Map<String, dynamic> data) async {
    try {
      final response = await _dio.put(
          '/portfolios/$portfolioId/transactions/$transactionId',
          data: data);
      return {'data': response.data};
    } on DioException catch (e) {
      return {'error': e.response?.data?['message'] ?? e.message};
    }
  }

  Future<Map<String, dynamic>> deleteTransaction(
      String transactionId, String portfolioId) async {
    try {
      await _dio.delete('/portfolios/$portfolioId/transactions/$transactionId');
      return {'data': null};
    } on DioException catch (e) {
      return {'error': e.response?.data?['message'] ?? e.message};
    }
  }

  Future<Map<String, dynamic>> updatePortfolio(String id, String name,
      {String? baseCurrency}) async {
    try {
      final response = await _dio.put('/portfolios/$id', data: {
        'name': name,
        if (baseCurrency != null) 'baseCurrency': baseCurrency,
      });
      return {'data': response.data};
    } on DioException catch (e) {
      return {'error': e.response?.data?['message'] ?? e.message};
    }
  }

  Future<Map<String, dynamic>> deletePortfolio(String id) async {
    try {
      await _dio.delete('/portfolios/$id');
      return {'data': null};
    } on DioException catch (e) {
      return {'error': e.response?.data?['message'] ?? e.message};
    }
  }

  // ─── Alerts ────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getAlerts() async {
    try {
      final response = await _dio.get('/alerts');
      return {'data': response.data};
    } on DioException catch (e) {
      return {'error': e.response?.data?['message'] ?? e.message};
    }
  }

  Future<Map<String, dynamic>> createAlert(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/alerts', data: data);
      return {'data': response.data};
    } on DioException catch (e) {
      return {'error': e.response?.data?['message'] ?? e.message};
    }
  }

  Future<Map<String, dynamic>> updateAlert(
      String id, Map<String, dynamic> data) async {
    try {
      final response = await _dio.put('/alerts/$id', data: data);
      return {'data': response.data};
    } on DioException catch (e) {
      return {'error': e.response?.data?['message'] ?? e.message};
    }
  }

  Future<Map<String, dynamic>> deleteAlert(String id) async {
    try {
      await _dio.delete('/alerts/$id');
      return {'data': null};
    } on DioException catch (e) {
      return {'error': e.response?.data?['message'] ?? e.message};
    }
  }

  // ─── Assets ────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> getAssets({String? query}) async {
    try {
      final response = await _dio.get('/assets', queryParameters: {
        if (query != null && query.isNotEmpty) 'search': query,
      });
      return {'data': response.data};
    } on DioException catch (e) {
      return {'error': e.response?.data?['message'] ?? e.message};
    }
  }

  // ─── Market Data ───────────────────────────────────────────────────

  Future<Map<String, dynamic>> getMarketData({
    List<String>? ids,
    String currency = 'usd',
    bool sparkline = false,
  }) async {
    try {
      final response = await _dio.get('/prices/market-data', queryParameters: {
        if (ids != null && ids.isNotEmpty) 'ids': ids.join(','),
        'currency': currency,
        'sparkline': sparkline,
      });
      return {'data': response.data};
    } on DioException catch (e) {
      return {'error': e.response?.data?['message'] ?? e.message};
    }
  }

  Future<Map<String, dynamic>> searchCoins(String query) async {
    try {
      final response = await _dio.get('/prices/search', queryParameters: {
        'q': query,
      });
      return {'data': response.data};
    } on DioException catch (e) {
      return {'error': e.response?.data?['message'] ?? e.message};
    }
  }

  Future<Map<String, dynamic>> getPriceHistory(String assetId,
      {String interval = '1d'}) async {
    try {
      final response =
          await _dio.get('/prices/$assetId/history', queryParameters: {
        'interval': interval,
      });
      return {'data': response.data};
    } on DioException catch (e) {
      return {'error': e.response?.data?['message'] ?? e.message};
    }
  }

  bool isAuthenticated() => _token != null;
}

final apiClient = ApiClient();
