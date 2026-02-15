import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_dialog.dart';
import '../../auth/providers/auth_provider.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final themeProvider = context.watch<ThemeProvider>();
    final user = auth.user;
    final theme = Theme.of(context);
    final ext = theme.extension<AppThemeExtension>()!;

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.xl),
          children: [
            Text('Profile', style: theme.textTheme.headlineMedium),
            const SizedBox(height: AppSpacing.xxl),

            // Avatar
            Center(
              child: Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: theme.primaryColor.withOpacity(0.12),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    (user?.fullName ?? user?.email ?? 'U')[0].toUpperCase(),
                    style: TextStyle(
                      color: theme.primaryColor,
                      fontSize: 32,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Center(
              child: Text(
                user?.fullName ?? 'User',
                style: theme.textTheme.headlineSmall,
              ),
            ),
            Center(
              child: Text(
                user?.email ?? '',
                style: theme.textTheme.bodySmall
                    ?.copyWith(color: ext.textSecondary),
              ),
            ),
            const SizedBox(height: AppSpacing.xxxl),

            // Info Cards
            AppCard(
              child: Column(
                children: [
                  _buildInfoRow(
                      context, Icons.mail_outline, 'Email', user?.email ?? '-'),
                  Divider(color: ext.cardBorder, height: 24),
                  _buildInfoRow(context, Icons.person_outline, 'Full Name',
                      user?.fullName ?? '-'),
                  if (user?.country != null) ...[
                    Divider(color: ext.cardBorder, height: 24),
                    _buildInfoRow(
                        context, Icons.public, 'Country', user!.country!),
                  ],
                  Divider(color: ext.cardBorder, height: 24),
                  _buildInfoRow(context, Icons.calendar_today_outlined,
                      'Member Since', _formatDate(user?.createdAt ?? '')),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),

            // Appearance Card
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('APPEARANCE',
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: ext.textTertiary,
                          letterSpacing: 0.5)),
                  const SizedBox(height: AppSpacing.md),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(
                            themeProvider.isDarkMode
                                ? Icons.dark_mode_outlined
                                : Icons.light_mode_outlined,
                            size: 20,
                            color: ext.textSecondary,
                          ),
                          const SizedBox(width: AppSpacing.md),
                          Text(
                            themeProvider.isDarkMode
                                ? 'Dark Mode'
                                : 'Light Mode',
                            style: theme.textTheme.bodyMedium
                                ?.copyWith(fontWeight: FontWeight.w500),
                          ),
                        ],
                      ),
                      Switch(
                        value: themeProvider.isDarkMode,
                        onChanged: (_) => themeProvider.toggleTheme(),
                        thumbColor:
                            MaterialStateProperty.all(theme.primaryColor),
                        trackColor: MaterialStateProperty.resolveWith((states) {
                          if (states.contains(MaterialState.selected)) {
                            return theme.primaryColor.withOpacity(0.5);
                          }
                          return Colors.grey[300];
                        }),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xxxl),

            // Logout button
            SizedBox(
              width: double.infinity,
              child: AppButton(
                title: 'Sign Out',
                onPressed: () {
                  showAppDialog(
                    context: context,
                    type: AppDialogType.warning,
                    icon: Icons.logout_rounded,
                    title: 'Sign Out',
                    message:
                        'Are you sure you want to sign out of your account?',
                    confirmLabel: 'Sign Out',
                    onConfirm: () async {
                      if (context.mounted) {
                        await context.read<AuthProvider>().logout();
                      }
                    },
                  );
                },
                variant: AppButtonVariant.destructive,
                size: AppButtonSize.large,
                icon: const Icon(Icons.logout, color: Colors.white, size: 18),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(
      BuildContext context, IconData icon, String label, String value) {
    final theme = Theme.of(context);
    final ext = theme.extension<AppThemeExtension>()!;

    return Row(
      children: [
        Icon(icon, size: 20, color: ext.textTertiary),
        const SizedBox(width: AppSpacing.md),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style: TextStyle(color: ext.textTertiary, fontSize: 12)),
            const SizedBox(height: 2),
            Text(value,
                style: theme.textTheme.bodyMedium
                    ?.copyWith(fontWeight: FontWeight.w500, fontSize: 15)),
          ],
        ),
      ],
    );
  }

  String _formatDate(String dateStr) {
    if (dateStr.isEmpty) return '-';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return dateStr;
    }
  }
}
