import React, { useEffect, useState } from 'react';
import { View, Text, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';

import { AnimatedLogo } from '../../components/animations/AnimatedLogo';
import { useTheme } from '../../context/ThemeContext';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledSafeAreaView = styled(SafeAreaView);
const StyledAnimatedView = styled(Animated.View);

export default function SplashScreen() {
  const navigation = useNavigation<any>();
  const theme = useTheme();

  // "Zero-Fail" Progress State
  const [progressWidth, setProgressWidth] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 3000;
    const totalWidth = 220; // Matches track width
    
    // Manual animation timer (50 FPS)
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(elapsed / duration, 1);
      setProgressWidth(currentProgress * totalWidth);
      
      if (currentProgress >= 1) {
        clearInterval(interval);
      }
    }, 20);

    // Navigate after animation completes
    const timeout = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 3500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <StyledSafeAreaView
      className="flex-1 justify-between py-12 px-8"
      style={{
        backgroundColor: theme.colors.background,
      }}
    >
      {/* STATUS BAR */}
      <StatusBar
        barStyle={
          theme.mode === 'dark'
            ? 'light-content'
            : 'dark-content'
        }
      />

      {/* MAIN CONTENT */}
      <StyledView className="flex-1 justify-center items-center">

        {/* LOGO */}
        <AnimatedLogo />

        {/* APP TITLE */}
        <StyledAnimatedView
          entering={FadeInDown.delay(400).duration(800)}
        >
          <StyledText
            className="text-5xl font-black tracking-tighter mt-8 text-center"
            style={{
              color: theme.colors.text,
            }}
          >
            {"HRMS"}
            <StyledText
              style={{
                color: theme.colors.primary,
              }}
            >
              {"PRO"}
            </StyledText>
          </StyledText>
        </StyledAnimatedView>

        {/* SUBTITLE */}
        <StyledAnimatedView
          entering={FadeInDown.delay(600).duration(800)}
        >
          <StyledText
            className="mt-3 text-sm tracking-wide opacity-70"
            style={{
              color: theme.colors.muted,
            }}
          >
            {"Smart Workforce Management"}
          </StyledText>
        </StyledAnimatedView>

        {/* PROGRESS BAR */}
        <StyledAnimatedView
          entering={FadeInDown.delay(800).duration(800)}
          className="mt-12"
        >
          {/* TRACK */}
          <View
            style={{
              height: 10,
              width: 220,
              backgroundColor:
                theme.mode === 'dark'
                  ? '#1e293b'
                  : '#e2e8f0',
              borderRadius: 999,
              overflow: 'hidden',
            }}
          >
            {/* MANUAL FILL - Guaranteed to work */}
            <View
              style={{
                height: '100%',
                width: progressWidth,
                backgroundColor: theme.colors.primary,
                borderRadius: 999,
                // GLOW EFFECT
                shadowColor: theme.colors.primary,
                shadowOpacity: 0.5,
                shadowRadius: 5,
                elevation: 3,
              }}
            />
          </View>
        </StyledAnimatedView>
      </StyledView>

      {/* FOOTER */}
      <StyledAnimatedView
        entering={FadeInUp.delay(1200).duration(800)}
        className="items-center"
      >
        <StyledView className="flex-row items-center">
          <StyledView
            className="w-2 h-2 rounded-full mr-2"
            style={{
              backgroundColor: theme.colors.primary,
            }}
          />

          <StyledText
            className="text-xs font-bold uppercase tracking-widest opacity-50"
            style={{
              color: theme.colors.muted,
            }}
          >
            {"Powered by HRMS PRO"}
          </StyledText>
        </StyledView>
      </StyledAnimatedView>
    </StyledSafeAreaView>
  );
}
