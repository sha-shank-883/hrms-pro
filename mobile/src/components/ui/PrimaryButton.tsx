import React, { ReactNode } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

export const PrimaryButton = ({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
  labelStyle,
}: Props) => {
  const theme = useTheme();
  const backgroundColor =
    variant === 'primary'
      ? theme.colors.primary
      : variant === 'secondary'
      ? theme.colors.accent
      : 'transparent';
  const textColor = variant === 'ghost' ? theme.colors.primary : '#fff';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, { backgroundColor, opacity: disabled ? 0.55 : 1 }, style]}
    >
      <Text style={[styles.label, { color: textColor }, labelStyle]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
});
