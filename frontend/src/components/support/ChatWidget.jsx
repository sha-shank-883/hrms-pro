import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { supportService } from '../../services/supportService';
import { FaCommentDots, FaTimes, FaPaperPlane, FaRobot, FaUser, FaHeadset, FaCheck, FaSpinner, FaMinus } from 'react-icons/fa';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [showFAQs, setShowFAQs] = useState(false);
  const [faqs, setFaqs] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const loadingTimeoutRef = useRef(null);
  const { user } = useAuth();
  const { socket } = useSocket();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!socket || !user) return;

    socket.emit('support:join', { userId: user.userId, role: user.role });

    socket.on('support:receive_message', (message) => {
      setMessages(prev => [...prev, message]);
      if (message.sender_type !== 'user') {
        setIsLoading(false);
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      }
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
    });

    socket.on('support:typing', () => setIsAgentTyping(true));
    socket.on('support:stop_typing', () => setIsAgentTyping(false));
    socket.on('support:agent_join', (data) => {
      setChat(prev => prev ? { ...prev, agent_id: data.agentId, is_ai_active: false } : prev);
    });

    return () => {
      socket.off('support:receive_message');
      socket.off('support:typing');
      socket.off('support:stop_typing');
      socket.off('support:agent_join');
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, [socket, user, isOpen]);

  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      setUnreadCount(0);
      if (chat) {
        socket?.emit('support:mark_read', { chatId: chat.chat_id });
      }
    }
  }, [isOpen, unreadCount, chat, socket]);

  const startChat = async () => {
    try {
      setIsLoading(true);
      const result = await supportService.startChat();
      setChat(result.data);
      setMessages([{
        message_id: 'welcome',
        sender_type: 'system',
        message: '👋 Welcome! How can we help you today?',
        created_at: new Date().toISOString()
      }]);

      const faqResult = await supportService.getFAQs({ limit: 5 });
      if (faqResult.articles?.length > 0) {
        setFaqs(faqResult.articles.slice(0, 5));
        setShowFAQs(true);
      }
    } catch (error) {
      console.error('Failed to start chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChatHistory = async (chatId) => {
    try {
      const result = await supportService.getChatHistory(chatId);
      setChat(result.data.chat);
      setMessages(result.data.messages);
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
  };

  const handleOpen = async () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
      if (!chat) {
        await startChat();
      } else {
        await loadChatHistory(chat.chat_id);
      }
    } else if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsMinimized(true);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !chat) return;

    const messageText = input.trim();
    setInput('');
    setShowFAQs(false);

    const tempMessage = {
      message_id: `temp-${Date.now()}`,
      sender_type: 'user',
      message: messageText,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMessage]);

    setIsLoading(true);

    try {
      if (socket?.connected) {
        socket.emit('support:send_message', {
          chatId: chat.chat_id,
          message: messageText
        });
        if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = setTimeout(() => {
          setIsLoading(false);
          loadingTimeoutRef.current = null;
        }, 30000);
      } else {
        const result = await supportService.askAI(messageText, chat.chat_id);
        const aiMessage = {
          message_id: `ai-${Date.now()}`,
          sender_type: result.data?.faq_matched ? 'ai' : 'ai',
          message_type: result.data?.faq_matched ? 'faq' : 'ai',
          message: result.data?.response || 'Unable to process your request.',
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFAQClick = async (faq) => {
    setShowFAQs(false);
    const msg = {
      message_id: `temp-${Date.now()}`,
      sender_type: 'user',
      message: faq.question,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, msg]);

    const reply = {
      message_id: `faq-${Date.now()}`,
      sender_type: 'ai',
      message_type: 'faq',
      message: faq.answer,
      created_at: new Date().toISOString()
    };
    setTimeout(() => {
      setMessages(prev => [...prev, reply]);
    }, 300);
  };

  const handleClose = async () => {
    if (chat && chat.chat_id) {
      try {
        await supportService.closeChat(chat.chat_id);
      } catch (e) {
        // silent
      }
    }
    setIsOpen(false);
    setChat(null);
    setMessages([]);
    setShowFAQs(false);
  };

  const renderMessage = (msg, index) => {
    const isUser = msg.sender_type === 'user';
    const isAI = msg.sender_type === 'ai' || msg.sender_type === 'system';
    const isFAQ = msg.message_type === 'faq';

    return (
      <div
        key={msg.message_id || index}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 ${index === 0 ? 'mt-auto' : ''}`}
      >
        <div className={`flex items-end gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
          <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs ${
            isUser ? 'bg-primary-500' : isFAQ ? 'bg-green-500' : 'bg-gray-400'
          } text-white`}>
            {isUser ? <FaUser size={10} /> : isFAQ ? <FaCheck size={10} /> : <FaRobot size={10} />}
          </div>
          <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-primary-500 text-white rounded-br-md'
              : isFAQ
                ? 'bg-green-50 border border-green-200 text-gray-800 rounded-bl-md'
                : 'bg-gray-100 text-gray-800 rounded-bl-md'
          }`}>
            {msg.message}
            <div className={`text-[10px] mt-1 ${isUser ? 'text-blue-200' : 'text-gray-400'}`}>
              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999]">
      {isOpen && (
        <div className={`mb-3 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ${
          isMinimized ? 'h-14' : 'h-[520px]'
        } w-[380px] max-w-[calc(100vw-40px)]`}>
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white cursor-pointer"
            onClick={() => setIsMinimized(!isMinimized)}>
            <div className="flex items-center gap-2">
              <FaHeadset className="text-lg" />
              <span className="font-semibold text-sm">Support</span>
            </div>
            <div className="flex items-center gap-2">
              {chat?.is_ai_active && (
                <span className="bg-primary-400/30 text-[10px] px-2 py-0.5 rounded-full">AI Active</span>
              )}
              <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="hover:bg-primary-500/40 p-1 rounded">
                <FaMinus size={12} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleClose(); }} className="hover:bg-primary-500/40 p-1 rounded">
                <FaTimes size={12} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="flex-1 h-[380px] overflow-y-auto p-4 bg-gray-50/50 space-y-1"
                style={{ scrollBehavior: 'smooth' }}>
                {messages.map((msg, idx) => renderMessage(msg, idx))}

                {isLoading && (
                  <div className="flex justify-start mb-3">
                    <div className="flex items-end gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-400 flex items-center justify-center text-white">
                        <FaRobot size={10} />
                      </div>
                      <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2.5">
                        <FaSpinner className="animate-spin text-gray-400" />
                      </div>
                    </div>
                  </div>
                )}

                {isAgentTyping && (
                  <div className="flex justify-start mb-3">
                    <div className="flex items-end gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-400 flex items-center justify-center text-white">
                        <FaHeadset size={10} />
                      </div>
                      <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {showFAQs && faqs.length > 0 && (
                <div className="px-4 py-2 bg-primary-50 border-t border-primary-100">
                  <p className="text-[11px] text-primary-600 font-medium mb-1.5">Common questions:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {faqs.map(faq => (
                      <button
                        key={faq.article_id}
                        onClick={() => handleFAQClick(faq)}
                        className="text-[11px] bg-white border border-primary-200 text-primary-700 rounded-full px-3 py-1 hover:bg-primary-100 transition-colors"
                      >
                        {faq.question.length > 40 ? faq.question.slice(0, 40) + '..' : faq.question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 p-3 bg-white">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="flex-1 border border-gray-300 rounded-full px-4 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <FaPaperPlane size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <button
        onClick={handleOpen}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-xl hover:shadow-2xl hover:scale-105 flex items-center justify-center transition-all duration-300 relative"
      >
        {isOpen && !isMinimized ? <FaTimes size={22} /> : <FaCommentDots size={22} />}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-md">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default ChatWidget;
