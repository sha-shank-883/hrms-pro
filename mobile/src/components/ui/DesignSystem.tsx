import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

export const PremiumCard = ({ children, className = '', style }: { children: React.ReactNode, className?: string, style?: ViewStyle }) => {
  const theme = useTheme();
  return (
    <StyledView 
      className={`rounded-3xl p-6 border shadow-sm ${className}`}
      style={[{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }, style]}
    >
      {children}
    </StyledView>
  );
};

export const PremiumButton = ({ 
  label, 
  onPress, 
  variant = 'primary', 
  className = '',
  icon: Icon,
  disabled = false
}: { 
  label: string, 
  onPress: () => void | Promise<void>, 
  variant?: 'primary' | 'secondary' | 'outline' | 'error',
  className?: string,
  icon?: any,
  disabled?: boolean
}) => {
  const theme = useTheme();
  
  let bgStyle = { backgroundColor: theme.colors.primary };
  let textStyle = { color: '#fff' };
  let borderStyle = {};

  if (disabled) {
    bgStyle = { backgroundColor: theme.colors.muted || '#9ca3af' };
    textStyle = { color: 'rgba(255,255,255,0.5)' };
  } else if (variant === 'error') {
    bgStyle = { backgroundColor: theme.colors.error || '#ef4444' };
  } else if (variant === 'secondary') {
    bgStyle = { backgroundColor: theme.colors.accent };
  } else if (variant === 'outline') {
    bgStyle = { backgroundColor: 'transparent' };
    textStyle = { color: theme.colors.primary };
    borderStyle = { borderWidth: 1, borderColor: theme.colors.primary };
  }

  return (
    <StyledTouchableOpacity 
      onPress={onPress}
      disabled={disabled}
      className={`flex-row items-center justify-center rounded-2xl py-4 px-6 ${className}`}
      style={[bgStyle, borderStyle]}
      activeOpacity={0.8}
    >
      {Icon && <StyledView className="mr-2">{Icon}</StyledView>}
      <StyledText className="text-base font-bold" style={textStyle}>
        {label}
      </StyledText>
    </StyledTouchableOpacity>
  );
};

export const PremiumInput = ({ 
  label, 
  placeholder, 
  value, 
  onChangeText, 
  secureTextEntry = false 
}: { 
  label: string, 
  placeholder: string, 
  value: string, 
  onChangeText: (text: string) => void,
  secureTextEntry?: boolean
}) => {
  const theme = useTheme();
  return (
    <StyledView className="mb-4">
      <StyledText className="text-sm font-semibold mb-2" style={{ color: theme.colors.subtext }}>
        {label}
      </StyledText>
      <StyledView 
        className="rounded-2xl border px-4 py-3 flex-row items-center"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
      >
        <StyledView className="flex-1">
          {/* Using standard TextInput if needed, but for now just a mockup structure */}
          <StyledText style={{ color: theme.colors.text }}>{value || placeholder}</StyledText>
        </StyledView>
      </StyledView>
    </StyledView>
  );
};
