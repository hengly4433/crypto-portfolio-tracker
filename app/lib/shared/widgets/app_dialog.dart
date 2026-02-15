import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

enum AppDialogType { info, warning, danger }

/// A modern, polished dialog widget with icon header and styled action buttons.
///
/// Usage:
/// ```dart
/// showAppDialog(
///   context: context,
///   type: AppDialogType.danger,
///   icon: Icons.delete_outline,
///   title: 'Delete Portfolio',
///   message: 'Are you sure you want to delete this?',
///   confirmLabel: 'Delete',
///   onConfirm: () { ... },
/// );
/// ```
Future<T?> showAppDialog<T>({
  required BuildContext context,
  required String title,
  required String message,
  required String confirmLabel,
  required VoidCallback onConfirm,
  AppDialogType type = AppDialogType.info,
  IconData? icon,
  String cancelLabel = 'Cancel',
  Widget? content,
}) {
  return showGeneralDialog<T>(
    context: context,
    barrierDismissible: true,
    barrierLabel: 'Dismiss',
    barrierColor: Colors.black54,
    transitionDuration: const Duration(milliseconds: 250),
    pageBuilder: (_, __, ___) => const SizedBox.shrink(),
    transitionBuilder: (ctx, anim, secondAnim, child) {
      final curved = CurvedAnimation(parent: anim, curve: Curves.easeOutCubic);
      return ScaleTransition(
        scale: Tween<double>(begin: 0.9, end: 1.0).animate(curved),
        child: FadeTransition(
          opacity: curved,
          child: _AppDialogContent<T>(
            type: type,
            icon: icon,
            title: title,
            message: message,
            confirmLabel: confirmLabel,
            cancelLabel: cancelLabel,
            onConfirm: onConfirm,
            content: content,
          ),
        ),
      );
    },
  );
}

class _AppDialogContent<T> extends StatelessWidget {
  final AppDialogType type;
  final IconData? icon;
  final String title;
  final String message;
  final String confirmLabel;
  final String cancelLabel;
  final VoidCallback onConfirm;
  final Widget? content;

  const _AppDialogContent({
    required this.type,
    this.icon,
    required this.title,
    required this.message,
    required this.confirmLabel,
    required this.cancelLabel,
    required this.onConfirm,
    this.content,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final ext = theme.extension<AppThemeExtension>()!;
    final isDark = theme.brightness == Brightness.dark;

    final Color accentColor;
    final Color accentBg;
    final IconData displayIcon;

    switch (type) {
      case AppDialogType.danger:
        accentColor = ext.danger;
        accentBg = ext.dangerBg;
        displayIcon = icon ?? Icons.warning_amber_rounded;
        break;
      case AppDialogType.warning:
        accentColor = ext.warning;
        accentBg = ext.warningBg;
        displayIcon = icon ?? Icons.info_outline_rounded;
        break;
      case AppDialogType.info:
        accentColor = theme.colorScheme.primary;
        accentBg = theme.colorScheme.primary.withOpacity(isDark ? 0.15 : 0.1);
        displayIcon = icon ?? Icons.info_outline_rounded;
        break;
    }

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Material(
          color: Colors.transparent,
          child: Container(
            constraints: const BoxConstraints(maxWidth: 360),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkCard : Colors.white,
              borderRadius: BorderRadius.circular(AppRadius.xl),
              border: Border.all(
                color: isDark
                    ? AppColors.darkBorder.withOpacity(0.6)
                    : AppColors.lightBorder.withOpacity(0.5),
              ),
              boxShadow: [
                BoxShadow(
                  color: isDark
                      ? Colors.black.withOpacity(0.5)
                      : Colors.black.withOpacity(0.12),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                  spreadRadius: 0,
                ),
                if (!isDark)
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 28, 24, 20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Icon circle
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: accentBg,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(displayIcon, color: accentColor, size: 26),
                  ),
                  const SizedBox(height: 16),

                  // Title
                  Text(
                    title,
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                      fontSize: 19,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),

                  // Message
                  Text(
                    message,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: ext.textSecondary,
                      fontSize: 14,
                      height: 1.5,
                    ),
                    textAlign: TextAlign.center,
                  ),

                  // Optional custom content
                  if (content != null) ...[
                    const SizedBox(height: 16),
                    content!,
                  ],

                  const SizedBox(height: 24),

                  // Action buttons
                  Row(
                    children: [
                      // Cancel
                      Expanded(
                        child: _DialogButton(
                          label: cancelLabel,
                          onPressed: () => Navigator.pop(context),
                          backgroundColor: isDark
                              ? Colors.white.withOpacity(0.06)
                              : Colors.grey.shade100,
                          textColor: ext.textSecondary,
                          borderColor: isDark
                              ? Colors.white.withOpacity(0.08)
                              : Colors.grey.shade200,
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Confirm
                      Expanded(
                        child: _DialogButton(
                          label: confirmLabel,
                          onPressed: () {
                            onConfirm();
                            Navigator.pop(context, true as T);
                          },
                          backgroundColor: accentColor,
                          textColor: Colors.white,
                          shadow: BoxShadow(
                            color: accentColor.withOpacity(0.3),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _DialogButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;
  final Color backgroundColor;
  final Color textColor;
  final Color? borderColor;
  final BoxShadow? shadow;

  const _DialogButton({
    required this.label,
    required this.onPressed,
    required this.backgroundColor,
    required this.textColor,
    this.borderColor,
    this.shadow,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: Container(
          height: 44,
          decoration: BoxDecoration(
            color: backgroundColor,
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: borderColor != null
                ? Border.all(color: borderColor!)
                : null,
            boxShadow: shadow != null ? [shadow!] : null,
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              color: textColor,
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
        ),
      ),
    );
  }
}
