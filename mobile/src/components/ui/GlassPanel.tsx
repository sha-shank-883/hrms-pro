import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  children: ReactNode;
  style?: ViewStyle;
}

export const GlassPanel = ({ children, style }: Props) => {
  const theme = useTheme();
  return (
    <View style={[styles.panel, { backgroundColor: theme.mode === 'dark' ? 'rgba(15, 23, 42, 0.82)' : 'rgba(255, 255, 255, 0.88)', borderColor: theme.colors.border }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
});
