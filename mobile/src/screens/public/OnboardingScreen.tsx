import React, { useRef, useState } from 'react';
import { View, Text, useWindowDimensions, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, { 
  useSharedValue, useAnimatedStyle, interpolate, Extrapolate, FadeInRight, FadeIn
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { styled } from 'nativewind';
import { Shield, Users, BarChart3, ChevronRight } from 'lucide-react-native';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledSafeAreaView = styled(SafeAreaView);
const StyledAnimatedView = styled(Animated.View);

const ONBOARDING_DATA = [
  {
    id: '1',
    title: 'Workforce Hub',
    subtitle: 'Unified Experience',
    description: 'Empower your employees with a world-class HR experience. From payroll slips to attendance, everything in one place.',
    icon: <Users size={48} color="#fff" />,
    color: '#3b82f6',
  },
  {
    id: '2',
    title: 'Smart Attendance',
    subtitle: 'Geo & Biometric',
    description: 'Secure, location-aware clock-ins with enterprise-grade biometric verification. Stay compliant and precise.',
    icon: <Shield size={48} color="#fff" />,
    color: '#10b981',
  },
  {
    id: '3',
    title: 'Strategic Intel',
    subtitle: 'Real-time Analytics',
    description: 'Transform HR data into powerful business insights. Real-time dashboards and automated team reporting.',
    icon: <BarChart3 size={48} color="#fff" />,
    color: '#f59e0b',
  },
];

const OnboardingItem = ({ item, width, theme }: any) => {
  return (
    <StyledView style={{ width }} className="items-center justify-center px-10">
      <StyledAnimatedView 
        entering={FadeIn.duration(1000)}
        className="w-56 h-56 rounded-[56px] items-center justify-center mb-12 shadow-2xl"
        style={{ backgroundColor: item.color }}
      >
        {item.icon}
      </StyledAnimatedView>
      
      <StyledText 
        className="text-xs font-black uppercase tracking-[4px] mb-2"
        style={{ color: item.color }}
      >
        {item.subtitle}
      </StyledText>
      
      <StyledText 
        className="text-4xl font-black text-center mb-6"
        style={{ color: theme.colors.text }}
      >
        {item.title}
      </StyledText>
      
      <StyledText 
        className="text-lg text-center leading-7 opacity-70"
        style={{ color: theme.colors.subtext }}
      >
        {item.description}
      </StyledText>
    </StyledView>
  );
};

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const scrollX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);


  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const handleNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      navigation.navigate('Welcome');
    }
  };


  return (
    <StyledSafeAreaView 
      className="flex-1"
      style={{ backgroundColor: theme.colors.background }}
    >
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      
      <StyledView className="flex-row justify-between items-center px-8 py-4">
        <StyledText className="text-xl font-black">{"HRMS"}<StyledText style={{ color: theme.colors.primary }}>{"PRO"}</StyledText></StyledText>
        <StyledTouchableOpacity onPress={() => navigation.navigate('Login')}>
          <StyledText className="font-bold opacity-60" style={{ color: theme.colors.text }}>{"Skip"}</StyledText>
        </StyledTouchableOpacity>
      </StyledView>

      <FlatList
        ref={flatListRef}
        data={ONBOARDING_DATA}

        renderItem={({ item }) => <OnboardingItem item={item} width={width} theme={theme} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          scrollX.value = e.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
      />

      <StyledView className="px-8 pb-12 flex-row justify-between items-center">
        {/* Dots */}
        <StyledView className="flex-row space-x-2">
          {ONBOARDING_DATA.map((_, i) => {
            const dotStyle = useAnimatedStyle(() => {
              const opacity = interpolate(
                scrollX.value,
                [(i - 1) * width, i * width, (i + 1) * width],
                [0.3, 1, 0.3],
                Extrapolate.CLAMP
              );
              const scale = interpolate(
                scrollX.value,
                [(i - 1) * width, i * width, (i + 1) * width],
                [1, 1.2, 1],
                Extrapolate.CLAMP
              );
              return {
                opacity,
                transform: [{ scale }],
              };
            });
            return (
              <StyledAnimatedView 
                key={i} 
                style={[dotStyle, { backgroundColor: theme.colors.primary }]} 
                className="w-3 h-3 rounded-full" 
              />
            );
          })}
        </StyledView>

        {/* Next Button */}
        <StyledTouchableOpacity
          onPress={handleNext}
          className="w-16 h-16 rounded-full items-center justify-center shadow-lg"

          style={{ backgroundColor: theme.colors.primary }}
        >
          {currentIndex === ONBOARDING_DATA.length - 1 ? (
            <ChevronRight color="#fff" size={32} />
          ) : (
            <ChevronRight color="#fff" size={32} />
          )}
        </StyledTouchableOpacity>
      </StyledView>
    </StyledSafeAreaView>
  );
}

