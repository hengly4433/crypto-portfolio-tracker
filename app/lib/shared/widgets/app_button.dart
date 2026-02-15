import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

enum AppButtonVariant { primary, secondary, outline, destructive, ghost }

enum AppButtonSize { small, medium, large }

class AppButton extends StatelessWidget {
  final String title;
  final VoidCallback onPressed;
  final AppButtonVariant variant;
  final AppButtonSize size;
  final bool loading;
  final bool disabled;
  final Widget? icon;

  const AppButton({
    super.key,
    required this.title,
    required this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.medium,
    this.loading = false,
    this.disabled = false,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final ext = theme.extension<AppThemeExtension>()!;

    return AnimatedOpacity(
      duration: const Duration(milliseconds: 200),
      opacity: disabled ? 0.5 : 1.0,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: (disabled || loading) ? null : onPressed,
          borderRadius: BorderRadius.circular(AppRadius.md),
          child: Container(
            padding: _padding,
            constraints: BoxConstraints(minHeight: _minHeight),
            decoration: BoxDecoration(
              color: _getBgColor(theme, ext),
              borderRadius: BorderRadius.circular(AppRadius.md),
              border: _getBorder(theme, ext),
              boxShadow: _getShadow(theme, ext),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (loading)
                  SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: _getTextColor(theme, ext),
                    ),
                  )
                else ...[
                  if (icon != null) ...[icon!, const SizedBox(width: 8)],
                  Text(title,
                      style: TextStyle(
                        color: _getTextColor(theme, ext),
                        fontSize: _fontSize,
                        fontWeight: FontWeight.w600,
                      )),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  EdgeInsets get _padding {
    switch (size) {
      case AppButtonSize.small:
        return const EdgeInsets.symmetric(horizontal: 12, vertical: 6);
      case AppButtonSize.medium:
        return const EdgeInsets.symmetric(horizontal: 16, vertical: 12);
      case AppButtonSize.large:
        return const EdgeInsets.symmetric(horizontal: 24, vertical: 16);
    }
  }

  double get _minHeight {
    switch (size) {
      case AppButtonSize.small:
        return 32;
      case AppButtonSize.medium:
        return 44;
      case AppButtonSize.large:
        return 52;
    }
  }

  double get _fontSize {
    switch (size) {
      case AppButtonSize.small:
        return 13;
      case AppButtonSize.medium:
        return 15;
      case AppButtonSize.large:
        return 17;
    }
  }

  Color _getBgColor(ThemeData theme, AppThemeExtension ext) {
    if (disabled)
      return theme.brightness == Brightness.dark
          ? const Color(0xFF252540)
          : Colors.grey[300]!;

    switch (variant) {
      case AppButtonVariant.primary:
        return theme.colorScheme.primary;
      case AppButtonVariant.secondary:
        return theme.cardTheme.color!;
      case AppButtonVariant.outline:
        return Colors.transparent;
      case AppButtonVariant.destructive:
        return ext.danger;
      case AppButtonVariant.ghost:
        return Colors.transparent;
    }
  }

  Color _getTextColor(ThemeData theme, AppThemeExtension ext) {
    if (disabled) return ext.textTertiary;

    switch (variant) {
      case AppButtonVariant.primary:
        return theme.colorScheme.onPrimary;
      case AppButtonVariant.secondary:
        return theme.textTheme.bodyMedium!.color!;
      case AppButtonVariant.outline:
        return theme.colorScheme.primary;
      case AppButtonVariant.destructive:
        return Colors.white;
      case AppButtonVariant.ghost:
        return theme.colorScheme.primary;
    }
  }

  Border? _getBorder(ThemeData theme, AppThemeExtension ext) {
    switch (variant) {
      case AppButtonVariant.secondary:
        return Border.all(color: ext.cardBorder);
      case AppButtonVariant.outline:
        return Border.all(color: theme.primaryColor);
      default:
        return null;
    }
  }

  List<BoxShadow>? _getShadow(ThemeData theme, AppThemeExtension ext) {
    if (disabled) return null;
    final isDark = theme.brightness == Brightness.dark;

    switch (variant) {
      case AppButtonVariant.primary:
        return [
          BoxShadow(
              color: theme.primaryColor.withOpacity(0.3),
              blurRadius: 12,
              offset: const Offset(0, 4))
        ];
      case AppButtonVariant.destructive:
        return [
          BoxShadow(
              color: ext.danger.withOpacity(0.3),
              blurRadius: 12,
              offset: const Offset(0, 4))
        ];
      case AppButtonVariant.secondary:
        return [
          BoxShadow(
              color: isDark
                  ? Colors.black.withOpacity(0.2)
                  : Colors.black.withOpacity(0.05),
              blurRadius: 4,
              offset: const Offset(0, 2))
        ];
      default:
        return null;
    }
  }
}
