import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import { chatService, employeeService } from '../api';
import { 
  Send, Search, Zap, ArrowLeft, MoreVertical, Paperclip, CheckCheck, Users
} from 'lucide-react-native';
import { styled } from 'nativewind';
import Animated, { FadeInUp, SlideInRight } from 'react-native-reanimated';
import { PremiumCard } from '../components/ui/DesignSystem';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);
const StyledTextInput = styled(TextInput);
const StyledAnimatedView = styled(Animated.View);
const StyledSafeAreaView = styled(SafeAreaView);
const StyledKeyboardAvoidingView = styled(KeyboardAvoidingView);

export default function ChatScreen() {
  const { user } = useAuth();
  const { socket, onlineUsers } = useChat();
  const theme = useTheme();
  
  const [activeTab, setActiveTab] = useState<'direct' | 'channels'>('direct');
  const [conversations, setConversations] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [selectedChat, setSelectedChat] = useState<any>(null); // can be user or channel
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const scrollViewRef = useRef<any>(null);
  const selectedChatRef = useRef<any>(null);

  const getContactId = (contact: any) => contact.other_user_id || contact.user_id || contact.employee_id || contact.id;
  const getContactName = (contact: any) => {
    if (contact.other_user_first_name || contact.other_user_last_name) {
      return `${contact.other_user_first_name || ''} ${contact.other_user_last_name || ''}`.trim() || 'Colleague';
    }
    return `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Colleague';
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
        chatService.getChannels().catch(() => ({ data: { data: [] } })),
      ]);
      setEmployees(empRes.data.data || []);
      setConversations(convRes.data?.data || []);
      setChannels(chanRes.data?.data || []);
    } catch (error) {
      console.log('Chat load failure:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message: any) => {
      const currentChat = selectedChatRef.current;
      if (!currentChat) return;
      
      // If it's a direct message and we are in this direct chat
      if (!currentChat.is_channel) {
        const contactId = getContactId(currentChat);
        if (parseInt(message.sender_id) === parseInt(contactId) || parseInt(message.receiver_id) === parseInt(contactId)) {
          setMessages(prev => [...prev, message]);
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }
      }
    };

    const handleReceiveChannelMessage = (message: any) => {
      const currentChat = selectedChatRef.current;
      if (!currentChat) return;

      // If it's a channel message and we are in this channel
      if (currentChat.is_channel && parseInt(message.channel_id) === parseInt(currentChat.id)) {
        setMessages(prev => [...prev, message]);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('receive_channel_message', handleReceiveChannelMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('receive_channel_message', handleReceiveChannelMessage);
    };
  }, [socket]);

  const selectDirectChat = async (contact: any) => {
    setSelectedChat({ ...contact, is_channel: false });
    selectedChatRef.current = { ...contact, is_channel: false };
    setLoading(true);
    try {
      const { data } = await chatService.getMessages(getContactId(contact), { limit: 50 });
      setMessages(data.data || []);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 100);
    } catch (error) {
      console.log('Message sync failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectChannel = async (channel: any) => {
    setSelectedChat({ ...channel, is_channel: true });
    selectedChatRef.current = { ...channel, is_channel: true };
    setLoading(true);
    try {
      await chatService.joinChannel(channel.id);
      if (socket) {
        socket.emit('join_channel', channel.id);
      }
      const { data } = await chatService.getChannelMessages(channel.id, { limit: 50 });
      setMessages(data.data || []);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 100);
    } catch (error) {
      console.log('Channel sync failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat || !socket) return;
    
    if (selectedChat.is_channel) {
      const msgPayload = { channel_id: selectedChat.id, message: newMessage.trim() };
      socket.emit('send_channel_message', msgPayload);
      
      const tempMsg = { ...msgPayload, sender_id: user.userId || user.id, created_at: new Date().toISOString() };
      setMessages(prev => [...prev, tempMsg]);
    } else {
      const msgPayload = { receiver_id: getContactId(selectedChat), message: newMessage.trim() };
      socket.emit('send_message', msgPayload);
      
      const tempMsg = { ...msgPayload, sender_id: user.userId || user.id, created_at: new Date().toISOString() };
      setMessages(prev => [...prev, tempMsg]);
    }

    setNewMessage('');
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <StyledSafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      {!selectedChat ? (
        <StyledView className="flex-1">
          <StyledView style={{ backgroundColor: theme.colors.primary, padding: 24, paddingTop: 30, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }}>
            <StyledView className="flex-row justify-between items-center mb-6">
               <StyledView>
                  <StyledText className="text-3xl font-black text-white">Comms Hub</StyledText>
                  <StyledText className="text-white/60 font-bold text-xs uppercase tracking-widest mt-1">Secure Network</StyledText>
               </StyledView>
               <StyledView className="bg-white/20 p-3 rounded-2xl">
                  <Zap size={24} color="#fff" />
               </StyledView>
            </StyledView>

            {/* Segmented Control */}
            <StyledView className="flex-row bg-white/10 rounded-2xl p-1 mb-4">
              <StyledTouchableOpacity 
                className={`flex-1 py-2 rounded-xl items-center ${activeTab === 'direct' ? 'bg-white/20' : ''}`}
                onPress={() => setActiveTab('direct')}
              >
                <StyledText className="text-white font-bold text-xs uppercase tracking-wider">Direct</StyledText>
              </StyledTouchableOpacity>
              <StyledTouchableOpacity 
                className={`flex-1 py-2 rounded-xl items-center ${activeTab === 'channels' ? 'bg-white/20' : ''}`}
                onPress={() => setActiveTab('channels')}
              >
                <StyledText className="text-white font-bold text-xs uppercase tracking-wider">Channels</StyledText>
              </StyledTouchableOpacity>
            </StyledView>

            <StyledView className="bg-white/10 rounded-2xl px-4 py-3 flex-row items-center border border-white/20 mb-2">
              <Search size={18} color="#fff" />
              <StyledTextInput 
                className="flex-1 ml-3 text-white font-bold"
                placeholder="Search..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </StyledView>
          </StyledView>

          {loading ? (
            <StyledView className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </StyledView>
          ) : (
            <StyledScrollView className="flex-1 px-6 pt-10" showsVerticalScrollIndicator={false}>
               <StyledView className="flex-row items-center mb-6">
                  <StyledView className="h-[1px] flex-1 bg-gray-100 dark:bg-gray-800" />
                  <StyledText className="mx-4 text-[10px] font-black opacity-30 uppercase tracking-widest" style={{ color: theme.colors.subtext }}>
                    {activeTab === 'direct' ? 'Direct Messages' : 'Channels'}
                  </StyledText>
                  <StyledView className="h-[1px] flex-1 bg-gray-100 dark:bg-gray-800" />
               </StyledView>

               {activeTab === 'direct' ? (
                 conversations.map((conv, idx) => (
                   <StyledAnimatedView key={`dm-${idx}`} entering={FadeInUp.delay(idx * 50)}>
                     <StyledTouchableOpacity onPress={() => selectDirectChat(conv)}>
                       <PremiumCard className="mb-4 p-5 flex-row items-center">
                          <StyledView className="w-14 h-14 bg-blue-100 dark:bg-blue-900/20 rounded-[22px] items-center justify-center mr-4">
                             <StyledText className="text-blue-600 font-black text-xl">{getContactName(conv).charAt(0)}</StyledText>
                          </StyledView>
                          <StyledView className="flex-1">
                             <StyledText className="text-lg font-black" style={{ color: theme.colors.text }}>{getContactName(conv)}</StyledText>
                             <StyledText className="text-xs font-bold opacity-50 mt-1" style={{ color: theme.colors.subtext }} numberOfLines={1}>
                               {conv.last_message || 'Secure transmission...'}
                             </StyledText>
                          </StyledView>
                       </PremiumCard>
                     </StyledTouchableOpacity>
                   </StyledAnimatedView>
                 ))
               ) : (
                 channels.map((chan, idx) => (
                   <StyledAnimatedView key={`ch-${idx}`} entering={FadeInUp.delay(idx * 50)}>
                     <StyledTouchableOpacity onPress={() => selectChannel(chan)}>
                       <PremiumCard className="mb-4 p-5 flex-row items-center">
                          <StyledView className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/20 rounded-[22px] items-center justify-center mr-4">
                             <Users size={24} color="#4f46e5" />
                          </StyledView>
                          <StyledView className="flex-1">
                             <StyledText className="text-lg font-black" style={{ color: theme.colors.text }}># {chan.name}</StyledText>
                             <StyledText className="text-xs font-bold opacity-50 mt-1" style={{ color: theme.colors.subtext }} numberOfLines={1}>
                               {chan.description || 'General Discussion'}
                             </StyledText>
                          </StyledView>
                       </PremiumCard>
                     </StyledTouchableOpacity>
                   </StyledAnimatedView>
                 ))
               )}
               <StyledView className="h-20" />
            </StyledScrollView>
          )}
        </StyledView>
      ) : (
        <StyledKeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
           {/* Chat Header */}
           <StyledView className="bg-white dark:bg-gray-900 px-6 py-4 flex-row items-center border-b border-gray-100 dark:border-gray-800 shadow-sm z-10">
              <StyledTouchableOpacity onPress={() => setSelectedChat(null)} className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 items-center justify-center mr-4">
                 <ArrowLeft size={20} color={theme.colors.text} />
              </StyledTouchableOpacity>
              <StyledView className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl items-center justify-center mr-3">
                 {selectedChat.is_channel ? (
                    <Users size={20} color="#2563eb" />
                 ) : (
                    <StyledText className="text-blue-600 font-black">{getContactName(selectedChat).charAt(0)}</StyledText>
                 )}
              </StyledView>
              <StyledView className="flex-1">
                 <StyledText className="text-base font-black" style={{ color: theme.colors.text }}>
                   {selectedChat.is_channel ? `# ${selectedChat.name}` : getContactName(selectedChat)}
                 </StyledText>
                 <StyledView className="flex-row items-center">
                    <StyledView className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
                    <StyledText className="text-[10px] font-black text-green-500 uppercase">Secure Link Active</StyledText>
                 </StyledView>
              </StyledView>
              <StyledTouchableOpacity>
                 <MoreVertical size={20} color={theme.colors.text} />
              </StyledTouchableOpacity>
           </StyledView>

           <StyledScrollView 
             ref={scrollViewRef}
             className="flex-1 px-6 pt-6"
             contentContainerStyle={{ paddingBottom: 30 }}
           >
              {messages.map((msg, idx) => {
                const isMe = parseInt(msg.sender_id) === parseInt(user.userId || user.id);
                return (
                  <StyledAnimatedView key={idx} entering={SlideInRight.duration(300)} className={`mb-6 flex-row ${isMe ? 'justify-end' : 'justify-start'}`}>
                     <StyledView className={`max-w-[85%] p-4 rounded-[28px] ${isMe ? 'bg-blue-600 rounded-br-none shadow-lg shadow-blue-600/30' : 'bg-gray-100 dark:bg-gray-800 rounded-bl-none'}`}>
                        <StyledText className={`text-base font-bold ${isMe ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{msg.message}</StyledText>
                        <StyledView className="flex-row items-center justify-end mt-2 opacity-40">
                           <StyledText className={`text-[8px] font-black ${isMe ? 'text-white' : 'text-gray-500'}`}>
                             {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </StyledText>
                           {isMe && <CheckCheck size={10} color="#fff" style={{ marginLeft: 4 }} />}
                        </StyledView>
                     </StyledView>
                  </StyledAnimatedView>
                );
              })}
           </StyledScrollView>

           {/* Input Bar */}
           <StyledView className="bg-white dark:bg-gray-900 px-6 py-5 border-t border-gray-100 dark:border-gray-800 flex-row items-center">
              <StyledTouchableOpacity className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 items-center justify-center mr-3">
                 <Paperclip size={18} color={theme.colors.text} />
              </StyledTouchableOpacity>
              <StyledView className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-[24px] px-5 py-3 border border-gray-100 dark:border-gray-700 flex-row items-center">
                 <StyledTextInput 
                   className="flex-1 text-sm font-bold text-gray-900 dark:text-white"
                   placeholder="Type an intelligence report..."
                   placeholderTextColor="rgba(0,0,0,0.3)"
                   value={newMessage}
                   onChangeText={setNewMessage}
                   multiline
                 />
                 <StyledTouchableOpacity onPress={handleSendMessage} className={`w-8 h-8 rounded-full items-center justify-center ${newMessage.trim() ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <Send size={14} color="#fff" />
                 </StyledTouchableOpacity>
              </StyledView>
           </StyledView>
        </StyledKeyboardAvoidingView>
      )}
    </StyledSafeAreaView>
  );
}
