import React from 'react';
import { View, Text, Image, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { styled } from 'nativewind';
import { PremiumButton } from '../../components/ui/DesignSystem';
import { ChevronRight, Layout, Shield, Users } from 'lucide-react-native';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledSafeAreaView = styled(SafeAreaView);
const StyledAnimatedView = styled(Animated.View);

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();
  const theme = useTheme();

  return (
    <StyledSafeAreaView 
      className="flex-1 px-8 py-8"
      style={{ backgroundColor: theme.colors.background }}
    >
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Brand Header */}
      <StyledAnimatedView entering={FadeInDown.duration(800)} className="items-center mb-12">
        <StyledView 
          className="w-16 h-16 rounded-2xl items-center justify-center mb-4 shadow-lg"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <StyledText className="text-white text-2xl font-black italic">HR</StyledText>
        </StyledView>
        <StyledText className="text-2xl font-black">{"HRMS"}<StyledText style={{ color: theme.colors.primary }}>{"PRO"}</StyledText></StyledText>
      </StyledAnimatedView>

      {/* Hero Content */}
      <StyledView className="flex-1 justify-center mb-12">
        <StyledAnimatedView entering={FadeInDown.delay(200).duration(800)}>
          <StyledText 
            className="text-4xl font-black leading-[48px] mb-4"
            style={{ color: theme.colors.text }}
          >
            {"Manage your\n"}
            <StyledText style={{ color: theme.colors.primary }}>{"workforce"}</StyledText>{" with\nprecision."}
          </StyledText>
          <StyledText 
            className="text-lg leading-7 opacity-70 mb-8"
            style={{ color: theme.colors.subtext }}
          >
            {"The all-in-one HRMS platform designed for modern enterprises and high-growth teams."}
          </StyledText>
        </StyledAnimatedView>

        {/* Small Feature List */}
        <StyledAnimatedView entering={FadeInDown.delay(400).duration(800)} className="space-y-4">
          <StyledView className="flex-row items-center space-x-3">
            <StyledView className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary + '20' }}>
              <Layout size={18} color={theme.colors.primary} />
            </StyledView>
            <StyledText className="font-semibold" style={{ color: theme.colors.text }}>{"Unified HR Dashboard"}</StyledText>
          </StyledView>
          <StyledView className="flex-row items-center space-x-3">
            <StyledView className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.accent + '20' }}>
              <Shield size={18} color={theme.colors.accent} />
            </StyledView>
            <StyledText className="font-semibold" style={{ color: theme.colors.text }}>{"Enterprise Security"}</StyledText>
          </StyledView>
        </StyledAnimatedView>
      </StyledView>

      {/* Actions */}
      <StyledAnimatedView entering={FadeInUp.delay(600).duration(800)} className="space-y-4">
        <PremiumButton 
          label="Sign In to Your Workspace" 
          onPress={() => navigation.navigate('Login')}
          className="w-full"
        />
        

        <StyledTouchableOpacity 
          onPress={() => navigation.navigate('Register')}
          className="items-center py-2"
        >
          <StyledText className="font-bold opacity-60" style={{ color: theme.colors.text }}>
            {"New to HRMS Pro? "}<StyledText style={{ color: theme.colors.primary }}>{"Create Account"}</StyledText>
          </StyledText>
        </StyledTouchableOpacity>
      </StyledAnimatedView>

      <StyledView className="items-center mt-8">
        <StyledText className="text-xs font-bold uppercase tracking-widest opacity-30" style={{ color: theme.colors.muted }}>
          {"v1.0.0 Production Ready"}
        </StyledText>
      </StyledView>
    </StyledSafeAreaView>
  );
}

