import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, borderRadius } from '../lib/theme';

type BadgeProps = {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'destructive' | 'outline' | 'secondary' | 'warning';
  size?: 'small' | 'medium';
  style?: StyleProp<ViewStyle>;
};

export default function Badge({
  children,
  variant = 'default',
  size = 'medium',
  style,
}: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant], styles[size], style]}>
      <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`]]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.pill,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  default: {
    backgroundColor: 'rgba(91, 127, 255, 0.15)',
  },
  success: {
    backgroundColor: colors.successBg,
  },
  destructive: {
    backgroundColor: colors.dangerBg,
  },
  outline: {
    backgroundColor: colors.transparent,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondary: {
    backgroundColor: colors.elevated,
  },
  warning: {
    backgroundColor: colors.warningBg,
  },
  small: {
    paddingVertical: 2,
  },
  medium: {
    paddingVertical: 4,
  },
  text: {
    fontWeight: '600',
  },
  defaultText: {
    color: colors.primary,
  },
  successText: {
    color: colors.success,
  },
  destructiveText: {
    color: colors.danger,
  },
  outlineText: {
    color: colors.textSecondary,
  },
  secondaryText: {
    color: colors.textSecondary,
  },
  warningText: {
    color: colors.warning,
  },
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
});