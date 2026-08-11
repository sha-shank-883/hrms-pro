import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { styled } from 'nativewind';
import { PremiumButton, PremiumCard } from '../../components/ui/DesignSystem';
import { Check, ChevronLeft } from 'lucide-react-native';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);
const StyledAnimatedView = styled(Animated.View);

const PLANS = [
  {
    name: 'Starter',
    price: { monthly: '$49', yearly: '$39' },
    description: 'Perfect for small teams getting started.',
    features: ['Up to 10 employees', 'Basic Attendance', 'Email Support', 'Mobile App Access'],
    featured: false,
  },
  {
    name: 'Professional',
    price: { monthly: '$149', yearly: '$119' },
    description: 'Advanced tools for growing organizations.',
    features: ['Up to 50 employees', 'Biometric Attendance', 'Payroll Processing', 'Priority Support', 'Custom Reports'],
    featured: true,
  },
  {
    name: 'Enterprise',
    price: { monthly: 'Custom', yearly: 'Custom' },
    description: 'Full-scale solution for large enterprises.',
    features: ['Unlimited employees', 'Multi-tenant Support', 'Dedicated Account Manager', 'Custom Integrations', 'On-premise Options'],
    featured: false,
  },
];

export default function PricingScreen() {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

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
        <StyledText className="text-xl font-bold ml-2" style={{ color: theme.colors.text }}>Pricing Plans</StyledText>
      </StyledView>

      <StyledScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <StyledView className="px-8 py-8">
          <StyledAnimatedView entering={FadeInDown.duration(800)}>
            <StyledText className="text-3xl font-black mb-2 text-center" style={{ color: theme.colors.text }}>
              Simple, transparent{'\n'}pricing for everyone.
            </StyledText>
            <StyledText className="text-base text-center opacity-60 mb-8" style={{ color: theme.colors.subtext }}>
              No hidden fees. Choose the plan that fits your team.
            </StyledText>
          </StyledAnimatedView>

          {/* Toggle */}
          <StyledView className="flex-row self-center bg-gray-200 dark:bg-gray-800 p-1 rounded-2xl mb-12">
            <StyledTouchableOpacity 
              onPress={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-xl ${billingCycle === 'monthly' ? 'bg-white shadow-sm' : ''}`}
            >
              <StyledText className={`font-bold ${billingCycle === 'monthly' ? 'text-blue-600' : 'text-gray-500'}`}>Monthly</StyledText>
            </StyledTouchableOpacity>
            <StyledTouchableOpacity 
              onPress={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-xl ${billingCycle === 'yearly' ? 'bg-white shadow-sm' : ''}`}
            >
              <StyledText className={`font-bold ${billingCycle === 'yearly' ? 'text-blue-600' : 'text-gray-500'}`}>Yearly</StyledText>
            </StyledTouchableOpacity>
          </StyledView>

          {/* Pricing Cards */}
          <StyledView className="space-y-6">
            {PLANS.map((plan, index) => (
              <StyledAnimatedView key={index} entering={FadeInDown.delay(200 * index).duration(800)}>
                <PremiumCard 
                  className={`border-2 ${plan.featured ? 'border-blue-600' : 'border-transparent'}`}
                >
                  {plan.featured && (
                    <StyledView className="absolute -top-4 self-center bg-blue-600 px-4 py-1 rounded-full shadow-lg">
                      <StyledText className="text-white text-xs font-black uppercase">Most Popular</StyledText>
                    </StyledView>
                  )}
                  
                  <StyledText className="text-xl font-black mb-1" style={{ color: theme.colors.text }}>{plan.name}</StyledText>
                  <StyledText className="text-sm opacity-60 mb-4" style={{ color: theme.colors.subtext }}>{plan.description}</StyledText>
                  
                  <StyledView className="flex-row items-baseline mb-6">
                    <StyledText className="text-4xl font-black" style={{ color: theme.colors.text }}>
                      {billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly}
                    </StyledText>
                    {plan.price.monthly !== 'Custom' && (
                      <StyledText className="text-sm opacity-50 ml-1" style={{ color: theme.colors.subtext }}>/month</StyledText>
                    )}
                  </StyledView>

                  <StyledView className="space-y-3 mb-8">
                    {plan.features.map((feature, fIdx) => (
                      <StyledView key={fIdx} className="flex-row items-center space-x-3">
                        <StyledView className="w-5 h-5 rounded-full items-center justify-center" style={{ backgroundColor: theme.colors.primary + '20' }}>
                          <Check size={12} color={theme.colors.primary} />
                        </StyledView>
                        <StyledText className="text-sm font-medium" style={{ color: theme.colors.text }}>{feature}</StyledText>
                      </StyledView>
                    ))}
                  </StyledView>

                  <PremiumButton 
                    label={plan.name === 'Enterprise' ? 'Contact Sales' : 'Start 14-Day Free Trial'} 
                    onPress={() => navigation.navigate('DemoRequest')}
                    variant={plan.featured ? 'primary' : 'outline'}
                  />
                </PremiumCard>
              </StyledAnimatedView>
            ))}
          </StyledView>
        </StyledView>

        <StyledView className="px-8 pb-12 items-center">
          <StyledText className="text-sm opacity-50 text-center" style={{ color: theme.colors.subtext }}>
            Prices are in USD and exclude applicable taxes.{'\n'}Save up to 25% with yearly billing.
          </StyledText>
        </StyledView>
      </StyledScrollView>
    </StyledSafeAreaView>
  );
}

