import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

enum AppCardVariant { defaultCard, glass, elevated }

class AppCard extends StatelessWidget {
  final Widget child;
  final AppCardVariant variant;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;
  final Gradient? gradient;

  const AppCard({
    super.key,
    required this.child,
    this.variant = AppCardVariant.defaultCard,
    this.padding,
    this.onTap,
    this.gradient,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final ext = theme.extension<AppThemeExtension>()!;

    final card = Container(
      padding: padding ?? const EdgeInsets.all(16),
      margin: const EdgeInsets.symmetric(vertical: 4),
      decoration: BoxDecoration(
        color: gradient == null ? _getBgColor(theme, ext) : null,
        gradient: gradient,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: _getBorderColor(theme, ext)),
        boxShadow: _getShadow(theme),
      ),
      child: child,
    );

    if (onTap != null) {
      return GestureDetector(onTap: onTap, child: card);
    }
    return card;
  }

  Color _getBgColor(ThemeData theme, AppThemeExtension ext) {
    switch (variant) {
      case AppCardVariant.defaultCard:
        return theme.cardTheme.color!;
      case AppCardVariant.glass:
        return theme.brightness == Brightness.dark
            ? const Color(0xB31C1C2E)
            : Colors.white.withOpacity(0.8);
      case AppCardVariant.elevated:
        return theme.brightness == Brightness.dark
            ? const Color(0xFF252540)
            : Colors.white;
    }
  }

  Color _getBorderColor(ThemeData theme, AppThemeExtension ext) {
    switch (variant) {
      case AppCardVariant.defaultCard:
        return ext.cardBorder;
      case AppCardVariant.glass:
        return ext.cardBorder.withOpacity(0.5);
      case AppCardVariant.elevated:
        return ext.cardBorder;
    }
  }

  List<BoxShadow>? _getShadow(ThemeData theme) {
    final isDark = theme.brightness == Brightness.dark;
    switch (variant) {
      case AppCardVariant.defaultCard:
        return [
          BoxShadow(
              color: isDark
                  ? Colors.black.withOpacity(0.2)
                  : Colors.black.withOpacity(0.05),
              blurRadius: 4,
              offset: const Offset(0, 2))
        ];
      case AppCardVariant.elevated:
        return [
          BoxShadow(
              color: isDark
                  ? Colors.black.withOpacity(0.3)
                  : Colors.black.withOpacity(0.08),
              blurRadius: 8,
              offset: const Offset(0, 4))
        ];
      default:
        return null;
    }
  }
}
