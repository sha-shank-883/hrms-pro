import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledAnimatedView = styled(Animated.View);

export const AnimatedLogo = () => {
  const theme = useTheme();
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 90 });
    opacity.value = withTiming(1, { duration: 800 });
    rotate.value = withSpring(1, { damping: 10, stiffness: 40 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${interpolate(rotate.value, [0, 1], [-15, 0], Extrapolate.CLAMP)}deg` }
      ],
      opacity: opacity.value,
    };
  });

  return (
    <StyledAnimatedView style={[animatedStyle]}>
      <StyledView 
        className="w-24 h-24 rounded-[32px] items-center justify-center shadow-xl"
        style={{ backgroundColor: theme.colors.primary }}
      >
        <StyledText className="text-white text-4xl font-black italic">{"HR"}</StyledText>
      </StyledView>
    </StyledAnimatedView>
  );
};
