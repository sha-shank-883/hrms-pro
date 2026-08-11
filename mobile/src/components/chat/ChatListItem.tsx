import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Hash, CheckCheck, Check } from 'lucide-react-native';
import Animated, { 
  FadeIn, useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming 
} from 'react-native-reanimated';

interface ChatListItemProps {
  item: Record<string, any>;
  onPress: () => void;
  isOnline?: boolean;
  isTyping?: boolean;
  isChannel?: boolean;
  colors: Record<string, string>;
  idx: number;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({
  item,
  onPress,
  isOnline,
  isTyping,
  isChannel,
  colors,
  idx
}) => {
  const name = isChannel ? item.name : (item.sender_name || item.receiver_name || 'Contact');
  const lastMsg = isTyping ? 'typing...' : (item.last_message || (isChannel ? item.description : ''));
  const isDark = colors.background === '#0f172a' || colors.background === '#111827';
  
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      if (diff < 24 * 60 * 60 * 1000) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
      }
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
      
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const time = formatTime(item.updated_at || item.created_at);
  const unreadCount = item.unread_count || 0;

  const scale = useSharedValue(1);
  const typingOpacity = useSharedValue(1);

  React.useEffect(() => {
    if (isTyping) {
      typingOpacity.value = withRepeat(
        withSequence(withTiming(0.4, { duration: 500 }), withTiming(1, { duration: 500 })),
        -1,
        true
      );
    } else {
      typingOpacity.value = 1;
    }
  }, [isTyping]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const typingStyle = useAnimatedStyle(() => ({
    opacity: typingOpacity.value
  }));

  const unreadColor = '#25D366'; // WhatsApp Green

  return (
    <Animated.View entering={FadeIn.delay(idx * 30)} style={animatedStyle}>
      <Pressable 
        onPress={onPress}
        onPressIn={() => (scale.value = withSpring(0.98))}
        onPressOut={() => (scale.value = withSpring(1))}
        style={({ pressed }) => [
          styles.pressable,
          pressed && { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }
        ]}
      >
        <View style={styles.container}>
          <View style={[styles.avatarBox, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
            {isChannel ? (
              <Hash size={24} color={colors.primary} />
            ) : (
              <Text style={[styles.avatarText, { color: colors.primary }]}>{name.charAt(0).toUpperCase()}</Text>
            )}
            {isOnline && !isChannel && <View style={[styles.onlineBadge, { borderColor: isDark ? colors.background : '#fff', backgroundColor: '#22c55e' }]} />}
          </View>

          <View style={[styles.content, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0' }]}>
            <View style={styles.info}>
              <View style={styles.header}>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                  {name}
                </Text>
                <Text style={[styles.time, { color: unreadCount > 0 ? unreadColor : colors.subtext }]}>
                  {time}
                </Text>
              </View>
              <View style={styles.footer}>
                <View style={styles.lastMsgWrapper}>
                   {item.is_me && (
                     <View style={styles.tickWrapper}>
                       {item.is_read ? (
                         <CheckCheck size={16} color="#34b7f1" strokeWidth={2.5} />
                       ) : (
                         <CheckCheck size={16} color={colors.subtext} strokeWidth={2.5} />
                       )}
                     </View>
                   )}
                  <Animated.Text 
                    style={[
                      styles.lastMsg, 
                      { color: isTyping ? colors.primary : colors.subtext }, 
                      isTyping && typingStyle,
                      unreadCount > 0 && { color: isDark ? '#e2e8f0' : '#4a5568', fontWeight: '500' }
                    ]} 
                    numberOfLines={1}
                  >
                    {lastMsg}
                  </Animated.Text>
                </View>
                {unreadCount > 0 && (
                  <View style={[styles.unreadBadge, { backgroundColor: unreadColor }]}>
                    <Text style={styles.unreadText}>{unreadCount}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  pressable: {
    paddingLeft: 16,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  content: {
    flex: 1,
    marginLeft: 14,
    paddingVertical: 14,
    paddingRight: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  info: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  time: {
    fontSize: 12,
    fontWeight: '400',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMsgWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tickWrapper: {
    marginRight: 4,
  },
  lastMsg: {
    fontSize: 14,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  }
});

