import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Send, Paperclip, Mic, Smile, Camera } from 'lucide-react-native';
import Animated, { 
  FadeIn, 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue, 
  withTiming, 
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttach: () => void;
  isRecording: boolean;
  recordingDuration: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  colors: Record<string, string>;
  placeholder?: string;
  themeMode?: 'light' | 'dark';
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChangeText,
  onSend,
  onAttach,
  isRecording,
  recordingDuration,
  onStartRecording,
  onStopRecording,
  colors,
  placeholder = "Message",
  themeMode = 'light'
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const isDark = themeMode === 'dark';
  const pulseAnim = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    if (isRecording) {
      pulseAnim.value = withSpring(1.2, { damping: 2, stiffness: 80 });
    } else {
      pulseAnim.value = withSpring(1);
    }
  }, [isRecording]);

  useEffect(() => {
    buttonScale.value = withSpring(value.trim() || isRecording ? 1.05 : 1);
  }, [value, isRecording]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }]
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }]
  }));

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hasText = value.trim().length > 0;

  return (
    <View style={styles.container}>
      <View style={[
        styles.inputWrapper, 
        { 
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          // Subtle shadow for the input bar
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }
      ]}>
        {!isRecording ? (
          <>
            <TouchableOpacity style={styles.iconBtn}>
              <Smile size={24} color={colors.subtext} />
            </TouchableOpacity>
            
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={placeholder}
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#999'}
              value={value}
              onChangeText={onChangeText}
              multiline
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />

            <TouchableOpacity onPress={onAttach} style={styles.iconBtn}>
              <Paperclip size={22} color={colors.subtext} style={{ transform: [{ rotate: '-45deg' }] }} />
            </TouchableOpacity>
            
            {!hasText && (
              <TouchableOpacity style={styles.iconBtn}>
                <Camera size={24} color={colors.subtext} />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.recordingIndicator}>
            <Animated.View style={[styles.recordingDot, { backgroundColor: '#ef4444' }, pulseStyle]} />
            <Text style={[styles.recordingText, { color: colors.text }]}>
              {formatDuration(recordingDuration)}
            </Text>
            <View style={styles.recordingLabel}>
              <Text style={[styles.recordingHint, { color: colors.subtext }]}>
                Recording...
              </Text>
            </View>
          </View>
        )}
      </View>

      <Animated.View style={buttonStyle}>
        <TouchableOpacity
          onPress={hasText ? onSend : (isRecording ? onStopRecording : onStartRecording)}
          style={[
            styles.actionBtn, 
            { backgroundColor: colors.primary }
          ]}
          activeOpacity={0.8}
        >
          {hasText ? (
            <Animated.View entering={FadeIn.duration(200)} key="send">
              <Send size={22} color="#fff" style={{ marginLeft: 2 }} />
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.duration(200)} key="mic">
              <Mic size={22} color="#fff" />
            </Animated.View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 6,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 6,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 17,
    paddingVertical: 10,
    paddingHorizontal: 6,
    maxHeight: 150,
    fontWeight: '400',
  },
  iconBtn: {
    padding: 10,
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  recordingIndicator: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  recordingText: {
    fontSize: 17,
    fontWeight: '600',
  },
  recordingLabel: {
    flex: 1,
    alignItems: 'center',
  },
  recordingHint: {
    fontSize: 15,
    fontWeight: '400',
  }
});

