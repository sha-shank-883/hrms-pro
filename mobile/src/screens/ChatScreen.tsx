import React, { useEffect, useState, useRef, useMemo } from 'react';
import { 
  View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, 
  ActivityIndicator, StatusBar, Dimensions, StyleSheet, FlatList, 
  ImageBackground, Image 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import { useAppConfig } from '../context/AppConfigContext';
import { chatService, employeeService } from '../api';
import * as Clipboard from 'expo-clipboard';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import Animated, { 
  FadeIn, FadeInUp, SlideInDown, Layout
} from 'react-native-reanimated';
import { 
  ArrowLeft, MoreVertical, Search, ShieldAlert, Phone, Video, X, 
  Reply as ReplyIcon, Copy, Star, Trash2, Users, User, CheckCheck, Camera 
} from 'lucide-react-native';
import { cryptoUtils } from '../utils/crypto';

import { MessageBubble } from '../components/chat/MessageBubble';
import { ChatInput } from '../components/chat/ChatInput';
import { ChatListItem } from '../components/chat/ChatListItem';

const { width } = Dimensions.get('window');

export default function ChatScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.mode === 'dark';

  const { user } = useAuth();
  const { isFeatureEnabled, loading: configLoading } = useAppConfig();
  const { socket, onlineUsers, typingUsers, sendTyping, sendStopTyping, reactToMessage } = useChat();
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState('direct'); // 'direct' | 'channels'
  const [conversations, setConversations] = useState<Record<string, any>[]>([]);
  const [channels, setChannels] = useState<Record<string, any>[]>([]);
  const [employees, setEmployees] = useState<Record<string, any>[]>([]);
  
  const [selectedChat, setSelectedChat] = useState<Record<string, any> | null>(null);
  const [messages, setMessages] = useState<Record<string, any>[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Record<string, any> | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [replyTo, setReplyTo] = useState<Record<string, any> | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const scrollViewRef = useRef<FlatList<Record<string, any>>>(null);
  const selectedChatRef = useRef<Record<string, any> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getCurrentUserId = () => {
    const v = user?.user_id || user?.id;
    return v ? String(v) : null;
  };

  const isMessageMine = (msg: { sender_id?: string | number } | null) => {
    const myId = getCurrentUserId();
    if (!myId || !msg?.sender_id) return false;
    return String(msg.sender_id) === myId;
  };

  const getContactId = (contact: Record<string, any> | null) => {
    if (!contact) return null;
    if (contact.is_channel) return contact.id;
    return contact.other_user_id || contact.user_id || contact.employee_id || contact.id;
  };
  
  const getContactName = (contact: Record<string, any> | null) => {
    if (!contact) return '';
    if (contact.is_channel) return contact.name || 'Group';
    if (contact.other_user_first_name || contact.other_user_last_name) {
      return `${contact.other_user_first_name || ''} ${contact.other_user_last_name || ''}`.trim() || 'Colleague';
    }
    if (contact.first_name || contact.last_name) {
      return `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Colleague';
    }
    return contact.full_name || 'Colleague';
  };

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      setLoading(true);
      const [empRes, convRes, chanRes] = await Promise.all([
        employeeService.getEmployeesForChat().catch(() => ({ data: { data: [] } })),
        chatService.getConversations().catch(() => ({ data: { data: [] } })),
        chatService.getChannels().catch(() => ({ data: { data: [] } }))
      ]);
      setEmployees(empRes.data?.data || []);
      setConversations(convRes.data?.data || []);
      setChannels(chanRes.data?.data || []);
    } catch (error) {
      console.log('Error loading chat lists', error);
    } finally {
      setLoading(false);
    }
  };

  const tryDecrypt = (msg: string | null | undefined) => { 
    if (!msg) return '';
    try { 
      const d = cryptoUtils.decrypt(msg); 
      return d || msg; 
    } catch { return msg; } 
  };

  useEffect(() => {
    if (!socket) return;

    const onReceive = (msg: Record<string, any>) => {
      const contactId = getContactId(selectedChatRef.current);
      if (contactId && String(msg.sender_id) === String(contactId)) {
        setMessages(prev => {
          // Deduplicate by message_id
          if (msg.message_id && prev.some(m => m.message_id === msg.message_id)) return prev;
          return [...prev, { ...msg, message: tryDecrypt(msg.message) }];
        });
        socket.emit('messages_read', { sender_id: msg.sender_id });
      }
      loadLists();
    };

    const onChannelReceive = (msg: Record<string, any>) => {
      if (selectedChatRef.current?.is_channel && String(msg.channel_id) === String(selectedChatRef.current.id)) {
        setMessages(prev => {
          // Check if we already have this message (either by message_id or by temp_id if it's our own)
          if (msg.message_id && prev.some(m => m.message_id === msg.message_id)) return prev;
          
          // If it's our own message coming back from the server, replace the temp one
          const myId = getCurrentUserId();
          if (String(msg.sender_id) === myId) {
            const tempIndex = prev.findLastIndex(m => m.status === 'sending' && m.message === tryDecrypt(msg.message));
            if (tempIndex !== -1) {
              const newMsgs = [...prev];
              newMsgs[tempIndex] = { ...msg, message: tryDecrypt(msg.message), status: 'sent' };
              return newMsgs;
            }
          }

          return [...prev, { ...msg, message: tryDecrypt(msg.message) }];
        });
      }
      loadLists();
    };

    socket.on('receive_message', onReceive);
    socket.on('receive_channel_message', onChannelReceive);

    return () => {
      socket.off('receive_message', onReceive);
      socket.off('receive_channel_message', onChannelReceive);
    };
  }, [socket]);

  const selectChat = async (chat: Record<string, any>, isChannel = false) => {
    const fullChat = { ...chat, is_channel: isChannel };
    setSelectedChat(fullChat);
    selectedChatRef.current = fullChat;
    setLoading(true);
    setMessages([]);
    
    try {
      let res;
      if (isChannel) {
        res = await chatService.getChannelMessages(chat.id);
      } else {
        res = await chatService.getMessages(getContactId(chat));
        socket?.emit('messages_read', { sender_id: getContactId(chat) });
      }
      const msgs = ((res.data?.data || []) as Record<string, any>[]).map((m: Record<string, any>) => ({ ...m, message: tryDecrypt(m.message as string) }));
      setMessages(msgs);
    } catch (error) {
      console.log('Error fetching messages', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedChat || !socket) return;
    
    const content = newMessage.trim();
    const encrypted = cryptoUtils.encrypt(content);
    const tempId = `temp_${Date.now()}`;
    const myId = getCurrentUserId();
    
    const baseMsg = {
      message: content,
      sender_id: myId,
      created_at: new Date().toISOString(),
      temp_id: tempId,
      reply_to: replyTo,
      status: 'sending'
    };

    if (selectedChat.is_channel) {
      socket.emit('send_channel_message', { channel_id: selectedChat.id, message: encrypted, reply_to_id: replyTo?.message_id });
      setMessages(prev => [...prev, { ...baseMsg, channel_id: selectedChat.id }]);
    } else {
      socket.emit('send_message', { receiver_id: getContactId(selectedChat), message: encrypted, reply_to_id: replyTo?.message_id });
      setMessages(prev => [...prev, { ...baseMsg, receiver_id: getContactId(selectedChat) }]);
      sendStopTyping(getContactId(selectedChat));
    }

    setNewMessage('');
    setReplyTo(null);
  };

  const isUserTyping = () => {
    const contactId = getContactId(selectedChat);
    return typingUsers[contactId]?.length > 0;
  };

  const renderDateSeparator = (dateString: string) => {
    const date = new Date(dateString);
    let label = format(date, 'd MMMM yyyy');
    if (isToday(date)) label = 'TODAY';
    else if (isYesterday(date)) label = 'YESTERDAY';

    return (
      <View style={styles.dateSeparator}>
        <View style={[styles.dateBadge, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)' }]}>
          <Text style={[styles.dateText, { color: colors.subtext }]}>{label}</Text>
        </View>
      </View>
    );
  };

  const groupedMessages = useMemo(() => {
    const groups: (Record<string, any>)[] = [];
    messages.forEach((msg, idx) => {
      const showDate = idx === 0 || !isSameDay(new Date(messages[idx-1].created_at), new Date(msg.created_at));
      if (showDate) groups.push({ type: 'date', date: msg.created_at, id: `date_${msg.created_at}_${idx}` });
      
      // Ensure absolute uniqueness in the flattened list by combining original ID with type and index
      const msgId = msg.message_id || msg.temp_id || `temp_msg_${idx}`;
      groups.push({ ...msg, type: 'message', id: `msg_${msgId}_${idx}` });
    });
    return groups;
  }, [messages]);

  if (!configLoading && !isFeatureEnabled?.('enableChat')) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ShieldAlert size={64} color={colors.primary} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Communication Restricted</Text>
        <Text style={{ color: colors.subtext, marginTop: 10 }}>Contact Admin for access.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {!selectedChat ? (
        <Animated.View entering={FadeIn} style={styles.listContainer}>
          <View style={styles.listHeader}>
            <View style={styles.headerTop}>
              <Text style={[styles.listTitle, { color: colors.text }]}>HRMS Connect</Text>
              <View style={styles.listIcons}>
                <TouchableOpacity style={styles.iconBtn}><Camera size={22} color={colors.text} /></TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn}><Search size={22} color={colors.text} /></TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn}><MoreVertical size={22} color={colors.text} /></TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.tabBar}>
              <TouchableOpacity onPress={() => setActiveTab('direct')} style={styles.tab}>
                <Text style={[styles.tabText, { color: activeTab === 'direct' ? colors.primary : colors.subtext, fontWeight: activeTab === 'direct' ? 'bold' : '500' }]}>CHATS</Text>
                {activeTab === 'direct' && <Animated.View layout={Layout} style={[styles.activeTabLine, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveTab('channels')} style={styles.tab}>
                <Text style={[styles.tabText, { color: activeTab === 'channels' ? colors.primary : colors.subtext, fontWeight: activeTab === 'channels' ? 'bold' : '500' }]}>GROUPS</Text>
                {activeTab === 'channels' && <Animated.View layout={Layout} style={[styles.activeTabLine, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
            </View>
          </View>

          {loading && conversations.length === 0 ? (
            <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
          ) : (
            <FlatList
              data={activeTab === 'direct' ? conversations : channels}
              keyExtractor={(item, index) => item.id ? `item_${item.id}` : (item.channel_id ? `channel_${item.channel_id}` : `idx_${index}`)}
              renderItem={({ item, index }) => (
                <ChatListItem 
                  item={item} 
                  onPress={() => selectChat(item, activeTab === 'channels')}
                  isOnline={onlineUsers.includes(String(getContactId(item)))}
                  isTyping={typingUsers[getContactId(item)]?.length > 0}
                  colors={colors}
                  idx={index}
                />
              )}
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Animated.View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={[styles.roomHeader, { backgroundColor: colors.background, borderBottomWidth: 0.5, borderBottomColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
            <TouchableOpacity onPress={() => { setSelectedChat(null); selectedChatRef.current = null; }} style={styles.backBtn}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.headerInfo} activeOpacity={0.7} onPress={() => {}}>
              <View style={[styles.headerAvatar, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                {selectedChat.is_channel ? <Users size={20} color={colors.primary} /> : <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{getContactName(selectedChat).charAt(0)}</Text>}
              </View>
              <View style={styles.headerNames}>
                <Text style={[styles.roomName, { color: colors.text }]} numberOfLines={1}>{getContactName(selectedChat)}</Text>
                <Text style={[styles.roomStatus, { color: colors.subtext }]}>
                  {isUserTyping() ? 'typing...' : (onlineUsers.includes(String(getContactId(selectedChat))) ? 'online' : 'away')}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.roomIcons}>
              <TouchableOpacity style={styles.roomIconBtn}><Video size={20} color={colors.text} /></TouchableOpacity>
              <TouchableOpacity style={styles.roomIconBtn}><Phone size={20} color={colors.text} /></TouchableOpacity>
              <TouchableOpacity style={styles.roomIconBtn}><MoreVertical size={20} color={colors.text} /></TouchableOpacity>
            </View>
          </View>

          <View style={{ flex: 1, backgroundColor: isDark ? '#0b141a' : '#efe7de' }}>
            <FlatList
              ref={scrollViewRef}
              data={groupedMessages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }: { item: Record<string, any> }) => {
                if (item.type === 'date') return renderDateSeparator(item.date as string);
                return (
                  <MessageBubble 
                    message={item as Record<string, any>} 
                    isMe={isMessageMine(item as { sender_id?: string | number })} 
                    colors={colors}
                    themeMode={theme.mode}
                    onLongPress={(m: Record<string, any>) => { setSelectedMessage(m); setShowOptions(true); }}
                    onReplyPress={setReplyTo}
                  />
                );
              }}
              contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {replyTo && (
            <Animated.View entering={FadeInUp} style={[styles.replyPreview, { backgroundColor: isDark ? '#1e293b' : '#fff', borderLeftColor: colors.primary }]}>
               <View style={{ flex: 1 }}>
                  <Text style={[styles.replyUser, { color: colors.primary }]}>{replyTo.sender_name || 'Message'}</Text>
                  <Text style={[styles.replyText, { color: colors.subtext }]} numberOfLines={1}>{replyTo.message}</Text>
               </View>
               <TouchableOpacity onPress={() => setReplyTo(null)}><X size={18} color={colors.subtext} /></TouchableOpacity>
            </Animated.View>
          )}

          <ChatInput 
            value={newMessage}
            onChangeText={(t: string) => {
              setNewMessage(t);
              if (selectedChat && !selectedChat.is_channel) {
                sendTyping(getContactId(selectedChat));
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => sendStopTyping(getContactId(selectedChat)), 2000);
              }
            }}
            onSend={handleSend}
            onAttach={() => {}}
            isRecording={isRecording}
            recordingDuration={recordingDuration}
            onStartRecording={() => setIsRecording(true)}
            onStopRecording={() => setIsRecording(false)}
            colors={colors}
            themeMode={theme.mode}
          />
        </KeyboardAvoidingView>
      )}

      {showOptions && selectedMessage && (
        <View style={styles.overlay}>
           <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowOptions(false)} />
           <Animated.View entering={SlideInDown} style={[styles.options, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
              <View style={styles.reactions}>
                 {['❤️', '👍', '😂', '😮', '😢', '🙏'].map((e: string) => (
                   <TouchableOpacity key={e} onPress={() => { reactToMessage(selectedMessage.message_id, e); setShowOptions(false); }}>
                      <Text style={{ fontSize: 24 }}>{e}</Text>
                   </TouchableOpacity>
                 ))}
              </View>
              <TouchableOpacity style={styles.option} onPress={() => { setReplyTo(selectedMessage); setShowOptions(false); }}>
                 <ReplyIcon size={20} color={colors.subtext} />
                 <Text style={[styles.optionText, { color: colors.text }]}>Reply</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.option} onPress={async () => { await Clipboard.setStringAsync(selectedMessage.message); setShowOptions(false); }}>
                 <Copy size={20} color={colors.subtext} />
                 <Text style={[styles.optionText, { color: colors.text }]}>Copy</Text>
              </TouchableOpacity>
           </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorTitle: { fontSize: 22, fontWeight: 'bold' },
  
  listContainer: { flex: 1 },
  listHeader: { paddingHorizontal: 16, paddingTop: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  listTitle: { fontSize: 22, fontWeight: '700' },
  listIcons: { flexDirection: 'row', gap: 16 },
  iconBtn: { padding: 4 },
  
  tabBar: { flexDirection: 'row', gap: 24 },
  tab: { paddingVertical: 10, position: 'relative' },
  tabText: { fontSize: 14, letterSpacing: 0.5 },
  activeTabLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, borderRadius: 1.5 },
  
  roomHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 8 },
  backBtn: { padding: 8 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerNames: { marginLeft: 12, flex: 1 },
  roomName: { fontSize: 16, fontWeight: '600' },
  roomStatus: { fontSize: 12, marginTop: 1 },
  roomIcons: { flexDirection: 'row', gap: 4 },
  roomIconBtn: { padding: 8 },
  
  dateSeparator: { alignItems: 'center', marginVertical: 16 },
  dateBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, elevation: 1 },
  dateText: { fontSize: 11, fontWeight: '700' },
  
  replyPreview: { marginHorizontal: 8, marginBottom: 8, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, elevation: 2 },
  replyUser: { fontSize: 13, fontWeight: '700' },
  replyText: { fontSize: 14, marginTop: 2 },
  
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  options: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  reactions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 16 },
  optionText: { fontSize: 16, fontWeight: '500' },
});
