import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { styled } from 'nativewind';
import { ChevronLeft, MessageCircle, Mail, Phone, ExternalLink } from 'lucide-react-native';
import { PremiumCard } from '../../components/ui/DesignSystem';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);
const StyledAnimatedView = styled(Animated.View);

export default function ContactSupportScreen() {
  const navigation = useNavigation<any>();
  const theme = useTheme();

  const supportOptions = [
    {
      title: 'Live Chat',
      description: 'Instant help from our support team.',
      icon: <MessageCircle size={24} color="#3b82f6" />,
      action: () => Alert.alert('Chat', 'Opening live chat...'),
      color: '#3b82f6',
    },
    {
      title: 'Email Support',
      description: 'Get a response within 24 hours.',
      icon: <Mail size={24} color="#10b981" />,
      action: () => Linking.openURL('mailto:support@hrmspro.com'),
      color: '#10b981',
    },
    {
      title: 'Phone Support',
      description: 'Available Mon-Fri, 9am - 6pm.',
      icon: <Phone size={24} color="#f59e0b" />,
      action: () => Linking.openURL('tel:+1234567890'),
      color: '#f59e0b',
    },
  ];

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
        <StyledText className="text-xl font-bold ml-2" style={{ color: theme.colors.text }}>Support</StyledText>
      </StyledView>

      <StyledScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <StyledView className="px-8 py-8">
          <StyledAnimatedView entering={FadeInDown.duration(800)}>
            <StyledText className="text-3xl font-black mb-2" style={{ color: theme.colors.text }}>How can we help?</StyledText>
            <StyledText className="text-base opacity-60 mb-10" style={{ color: theme.colors.subtext }}>
              Our dedicated support team is here to ensure you have the best experience with HRMS Pro.
            </StyledText>
          </StyledAnimatedView>

          <StyledView className="space-y-6 mb-12">
            {supportOptions.map((option, index) => (
              <StyledAnimatedView key={index} entering={FadeInDown.delay(200 * index).duration(800)}>
                <StyledTouchableOpacity onPress={option.action} activeOpacity={0.7}>
                  <PremiumCard className="flex-row items-center p-6">
                    <StyledView 
                      className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                      style={{ backgroundColor: option.color + '15' }}
                    >
                      {option.icon}
                    </StyledView>
                    <StyledView className="flex-1">
                      <StyledText className="text-lg font-bold" style={{ color: theme.colors.text }}>{option.title}</StyledText>
                      <StyledText className="text-sm opacity-60" style={{ color: theme.colors.subtext }}>{option.description}</StyledText>
                    </StyledView>
                    <ExternalLink size={18} color={theme.colors.muted} />
                  </PremiumCard>
                </StyledTouchableOpacity>
              </StyledAnimatedView>
            ))}
          </StyledView>

          {/* Help Center CTA */}
          <StyledAnimatedView entering={FadeInDown.delay(800).duration(800)}>
            <PremiumCard className="bg-blue-600 items-center p-8 border-0">
              <StyledText className="text-white text-xl font-black mb-2 text-center">Documentation</StyledText>
              <StyledText className="text-white opacity-80 text-center mb-6">
                Browse our detailed guides and FAQs to find answers quickly.
              </StyledText>
              <StyledTouchableOpacity className="bg-white px-6 py-3 rounded-xl">
                <StyledText className="text-blue-600 font-bold">Visit Help Center</StyledText>
              </StyledTouchableOpacity>
            </PremiumCard>
          </StyledAnimatedView>
        </StyledView>
      </StyledScrollView>
    </StyledSafeAreaView>
  );
}

const Alert = require('react-native').Alert;

