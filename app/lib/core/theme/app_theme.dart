import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  // Static defined colors for reference, but should be accessed via ThemeExtension
  // Primary (Orange/Gold from frontend)
  static const primary =
      Color(0xFFF26D50); // User requested oklch(0.69 0.17 42) -> #f26d50
  static const primaryForeground = Colors.white;

  // Dark Theme Colors
  static const darkBackground =
      Color(0xFF0F111A); // Approx oklch(0.10 0.03 260)
  static const darkSurface = Color(0xFF161925); // Approx
  static const darkCard = Color(0xFF1C1F2E); // Approx
  static const darkBorder = Color(0xFF2A2D3D);

  // Light Theme Colors
  static const lightBackground =
      Color(0xFFF8F9FA); // Approx oklch(0.985 0.01 240)
  static const lightSurface = Colors.white;
  static const lightCard = Colors.white;
  static const lightBorder = Color(0xFFE2E4E9);

  // Semantic
  static const success = Color(0xFF22C55E);
  static const danger = Color(0xFFEF4444);
  static const warning = Color(0xFFF59E0B);
  static const info = Color(0xFF3B82F6);
}

class AppSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double xxl = 24;
  static const double xxxl = 32;
}

class AppRadius {
  static const double sm = 6;
  static const double md = 10;
  static const double lg = 14;
  static const double xl = 20;
  static const double pill = 50;
  static const double full = 9999;
}

// Custom Extension for semantic colors that don't fit in standard ColorScheme
class AppThemeExtension extends ThemeExtension<AppThemeExtension> {
  final Color success;
  final Color successBg;
  final Color danger;
  final Color dangerBg;
  final Color warning;
  final Color warningBg;
  final Color textSecondary;
  final Color textTertiary;
  final Color cardBorder;
  final Color cardHover;

  const AppThemeExtension({
    required this.success,
    required this.successBg,
    required this.danger,
    required this.dangerBg,
    required this.warning,
    required this.warningBg,
    required this.textSecondary,
    required this.textTertiary,
    required this.cardBorder,
    required this.cardHover,
  });

  @override
  ThemeExtension<AppThemeExtension> copyWith({
    Color? success,
    Color? successBg,
    Color? danger,
    Color? dangerBg,
    Color? warning,
    Color? warningBg,
    Color? textSecondary,
    Color? textTertiary,
    Color? cardBorder,
    Color? cardHover,
  }) {
    return AppThemeExtension(
      success: success ?? this.success,
      successBg: successBg ?? this.successBg,
      danger: danger ?? this.danger,
      dangerBg: dangerBg ?? this.dangerBg,
      warning: warning ?? this.warning,
      warningBg: warningBg ?? this.warningBg,
      textSecondary: textSecondary ?? this.textSecondary,
      textTertiary: textTertiary ?? this.textTertiary,
      cardBorder: cardBorder ?? this.cardBorder,
      cardHover: cardHover ?? this.cardHover,
    );
  }

  @override
  ThemeExtension<AppThemeExtension> lerp(
      ThemeExtension<AppThemeExtension>? other, double t) {
    if (other is! AppThemeExtension) return this;
    return AppThemeExtension(
      success: Color.lerp(success, other.success, t)!,
      successBg: Color.lerp(successBg, other.successBg, t)!,
      danger: Color.lerp(danger, other.danger, t)!,
      dangerBg: Color.lerp(dangerBg, other.dangerBg, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      warningBg: Color.lerp(warningBg, other.warningBg, t)!,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t)!,
      textTertiary: Color.lerp(textTertiary, other.textTertiary, t)!,
      cardBorder: Color.lerp(cardBorder, other.cardBorder, t)!,
      cardHover: Color.lerp(cardHover, other.cardHover, t)!,
    );
  }
}

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: AppColors.lightBackground,
      colorScheme: const ColorScheme.light(
        surface: AppColors.lightSurface,
        primary: AppColors.primary,
        onPrimary: Colors.white,
        secondary: Color(0xFFF4F4F5),
        onSecondary: Color(0xFF18181B),
        error: AppColors.danger,
        onError: Colors.white,
        background: AppColors.lightBackground,
        onSurface: Color(0xFF09090B),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.lightBackground,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: const Color(0xFF09090B),
        ),
        iconTheme: const IconThemeData(color: Color(0xFF09090B)),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: Color(0xFF71717A),
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
      cardTheme: CardTheme(
        color: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          side: const BorderSide(color: AppColors.lightBorder, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: const BorderSide(color: AppColors.lightBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: const BorderSide(color: AppColors.lightBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: const BorderSide(color: AppColors.danger),
        ),
        labelStyle: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: const Color(0xFF71717A),
        ),
        hintStyle: GoogleFonts.inter(
          fontSize: 15,
          color: const Color(0xFFA1A1AA),
        ),
      ),
      textTheme: GoogleFonts.interTextTheme(ThemeData.light().textTheme).apply(
        bodyColor: const Color(0xFF09090B),
        displayColor: const Color(0xFF09090B),
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.lightBorder,
        thickness: 1,
      ),
      extensions: [
        AppThemeExtension(
          success: AppColors.success,
          successBg: AppColors.success.withOpacity(0.1),
          danger: AppColors.danger,
          dangerBg: AppColors.danger.withOpacity(0.1),
          warning: AppColors.warning,
          warningBg: AppColors.warning.withOpacity(0.1),
          textSecondary: const Color(0xFF52525B), // Zinc 600
          textTertiary: const Color(0xFF71717A), // Zinc 500
          cardBorder: AppColors.lightBorder,
          cardHover: const Color(0xFFF4F4F5),
        ),
      ],
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.darkBackground,
      colorScheme: const ColorScheme.dark(
        surface: AppColors.darkSurface,
        primary: AppColors.primary,
        onPrimary: Colors.white,
        secondary: Color(0xFF27272A),
        onSecondary: Color(0xFFFAFAFA),
        error: AppColors.danger,
        onError: Colors.white,
        background: AppColors.darkBackground,
        onSurface: Color(0xFFFAFAFA),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.darkBackground,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.darkSurface,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: Color(0xFFA1A1AA),
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
      cardTheme: CardTheme(
        color: AppColors.darkCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          side: const BorderSide(color: AppColors.darkBorder, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.darkSurface,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: const BorderSide(color: AppColors.darkBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: const BorderSide(color: AppColors.darkBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: const BorderSide(color: AppColors.danger),
        ),
        labelStyle: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: const Color(0xFFA1A1AA),
        ),
        hintStyle: GoogleFonts.inter(
          fontSize: 15,
          color: const Color(0xFF52525B),
        ),
      ),
      textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme).apply(
        bodyColor: Colors.white,
        displayColor: Colors.white,
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.darkBorder,
        thickness: 1,
      ),
      extensions: [
        AppThemeExtension(
          success: AppColors.success,
          successBg: AppColors.success.withOpacity(0.15),
          danger: AppColors.danger,
          dangerBg: AppColors.danger.withOpacity(0.15),
          warning: AppColors.warning,
          warningBg: AppColors.warning.withOpacity(0.15),
          textSecondary: const Color(0xFFA1A1AA), // Zinc 400
          textTertiary: const Color(0xFF71717A), // Zinc 500
          cardBorder: AppColors.darkBorder,
          cardHover: const Color(0xFF27272A),
        ),
      ],
    );
  }
}
