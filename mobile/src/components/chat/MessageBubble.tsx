import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Check, CheckCheck, Star, FileText, Play, Mic, Reply, ShieldAlert, Download } from 'lucide-react-native';
import Animated, { FadeIn, FadeInRight, FadeInLeft } from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface MessageBubbleProps {
  message: Record<string, any>;
  isMe: boolean;
  colors: Record<string, string>;
  onLongPress?: (msg: Record<string, any>) => void;
  onReplyPress?: (msg: Record<string, any>) => void;
  showAvatar?: boolean;
  isFirstInGroup?: boolean;
  themeMode?: 'light' | 'dark';
}

const BubbleTail = ({ isMe, color }: { isMe: boolean; color: string }) => {
  return (
    <View style={[styles.tailContainer, isMe ? styles.tailRight : styles.tailLeft]}>
      <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
        <Path
          d={isMe 
            ? "M0 0C4.33333 0 10.4 0.4 12 4V0H0Z" 
            : "M12 0C7.66667 0 1.6 0.4 0 4V0H12Z"
          }
          fill={color}
        />
      </Svg>
    </View>
  );
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMe,
  colors,
  onLongPress,
  onReplyPress,
  showAvatar,
  isFirstInGroup = true,
  themeMode = 'light'
}) => {
  const isDeleted = message.is_deleted;
  const isDark = themeMode === 'dark';

  const bubbleColors = {
    myBubble: colors.primary,
    otherBubble: isDark ? '#1e293b' : '#ffffff',
    myText: '#ffffff',
    otherText: isDark ? '#f8fafc' : '#1e293b',
    meta: isMe ? 'rgba(255,255,255,0.8)' : (isDark ? 'rgba(255,255,255,0.4)' : '#8e8e8e'),
    blueTick: '#34b7f1'
  };

  const renderStatus = () => {
    if (!isMe) return null;
    const color = message.is_read ? bubbleColors.blueTick : bubbleColors.meta;
    if (message.is_read || message.is_delivered) {
      return <CheckCheck size={13} color={color} strokeWidth={2} />;
    }
    return <Check size={13} color={bubbleColors.meta} strokeWidth={2} />;
  };

  const renderReplyContext = () => {
    if (!message.reply_to) return null;
    return (
      <TouchableOpacity
        onPress={() => onReplyPress?.(message.reply_to)}
        style={[
          styles.replyContext, 
          { backgroundColor: isMe ? 'rgba(0,0,0,0.1)' : (isDark ? 'rgba(255,255,255,0.05)' : '#f5f5f5') }
        ]}
      >
        <View style={[styles.replyLine, { backgroundColor: isMe ? '#fff' : colors.primary }]} />
        <View style={styles.replyContent}>
          <Text style={[styles.replyAuthor, { color: isMe ? '#fff' : colors.primary }]}>
            {message.reply_to.sender_name || 'Contact'}
          </Text>
          <Text style={[styles.replyText, { color: isMe ? 'rgba(255,255,255,0.9)' : (isDark ? '#cbd5e1' : '#4a5568') }]} numberOfLines={1}>
            {message.reply_to.message}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFile = () => {
    if (!message.file_url) return null;

    const isAudio = message.file_type?.startsWith('audio/');
    const isImage = message.file_type?.startsWith('image/');

    if (isImage) {
      return (
        <TouchableOpacity activeOpacity={0.9} style={[styles.imageContainer, { borderColor: 'transparent' }]}>
          <Image source={{ uri: message.file_url }} style={styles.image} resizeMode="cover" />
        </TouchableOpacity>
      );
    }

    if (isAudio) {
      return (
        <View style={styles.audioContainer}>
          <View style={[styles.playBtn, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : (isDark ? '#334155' : '#f1f5f9') }]}>
            <Play size={16} color={isMe ? '#fff' : colors.text} fill={isMe ? '#fff' : colors.text} />
          </View>
          <View style={styles.waveformPlaceholder}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(i => (
              <View key={i} style={[styles.waveBar, { height: 6 + Math.random() * 16, backgroundColor: isMe ? 'rgba(255,255,255,0.6)' : (isDark ? '#475569' : '#cbd5e1') }]} />
            ))}
          </View>
          <View style={styles.audioMeta}>
             <Mic size={14} color={bubbleColors.meta} />
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity activeOpacity={0.8} style={[styles.fileContainer, { backgroundColor: isMe ? 'rgba(0,0,0,0.1)' : (isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc') }]}>
        <View style={[styles.fileIcon, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : (isDark ? '#334155' : '#e2e8f0') }]}>
          <FileText size={20} color={isMe ? '#fff' : colors.subtext} />
        </View>
        <View style={styles.fileInfo}>
          <Text style={[styles.fileName, { color: isMe ? bubbleColors.myText : bubbleColors.otherText }]} numberOfLines={1}>{message.file_name || 'Document'}</Text>
          <Text style={[styles.fileSize, { color: bubbleColors.meta }]}>{message.file_size || '1.2 MB'}</Text>
        </View>
        <Download size={18} color={bubbleColors.meta} />
      </TouchableOpacity>
    );
  };

  const renderRightActions = () => (
    <View style={styles.replySwipeAction}>
      <Reply size={20} color={colors.subtext} />
    </View>
  );

  const bubbleColor = isMe ? bubbleColors.myBubble : bubbleColors.otherBubble;

  return (
    <Animated.View 
      entering={isMe ? FadeInRight.duration(300) : FadeInLeft.duration(300)}
      style={[
        styles.container,
        {
          alignItems: isMe ? 'flex-end' : 'flex-start',
          marginBottom: isFirstInGroup ? 12 : 4,
          paddingHorizontal: 8,
        }
      ]}
    >
      <View style={styles.bubbleWrapper}>
        {isFirstInGroup && <BubbleTail isMe={isMe} color={bubbleColor} />}
        
        <Swipeable
          renderRightActions={!isMe ? renderRightActions : undefined}
          renderLeftActions={isMe ? renderRightActions : undefined}
          onSwipeableOpen={() => onReplyPress?.(message)}
          friction={2}
          rightThreshold={40}
          leftThreshold={40}
        >
          <TouchableOpacity
            onLongPress={() => onLongPress?.(message)}
            activeOpacity={0.9}
            style={[
              styles.bubble,
              { 
                backgroundColor: bubbleColor,
                borderTopRightRadius: isMe && isFirstInGroup ? 2 : 16,
                borderTopLeftRadius: !isMe && isFirstInGroup ? 2 : 16,
              }
            ]}
          >
            {!isMe && isFirstInGroup && message.sender_name && (
              <Text style={[styles.senderName, { color: colors.primary }]}>
                {message.sender_name}
              </Text>
            )}
            
            {renderReplyContext()}
            {renderFile()}

            {isDeleted ? (
              <View style={styles.deletedRow}>
                <ShieldAlert size={12} color={bubbleColors.meta} strokeWidth={2} />
                <Text style={[styles.deletedText, { color: bubbleColors.meta }]}>
                  This message was deleted
                </Text>
              </View>
            ) : (
              <View style={styles.messageContent}>
                <Text style={[styles.messageText, { color: isMe ? bubbleColors.myText : bubbleColors.otherText }]}>
                  {message.message}
                  {/* Invisible padding for meta row */}
                  <Text style={{ opacity: 0 }}>{"    "}{"          "}</Text>
                </Text>
                
                <View style={styles.metaOverlay}>
                  {message.is_starred && <Star size={10} color={bubbleColors.meta} fill={bubbleColors.meta} style={styles.star} />}
                  {message.is_edited && <Text style={[styles.editedText, { color: bubbleColors.meta }]}>edited</Text>}
                  <Text style={[styles.time, { color: bubbleColors.meta }]}>
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}
                  </Text>
                  {renderStatus()}
                </View>
              </View>
            )}

            {message.reactions && message.reactions.length > 0 && (
              <View style={[styles.reactionBadge, { backgroundColor: isDark ? '#334155' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                {(message.reactions as { reaction: string }[]).slice(0, 3).map((r: { reaction: string }, idx: number) => (
                  <Text key={idx} style={styles.reactionEmoji}>{r.reaction}</Text>
                ))}
                {message.reactions.length > 1 && <Text style={[styles.reactionCount, { color: bubbleColors.otherText }]}>{message.reactions.length}</Text>}
              </View>
            )}
          </TouchableOpacity>
        </Swipeable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%' },
  bubbleWrapper: { position: 'relative' },
  tailContainer: {
    position: 'absolute',
    top: 0,
    zIndex: 1,
  },
  tailRight: {
    right: -8,
  },
  tailLeft: {
    left: -8,
  },
  bubble: { 
    maxWidth: width * 0.82, 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 16,
    minWidth: 70,
    // Add subtle shadow for premium feel
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  messageContent: {
    position: 'relative',
  },
  messageText: { 
    fontSize: 16, 
    lineHeight: 22, 
    fontWeight: '400',
  },
  metaOverlay: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'flex-end',
    gap: 4,
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
  time: { 
    fontSize: 11, 
    fontWeight: '400',
  },
  star: { marginRight: 1 },
  editedText: { fontSize: 10, fontStyle: 'italic' },
  senderName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  deletedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  deletedText: { fontSize: 13, fontStyle: 'italic' },

  replyContext: { 
    padding: 6, 
    borderRadius: 8, 
    flexDirection: 'row', 
    marginBottom: 4, 
    overflow: 'hidden' 
  },
  replyLine: { width: 4, borderRadius: 2 },
  replyContent: { marginLeft: 8, flex: 1 },
  replyAuthor: { fontSize: 12, fontWeight: '700', marginBottom: 1 },
  replyText: { fontSize: 13 },

  fileContainer: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 10, marginBottom: 4 },
  fileIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  fileInfo: { marginLeft: 10, flex: 1 },
  fileName: { fontSize: 14, fontWeight: '600' },
  fileSize: { fontSize: 11, marginTop: 1 },

  imageContainer: { width: '100%', minHeight: 200, borderRadius: 10, overflow: 'hidden', marginBottom: 4 },
  image: { width: '100%', height: '100%', minHeight: 200 },

  audioContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, minWidth: 200 },
  playBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  waveformPlaceholder: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 },
  waveBar: { width: 2, borderRadius: 1 },
  audioMeta: { paddingRight: 4 },

  reactionBadge: { 
    position: 'absolute', 
    bottom: -12, 
    right: 4, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 12, 
    borderWidth: 1, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 2 
  },
  reactionEmoji: { fontSize: 12 },
  reactionCount: { fontSize: 11, fontWeight: '700', marginLeft: 4 },

  replySwipeAction: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

