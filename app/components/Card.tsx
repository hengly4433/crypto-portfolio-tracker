import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, borderRadius, shadows } from '../lib/theme';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'glass' | 'elevated';
};

export default function Card({ children, style, variant = 'default' }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        variant === 'glass' && styles.glassCard,
        variant === 'elevated' && styles.elevatedCard,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 4,
    ...shadows.sm,
  },
  glassCard: {
    backgroundColor: 'rgba(28, 28, 46, 0.7)',
    borderColor: colors.borderLight,
  },
  elevatedCard: {
    backgroundColor: colors.elevated,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
});