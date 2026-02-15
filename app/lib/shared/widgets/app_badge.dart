import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

enum AppBadgeVariant {
  defaultBadge,
  success,
  destructive,
  outline,
  secondary,
  warning
}

enum AppBadgeSize { small, medium }

class AppBadge extends StatelessWidget {
  final String text;
  final AppBadgeVariant variant;
  final AppBadgeSize size;

  const AppBadge({
    super.key,
    required this.text,
    this.variant = AppBadgeVariant.defaultBadge,
    this.size = AppBadgeSize.medium,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final ext = theme.extension<AppThemeExtension>()!;

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: 10,
        vertical: size == AppBadgeSize.small ? 2 : 4,
      ),
      decoration: BoxDecoration(
        color: _getBgColor(theme, ext),
        borderRadius: BorderRadius.circular(AppRadius.pill),
        border: variant == AppBadgeVariant.outline
            ? Border.all(color: ext.cardBorder)
            : null,
      ),
      child: Text(
        text,
        style: TextStyle(
          color: _getTextColor(theme, ext),
          fontSize: size == AppBadgeSize.small ? 10 : 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Color _getBgColor(ThemeData theme, AppThemeExtension ext) {
    switch (variant) {
      case AppBadgeVariant.defaultBadge:
        return theme.primaryColor.withOpacity(0.15);
      case AppBadgeVariant.success:
        return ext.successBg;
      case AppBadgeVariant.destructive:
        return ext.dangerBg;
      case AppBadgeVariant.outline:
        return Colors.transparent;
      case AppBadgeVariant.secondary:
        return theme.brightness == Brightness.dark
            ? const Color(0xFF252540)
            : Colors.grey.shade100;
      case AppBadgeVariant.warning:
        return ext.warningBg;
    }
  }

  Color _getTextColor(ThemeData theme, AppThemeExtension ext) {
    switch (variant) {
      case AppBadgeVariant.defaultBadge:
        return theme.primaryColor;
      case AppBadgeVariant.success:
        return ext.success;
      case AppBadgeVariant.destructive:
        return ext.danger;
      case AppBadgeVariant.outline:
        return ext.textSecondary;
      case AppBadgeVariant.secondary:
        return ext.textSecondary;
      case AppBadgeVariant.warning:
        return ext.warning;
    }
  }
}
