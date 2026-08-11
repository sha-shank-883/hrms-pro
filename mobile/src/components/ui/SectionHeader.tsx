import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}

export const SectionHeader = ({ title, subtitle, icon }: Props) => {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {icon ? <View style={styles.iconSpacer}>{icon}</View> : null}
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      </View>
      {subtitle ? <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSpacer: {
    marginRight: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
});
