import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/app_button.dart';
import '../providers/auth_provider.dart';

class RegisterScreen extends StatefulWidget {
  final VoidCallback? onLoginTap;
  const RegisterScreen({super.key, this.onLoginTap});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen>
    with SingleTickerProviderStateMixin {
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _showPassword = false;
  late AnimationController _animController;
  late Animation<double> _fadeIn;
  late Animation<Offset> _slideUp;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeIn = CurvedAnimation(parent: _animController, curve: Curves.easeOut);
    _slideUp = Tween<Offset>(
      begin: const Offset(0, 0.08),
      end: Offset.zero,
    ).animate(
        CurvedAnimation(parent: _animController, curve: Curves.easeOutCubic));
    _animController.forward();
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _animController.dispose();
    super.dispose();
  }

  void _handleRegister() async {
    final ext = Theme.of(context).extension<AppThemeExtension>()!;

    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: const Text('Please fill in all required fields'),
            backgroundColor: ext.danger,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppRadius.md))),
      );
      return;
    }
    if (_passwordController.text != _confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: const Text('Passwords do not match'),
            backgroundColor: ext.danger,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppRadius.md))),
      );
      return;
    }
    try {
      await context.read<AuthProvider>().register(
            _emailController.text.trim(),
            _passwordController.text,
            fullName: _fullNameController.text.isNotEmpty
                ? _fullNameController.text.trim()
                : null,
          );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(e.toString().replaceFirst('Exception: ', '')),
              backgroundColor: ext.danger,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppRadius.md))),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final theme = Theme.of(context);
    final ext = theme.extension<AppThemeExtension>()!;
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: isDark
                ? [
                    const Color(0xFF0F111A),
                    const Color(0xFF131628),
                    const Color(0xFF0F111A),
                  ]
                : [
                    const Color(0xFFF0F2F8),
                    const Color(0xFFF8F9FA),
                    Colors.white,
                  ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: FadeTransition(
                opacity: _fadeIn,
                child: SlideTransition(
                  position: _slideUp,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 20),

                      // Logo with glow
                      Container(
                        width: 72,
                        height: 72,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              AppColors.primary,
                              AppColors.primary.withOpacity(0.8),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(22),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withOpacity(0.35),
                              blurRadius: 24,
                              offset: const Offset(0, 8),
                              spreadRadius: 0,
                            ),
                          ],
                        ),
                        child: const Icon(Icons.analytics_rounded,
                            size: 36, color: Colors.white),
                      ),
                      const SizedBox(height: 20),
                      Text('Crypto Tracker',
                          style: theme.textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.5,
                          )),
                      const SizedBox(height: 32),

                      // Form Card
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: isDark
                              ? Colors.white.withOpacity(0.05)
                              : Colors.white,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(
                            color: isDark
                                ? Colors.white.withOpacity(0.08)
                                : Colors.grey.shade200,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: isDark
                                  ? Colors.black.withOpacity(0.3)
                                  : Colors.black.withOpacity(0.06),
                              blurRadius: 24,
                              offset: const Offset(0, 8),
                              spreadRadius: 0,
                            ),
                            if (!isDark)
                              BoxShadow(
                                color: Colors.black.withOpacity(0.02),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Create Account',
                                style: theme.textTheme.headlineSmall?.copyWith(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 22,
                                )),
                            const SizedBox(height: 4),
                            Text('Start tracking your portfolio',
                                style: theme.textTheme.bodyMedium?.copyWith(
                                    color: ext.textSecondary, fontSize: 14)),
                            const SizedBox(height: 28),

                            if (auth.error != null) ...[
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 14, vertical: 12),
                                decoration: BoxDecoration(
                                  color: ext.dangerBg,
                                  borderRadius:
                                      BorderRadius.circular(AppRadius.md),
                                  border: Border.all(
                                      color: ext.danger.withOpacity(0.2)),
                                ),
                                child: Row(children: [
                                  Icon(Icons.error_outline,
                                      size: 18, color: ext.danger),
                                  const SizedBox(width: 10),
                                  Expanded(
                                      child: Text(auth.error!,
                                          style: TextStyle(
                                              color: ext.danger,
                                              fontSize: 13,
                                              height: 1.4))),
                                ]),
                              ),
                              const SizedBox(height: 20),
                            ],

                            // Full Name
                            _FieldLabel(
                                label: 'FULL NAME', color: ext.textTertiary),
                            const SizedBox(height: 8),
                            _StyledTextField(
                              controller: _fullNameController,
                              hint: 'John Doe',
                              prefixIcon: Icons.person_outline_rounded,
                              isDark: isDark,
                              ext: ext,
                              theme: theme,
                            ),
                            const SizedBox(height: 20),

                            // Email
                            _FieldLabel(label: 'EMAIL', color: ext.textTertiary),
                            const SizedBox(height: 8),
                            _StyledTextField(
                              controller: _emailController,
                              hint: 'you@example.com',
                              keyboardType: TextInputType.emailAddress,
                              prefixIcon: Icons.mail_outline_rounded,
                              isDark: isDark,
                              ext: ext,
                              theme: theme,
                            ),
                            const SizedBox(height: 20),

                            // Password
                            _FieldLabel(
                                label: 'PASSWORD', color: ext.textTertiary),
                            const SizedBox(height: 8),
                            _StyledTextField(
                              controller: _passwordController,
                              hint: 'Create a password',
                              obscure: !_showPassword,
                              prefixIcon: Icons.lock_outline_rounded,
                              isDark: isDark,
                              ext: ext,
                              theme: theme,
                              suffixIcon: IconButton(
                                icon: Icon(
                                    _showPassword
                                        ? Icons.visibility_off_outlined
                                        : Icons.visibility_outlined,
                                    size: 19,
                                    color: ext.textTertiary),
                                onPressed: () => setState(
                                    () => _showPassword = !_showPassword),
                              ),
                            ),
                            const SizedBox(height: 20),

                            // Confirm Password
                            _FieldLabel(
                                label: 'CONFIRM PASSWORD',
                                color: ext.textTertiary),
                            const SizedBox(height: 8),
                            _StyledTextField(
                              controller: _confirmPasswordController,
                              hint: 'Confirm your password',
                              obscure: !_showPassword,
                              prefixIcon: Icons.lock_outline_rounded,
                              isDark: isDark,
                              ext: ext,
                              theme: theme,
                            ),
                            const SizedBox(height: 28),

                            // Register button
                            SizedBox(
                              width: double.infinity,
                              child: AppButton(
                                title: 'Create Account',
                                onPressed: _handleRegister,
                                loading: auth.isLoading,
                                size: AppButtonSize.large,
                              ),
                            ),
                            const SizedBox(height: 20),

                            // Login link
                            Center(
                              child: GestureDetector(
                                onTap: widget.onLoginTap,
                                child: RichText(
                                  text: TextSpan(
                                    text: 'Already have an account? ',
                                    style: TextStyle(
                                        color: ext.textSecondary, fontSize: 14),
                                    children: [
                                      TextSpan(
                                          text: 'Sign In',
                                          style: TextStyle(
                                              color: theme.primaryColor,
                                              fontWeight: FontWeight.w700)),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  final String label;
  final Color color;
  const _FieldLabel({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Text(label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: color,
          letterSpacing: 0.8,
        ));
  }
}

class _StyledTextField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final TextInputType? keyboardType;
  final bool obscure;
  final IconData prefixIcon;
  final Widget? suffixIcon;
  final bool isDark;
  final AppThemeExtension ext;
  final ThemeData theme;

  const _StyledTextField({
    required this.controller,
    required this.hint,
    this.keyboardType,
    this.obscure = false,
    required this.prefixIcon,
    this.suffixIcon,
    required this.isDark,
    required this.ext,
    required this.theme,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscure,
      style: TextStyle(
        color: theme.textTheme.bodyMedium?.color,
        fontSize: 15,
      ),
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: Padding(
          padding: const EdgeInsets.only(left: 14, right: 10),
          child: Icon(prefixIcon, size: 19, color: ext.textTertiary),
        ),
        prefixIconConstraints:
            const BoxConstraints(minWidth: 0, minHeight: 0),
        suffixIcon: suffixIcon,
        filled: true,
        fillColor:
            isDark ? Colors.white.withOpacity(0.04) : Colors.grey.shade50,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: BorderSide(
            color: isDark
                ? Colors.white.withOpacity(0.08)
                : Colors.grey.shade200,
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: BorderSide(
            color: isDark
                ? Colors.white.withOpacity(0.08)
                : Colors.grey.shade200,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: BorderSide(
              color: AppColors.primary.withOpacity(0.7), width: 1.5),
        ),
      ),
    );
  }
}
