import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StatusBar, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { styled } from 'nativewind';
import { ChevronLeft, Mail, Phone, Globe } from 'lucide-react-native';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);

export default function AboutCompanyScreen() {
  const navigation = useNavigation<any>();
  const theme = useTheme();

  return (
    <StyledSafeAreaView 
      className="flex-1"
      style={{ backgroundColor: theme.colors.background }}
    >
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <StyledView className="flex-row items-center px-6 py-4">
        <StyledTouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
          <ChevronLeft color={theme.colors.text} size={28} />
        </StyledTouchableOpacity>
        <StyledText className="text-xl font-bold ml-2" style={{ color: theme.colors.text }}>About Us</StyledText>
      </StyledView>

      <StyledScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <StyledView className="px-8 py-8">
          <Animated.View entering={FadeInDown.duration(800)}>
            <StyledText className="text-xs font-black uppercase tracking-[4px] mb-2" style={{ color: theme.colors.primary }}>Our Mission</StyledText>
            <StyledText className="text-3xl font-black mb-6" style={{ color: theme.colors.text }}>
              Empowering the{'\n'}future of work.
            </StyledText>
            <StyledText className="text-lg leading-7 opacity-70 mb-8" style={{ color: theme.colors.subtext }}>
              We build intelligent HR solutions that help enterprises manage their most valuable asset: their people. 
              Our mission is to simplify complex HR workflows through automation and intuitive design.
            </StyledText>
          </Animated.View>

          {/* Stats */}
          <StyledView className="flex-row justify-between mb-12">
            <StyledView>
              <StyledText className="text-3xl font-black" style={{ color: theme.colors.primary }}>500+</StyledText>
              <StyledText className="text-sm font-bold opacity-50" style={{ color: theme.colors.subtext }}>Enterprises</StyledText>
            </StyledView>
            <StyledView>
              <StyledText className="text-3xl font-black" style={{ color: theme.colors.primary }}>50k+</StyledText>
              <StyledText className="text-sm font-bold opacity-50" style={{ color: theme.colors.subtext }}>Employees</StyledText>
            </StyledView>
            <StyledView>
              <StyledText className="text-3xl font-black" style={{ color: theme.colors.primary }}>99.9%</StyledText>
              <StyledText className="text-sm font-bold opacity-50" style={{ color: theme.colors.subtext }}>Uptime</StyledText>
            </StyledView>
          </StyledView>

          {/* Vision Section */}
          <StyledView className="bg-white dark:bg-gray-800 rounded-3xl p-8 mb-12 shadow-sm">
            <StyledText className="text-xl font-black mb-4" style={{ color: theme.colors.text }}>Our Vision</StyledText>
            <StyledText className="text-base leading-6 opacity-70" style={{ color: theme.colors.subtext }}>
              To become the global standard for HR management, bridging the gap between company goals and employee happiness.
            </StyledText>
          </StyledView>

          {/* Contact Info */}
          <StyledText className="text-xs font-black uppercase tracking-[4px] mb-6" style={{ color: theme.colors.primary }}>Connect With Us</StyledText>
          <StyledView className="space-y-4 mb-12">
            <StyledTouchableOpacity className="flex-row items-center space-x-4" onPress={() => Linking.openURL('https://hrmspro.com')}>
              <Globe size={20} color={theme.colors.primary} />
              <StyledText className="font-semibold" style={{ color: theme.colors.text }}>www.hrmspro.com</StyledText>
            </StyledTouchableOpacity>
            <StyledTouchableOpacity className="flex-row items-center space-x-4" onPress={() => Linking.openURL('mailto:hello@hrmspro.com')}>
              <Mail size={20} color={theme.colors.primary} />
              <StyledText className="font-semibold" style={{ color: theme.colors.text }}>hello@hrmspro.com</StyledText>
            </StyledTouchableOpacity>
          </StyledView>

          {/* Socials */}
          <StyledView className="flex-row space-x-6">
            <StyledTouchableOpacity><Globe size={24} color={theme.colors.text} /></StyledTouchableOpacity>
            <StyledTouchableOpacity><Mail size={24} color={theme.colors.text} /></StyledTouchableOpacity>
          </StyledView>
        </StyledView>
      </StyledScrollView>
    </StyledSafeAreaView>
  );
}

