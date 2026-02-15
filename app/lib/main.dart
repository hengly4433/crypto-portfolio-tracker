import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_provider.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/portfolio/providers/portfolio_provider.dart';
import 'features/portfolio/providers/portfolio_detail_provider.dart';
import 'features/alerts/providers/alert_provider.dart';
import 'core/models/transaction.dart';
import 'core/models/alert.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/screens/register_screen.dart';
import 'features/dashboard/screens/dashboard_screen.dart';
import 'features/portfolio/screens/portfolio_screen.dart';
import 'features/portfolio/screens/portfolio_detail_screen.dart';
import 'features/portfolio/screens/transaction_create_screen.dart';
import 'features/alerts/screens/alerts_screen.dart';
import 'features/alerts/screens/alert_create_screen.dart';
import 'features/profile/screens/profile_screen.dart';
import 'features/dashboard/providers/market_provider.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark, // Default for light theme
    systemNavigationBarColor: Colors.transparent,
  ));

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => PortfolioProvider()),
        ChangeNotifierProvider(create: (_) => PortfolioDetailProvider()),
        ChangeNotifierProvider(create: (_) => AlertProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => MarketProvider()),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, child) {
          return MaterialApp(
            title: 'Crypto Portfolio Tracker',
            debugShowCheckedModeBanner: false,
            // Use the themeMode from provider
            themeMode: themeProvider.themeMode,
            // Define light and dark themes
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            home: const AuthGate(),
            onGenerateRoute: _onGenerateRoute,
          );
        },
      ),
    );
  }

  Route<dynamic>? _onGenerateRoute(RouteSettings settings) {
    final uri = Uri.parse(settings.name ?? '');
    final segments = uri.pathSegments;

    // /portfolio/:id
    if (segments.length == 2 && segments[0] == 'portfolio') {
      return MaterialPageRoute(
        builder: (_) => PortfolioDetailScreen(portfolioId: segments[1]),
        settings: settings,
      );
    }

    // /portfolio/:id/transaction/new
    if (segments.length == 4 &&
        segments[0] == 'portfolio' &&
        segments[2] == 'transaction' &&
        segments[3] == 'new') {
      return MaterialPageRoute(
        builder: (_) => TransactionCreateScreen(portfolioId: segments[1]),
        settings: settings,
      );
    }

    // /portfolio/:id/transaction/:txId/edit
    if (segments.length == 5 &&
        segments[0] == 'portfolio' &&
        segments[2] == 'transaction' &&
        segments[4] == 'edit') {
      final args = settings.arguments as Map<String, dynamic>?;
      final tx = args?['transaction'] as Transaction?;

      return MaterialPageRoute(
        builder: (_) => TransactionCreateScreen(
          portfolioId: segments[1],
          initialTransaction: tx,
        ),
        settings: settings,
      );
    }

    // /alerts/new
    if (settings.name == '/alerts/new') {
      return MaterialPageRoute(
        builder: (_) => const AlertCreateScreen(),
        settings: settings,
      );
    }

    // /alerts/:id/edit
    if (segments.length == 3 &&
        segments[0] == 'alerts' &&
        segments[2] == 'edit') {
      final args = settings.arguments as Map<String, dynamic>?;
      final alert = args?['alert'] as AlertItem?;

      return MaterialPageRoute(
        builder: (_) => AlertCreateScreen(initialAlert: alert),
        settings: settings,
      );
    }

    return null;
  }
}

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AuthProvider>().checkAuth();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final theme = Theme.of(context);

    if (auth.isLoading) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: theme.primaryColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(AppRadius.xl),
                ),
                child: Icon(Icons.analytics_rounded,
                    size: 36, color: theme.primaryColor),
              ),
              const SizedBox(height: 24),
              CircularProgressIndicator(color: theme.primaryColor),
            ],
          ),
        ),
      );
    }

    if (auth.isAuthenticated) {
      return const MainShell();
    }

    return const AuthShell();
  }
}

class AuthShell extends StatefulWidget {
  const AuthShell({super.key});

  @override
  State<AuthShell> createState() => _AuthShellState();
}

class _AuthShellState extends State<AuthShell> {
  bool _showLogin = true;

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 300),
      child: _showLogin
          ? LoginScreen(
              key: const ValueKey('login'),
              onRegisterTap: () => setState(() => _showLogin = false))
          : RegisterScreen(
              key: const ValueKey('register'),
              onLoginTap: () => setState(() => _showLogin = true)),
    );
  }
}

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final ext = theme.extension<AppThemeExtension>()!;

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: const [
          DashboardScreen(),
          PortfolioScreen(),
          AlertsScreen(),
          ProfileScreen(),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: theme.bottomNavigationBarTheme.backgroundColor,
          border: Border(top: BorderSide(color: ext.cardBorder, width: 0.5)),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) {
            setState(() {
              _currentIndex = index;
            });
          },
          type: BottomNavigationBarType.fixed,
          backgroundColor: theme.bottomNavigationBarTheme.backgroundColor,
          selectedItemColor: theme.colorScheme.primary,
          unselectedItemColor: ext.textTertiary,
          selectedIconTheme: IconThemeData(color: theme.colorScheme.primary),
          unselectedIconTheme: IconThemeData(color: ext.textTertiary),
          selectedFontSize: 12,
          unselectedFontSize: 12,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.grid_view_outlined),
              activeIcon: Icon(Icons.grid_view_rounded),
              label: 'Dashboard',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.pie_chart_outline),
              activeIcon: Icon(Icons.pie_chart),
              label: 'Portfolios',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.notifications_none),
              activeIcon: Icon(Icons.notifications),
              label: 'Alerts',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
