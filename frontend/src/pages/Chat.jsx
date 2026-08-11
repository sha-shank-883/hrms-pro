import React, { useEffect, useState, useRef } from 'react';
import { chatService, employeeService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import io from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';
import { encrypt as e2eEncrypt, decrypt as e2eDecrypt } from '../utils/cryptoBrowser';

const Chat = () => {
  const { user } = useAuth();
  const { markAsRead } = useNotifications();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]); // For search filtering
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typing, setTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [callStatus, setCallStatus] = useState(null); // 'voice', 'video', 'screen'
  const [isInCall, setIsInCall] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // For employee search
  const [messagePagination, setMessagePagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNext: false,
    hasPrev: false
  });
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);

  // Initialize Socket.io connection - RUNS ONCE
  useEffect(() => {
    // Get tenant ID from localStorage
    const tenantId = localStorage.getItem('tenant_id') || 'tenant_default';
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    const socketUrl = apiUrl.replace('/api', '');

    // Initialize Socket.io connection
    socketRef.current = io(socketUrl, {
      withCredentials: true,
      query: {
        tenantId: tenantId
      }
    });

    socketRef.current.on('connect', () => {
      
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    socketRef.current.on('reconnect', () => {
      
    });

    socketRef.current.on('update_online_users', (userIds) => {
      
      setOnlineUsers(new Set(userIds));
    });

    // WebRTC signaling
    socketRef.current.on('call_initiated', async (data) => {
      const callTypeText = data.callType === 'voice' ? 'voice call' :
        data.callType === 'video' ? 'video call' :
          'screen sharing session';
      if (confirm(`Incoming ${callTypeText} from ${data.caller_name}. Accept?`)) {
        await handleAcceptCall(data);
      } else {
        // Reject call
        socketRef.current.emit('reject_call', {
          caller_id: data.caller_id
        });
      }
    });

    socketRef.current.on('call_accepted', async (data) => {
      await handleCallAccepted(data);
    });

    socketRef.current.on('call_rejected', () => {
      alert('Call was rejected by the other user.');
      endCall();
    });

    socketRef.current.on('ice_candidate', async (data) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          console.error('Error adding received ice candidate', error);
        }
      }
    });

    socketRef.current.on('call_ended', () => {
      endCall();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle user joining - runs when user object is available or changes
  useEffect(() => {
    if (user && user.userId && socketRef.current) {
      if (socketRef.current.connected) {
        
        socketRef.current.emit('join', {
          userId: user.userId,
          token: localStorage.getItem('token')
        });
      } else {
        const onConnect = () => {
          
          socketRef.current.emit('join', {
            userId: user.userId,
            token: localStorage.getItem('token')
          });
        };
        socketRef.current.on('connect', onConnect);
        return () => {
          socketRef.current.off('connect', onConnect);
        };
      }
    }
  }, [user]);

  // Handle incoming messages - depends on selectedUser
  useEffect(() => {
    if (!socketRef.current) return;

    const handleReceiveMessage = async (data) => {
      

      const decryptedMessageText = await e2eDecrypt(data.message);

      // Always add the message to the messages list if we're in the correct conversation
      if (selectedUser &&
        (data.sender_id === selectedUser.user_id || data.receiver_id === selectedUser.user_id)) {
        
        setMessages(prev => {
          // Prevent duplicate messages
          if (prev.some(m => m.message_id === data.message_id)) return prev;

          return [...prev, {
            message_id: data.message_id,
            sender_id: data.sender_id,
            receiver_id: data.receiver_id,
            message: decryptedMessageText,
            created_at: data.created_at,
            is_read: false,
            attachment_url: data.attachment_url || null,
            attachment_type: data.attachment_type || null,
            attachment_name: data.attachment_name || null
          }];
        });
      } else {
        
      }

      // Always update the conversations list to show new messages and unread counts
      setTimeout(() => {
        loadConversations();
      }, 100);

      // If message is from current selected user, mark it as read immediately
      if (selectedUser && data.sender_id === selectedUser.user_id) {
        socketRef.current.emit('mark_read', { sender_id: selectedUser.user_id });
      }
    };

    const handleTyping = (data) => {
      if (selectedUser && data.sender_id === selectedUser.user_id) {
        setTyping(true);
      }
    };

    const handleStopTyping = (data) => {
      if (selectedUser && data.sender_id === selectedUser.user_id) {
        setTyping(false);
      }
    };

    const handleMessagesRead = (data) => {
      // If the other person read my messages
      if (selectedUser && data.reader_id === selectedUser.user_id) {
        setMessages(prev => prev.map(msg =>
          msg.sender_id === user.userId ? { ...msg, is_read: true } : msg
        ));
      }
    };

    socketRef.current.on('receive_message', handleReceiveMessage);
    socketRef.current.on('user_typing', handleTyping);
    socketRef.current.on('user_stop_typing', handleStopTyping);
    socketRef.current.on('messages_read', handleMessagesRead);

    return () => {
      socketRef.current.off('receive_message', handleReceiveMessage);
      socketRef.current.off('user_typing', handleTyping);
      socketRef.current.off('user_stop_typing', handleStopTyping);
      socketRef.current.off('messages_read', handleMessagesRead);
    };
  }, [selectedUser]);

  // Load messages when selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      loadMessages();
      // Mark messages as read when opening conversation
      if (socketRef.current) {
        socketRef.current.emit('mark_read', { sender_id: selectedUser.user_id });
      }
    }
  }, [selectedUser]);

  // Initial data load
  useEffect(() => {
    loadEmployees();
    loadConversations();
    markAsRead('chat');
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Filter employees based on search term
  useEffect(() => {
    loadEmployees(); // Load employees from backend with search term
  }, [searchTerm]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startNewChat = (user) => {
    handleSelectUser(user);
    setSearchTerm(''); // Clear search when starting new chat
  };

  const selectConversation = (conv) => {
    // Find the employee data from the employees list
    const employee = employees.find(emp => emp.user_id === conv.other_user_id);
    if (employee) {
      handleSelectUser(employee);
    } else {
      // If employee not found in current list, create a minimal user object
      handleSelectUser({
        user_id: conv.other_user_id,
        first_name: conv.other_user_first_name || conv.other_user_email?.split('@')[0] || 'User',
        last_name: conv.other_user_last_name || '',
        email: conv.other_user_email
      });
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    // Load all employees when search is cleared
    loadEmployees();
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    sendMessage(e);
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear this chat? This will delete all messages.')) {
      setMessages([]);
      // Optionally, you could also delete messages from the backend here
    }
  };

  const loadEmployees = async () => {
    try {
      // Use the new endpoint for chat
      const params = searchTerm ? { search: searchTerm } : {};
      const response = await employeeService.getForChat(params);
      setEmployees(response.data);
      setFilteredEmployees(response.data); // Initialize filtered employees
    } catch (error) {
      console.error('Failed to load employees:', error);
      setError('Failed to load employees: ' + (error.response?.data?.message || error.message));
    }
  };

  const loadConversations = async () => {
    try {
      const response = await chatService.getConversations();
      const decryptedConversations = await Promise.all(response.data.map(async (conv) => {
        return { ...conv, last_message: await e2eDecrypt(conv.last_message) };
      }));
      setConversations(decryptedConversations);
      setError('');
    } catch (error) {
      setError('Failed to load conversations: ' + (error.response?.data?.message || error.message));
      setConversations([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (page = 1) => {
    if (!selectedUser) return;

    try {
      const params = {
        page: page,
        limit: 20
      };

      const response = await chatService.getMessages(selectedUser.user_id, params);
      const newMessages = await Promise.all(response.data.map(async (msg) => {
        return { ...msg, message: await e2eDecrypt(msg.message) };
      }));
      const pagination = response.pagination;

      if (page === 1) {
        // First page, replace messages
        setMessages(newMessages);
        setHasMoreMessages(pagination.hasNext);
      } else {
        // Subsequent pages, prepend to existing messages
        setMessages(prev => [...newMessages, ...prev]);
        setHasMoreMessages(pagination.hasNext);
      }

      setMessagePagination(pagination);
      setError('');
    } catch (error) {
      setError('Failed to load messages: ' + (error.response?.data?.message || error.message));
    }
  };

  const loadMoreMessages = () => {
    if (hasMoreMessages && messagePagination.hasNext) {
      loadMessages(messagePagination.currentPage + 1);
    }
  };

  const handleSelectUser = (user) => {
    // If clicking the same user, do nothing
    if (selectedUser && user.user_id === selectedUser.user_id) {
      return;
    }

    setSelectedUser(user);
    // Reset pagination when selecting a new user
    setMessagePagination({
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 20,
      hasNext: false,
      hasPrev: false
    });
    setHasMoreMessages(true);
    setMessages([]); // Clear messages when selecting new user
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !selectedUser) return;

    try {
      let attachmentData = null;

      if (selectedFile) {
        setUploading(true);
        const uploadResponse = await chatService.uploadFile(selectedFile);
        attachmentData = {
          attachment_url: uploadResponse.data.url,
          attachment_type: selectedFile.type,
          attachment_name: selectedFile.name
        };
      }

      const encryptedMsg = await e2eEncrypt(newMessage);

      const messageData = {
        receiver_id: selectedUser.user_id,
        message: encryptedMsg,
        ...attachmentData
      };

      // Emit via socket for real-time delivery
      socketRef.current.emit('send_message', messageData);

      // Clear input and file
      setNewMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Update conversations immediately
      loadConversations();
    } catch (error) {
      setError('Failed to send message: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleTyping = () => {
    if (!selectedUser) return;

    socketRef.current.emit('typing', {
      receiver_id: selectedUser.user_id,
      sender_id: user.userId
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('stop_typing', {
        receiver_id: selectedUser.user_id,
        sender_id: user.userId
      });
    }, 2000);
  };

  const onEmojiClick = (emojiObject) => {
    setNewMessage(prev => prev + emojiObject.emoji);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Delete a message
  const deleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      await chatService.deleteMessage(messageId);
      // Remove the message from the UI
      setMessages(prevMessages => prevMessages.filter(msg => msg.message_id !== messageId));
      // Reload conversations to update the last message
      loadConversations();
    } catch (error) {
      setError('Failed to delete message: ' + (error.response?.data?.message || error.message));
    }
  };

  // Delete entire conversation (delete all messages between two users)
  const deleteConversation = async (otherUserId) => {
    if (!window.confirm('Are you sure you want to delete this entire conversation? This cannot be undone.')) {
      return;
    }

    try {
      // Delete conversation using the new API endpoint
      await chatService.deleteConversation(otherUserId);

      // If we're currently viewing this conversation, clear the messages
      if (selectedUser && selectedUser.user_id === otherUserId) {
        setMessages([]);
      }

      // Reload conversations
      loadConversations();
    } catch (error) {
      setError('Failed to delete conversation: ' + (error.response?.data?.message || error.message));
    }
  };

  // WebRTC Functions
  const initiatePeerConnection = async () => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    peerConnectionRef.current = new RTCPeerConnection(configuration);

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice_candidate', {
          receiver_id: selectedUser.user_id,
          candidate: event.candidate
        });
      }
    };

    peerConnectionRef.current.ontrack = (event) => {
      
      const remStream = event.streams[0];
      setRemoteStream(remStream);

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remStream;
        // Ensure video plays
        remoteVideoRef.current.play().catch(err => console.error('Error playing remote video:', err));
      }
    };
  };

  const startVoiceCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
      setCallStatus('voice');
      setIsInCall(true);

      await initiatePeerConnection();
      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      socketRef.current.emit('initiate_call', {
        receiver_id: selectedUser.user_id,
        caller_id: user.userId,
        caller_name: user.email,
        callType: 'voice',
        offer: offer
      });
    } catch (error) {
      console.error('Error starting voice call:', error);
      setError('Failed to start voice call. Please check your microphone permissions.');
    }
  };

  const startVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setLocalStream(stream);
      setCallStatus('video');
      setIsInCall(true);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      await initiatePeerConnection();
      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      socketRef.current.emit('initiate_call', {
        receiver_id: selectedUser.user_id,
        caller_id: user.userId,
        caller_name: user.email,
        callType: 'video',
        offer: offer
      });
    } catch (error) {
      console.error('Error starting video call:', error);
      setError('Failed to start video call. Please check your camera and microphone permissions.');
    }
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      setLocalStream(stream);
      setCallStatus('screen');
      setIsInCall(true);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      await initiatePeerConnection();
      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      socketRef.current.emit('initiate_call', {
        receiver_id: selectedUser.user_id,
        caller_id: user.userId,
        caller_name: user.email,
        callType: 'screen',
        offer: offer
      });

      // End call when screen sharing stops
      stream.getVideoTracks()[0].onended = () => {
        endCall();
      };
    } catch (error) {
      console.error('Error starting screen share:', error);
      setError('Failed to start screen sharing.');
    }
  };

  const handleAcceptCall = async (data) => {
    try {
      // For screen sharing, receiver doesn't need to share screen - just receive it
      let stream;
      if (data.callType === 'screen') {
        // Receiver can optionally enable audio/video for response
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } else {
        const constraints = data.callType === 'voice'
          ? { audio: true, video: false }
          : { audio: true, video: true };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      }

      setLocalStream(stream);
      setCallStatus(data.callType);
      setIsInCall(true);

      if (data.callType === 'video' && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      await initiatePeerConnection();
      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      socketRef.current.emit('accept_call', {
        caller_id: data.caller_id,
        answer: answer
      });
    } catch (error) {
      console.error('Error accepting call:', error);
      setError('Failed to accept call: ' + error.message);
    }
  };

  const handleCallAccepted = async (data) => {
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
    } catch (error) {
      console.error('Error handling call acceptance:', error);
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus(null);
    setIsInCall(false);
    peerConnectionRef.current = null;

    if (selectedUser) {
      socketRef.current.emit('end_call', {
        receiver_id: selectedUser.user_id
      });
    }
  };

  const renderAttachment = (msg) => {
    if (!msg.attachment_url) return null;

    const isImage = msg.attachment_type?.startsWith('image/');
    const isVideo = msg.attachment_type?.startsWith('video/');
    const isAudio = msg.attachment_type?.startsWith('audio/');

    if (isImage) {
      return (
        <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
          <img
            src={msg.attachment_url}
            alt="attachment"
            className="max-w-[250px] max-h-[250px] rounded-lg mt-2 cursor-pointer"
          />
        </a>
      );
    } else if (isVideo) {
      return (
        <video controls className="max-w-[300px] rounded-lg mt-2">
          <source src={msg.attachment_url} type={msg.attachment_type} />
        </video>
      );
    } else if (isAudio) {
      return (
        <audio controls className="mt-2 w-[250px]">
          <source src={msg.attachment_url} type={msg.attachment_type} />
        </audio>
      );
    } else {
      return (
        <a
          href={msg.attachment_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 mt-2 p-2 bg-black/10 rounded text-inherit no-underline"
        >
          <span><i className="fas fa-paperclip"></i></span>
          <span>{msg.attachment_name || 'Download File'}</span>
        </a>
      );
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="h-[80vh] flex flex-col overflow-hidden max-h-screen">
      {error && <div className="error m-4 p-4 bg-red-50 rounded">{error}</div>}

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Conversations List */}
        <div className="w-80 border-r border-neutral-200 flex flex-col bg-white">
          <div className="p-6 border-b border-neutral-200">
            <h3 className="mb-4 text-lg font-semibold text-neutral-900">Conversations</h3>
            <details>
              <summary className="cursor-pointer text-primary-500 mb-2 font-medium">Start New Chat</summary>
              {/* Search Input */}
              <div className="mb-4">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Search by name, email, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input flex-1 text-sm p-2 rounded border border-neutral-300"
                  />
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className="btn btn-outline p-2 text-sm rounded border border-neutral-300 bg-white"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-[200px] overflow-y-auto mt-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`::-webkit-scrollbar { display: none; }`}</style>
                  {filteredEmployees.length === 0 ? (
                  <div className="p-2 text-neutral-500 italic">
                    {searchTerm ? 'No employees found matching your search' : 'No employees available'}
                  </div>
                ) : (
                  filteredEmployees.map(emp => (
                    <div
                      key={emp.employee_id}
                      onClick={() => startNewChat(emp)}
                      className={`p-3 cursor-pointer rounded-lg mb-1 hover:bg-gray-100 ${selectedUser?.employee_id === emp.employee_id ? 'bg-blue-50 border border-primary-500' : 'border border-transparent'}`}
                    >
                      <div className="font-medium flex items-center gap-2">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white font-semibold text-xs">
                            {emp.first_name?.charAt(0)}{emp.last_name?.charAt(0)}
                          </div>
                          {onlineUsers.has(emp.user_id) && (
                            <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border border-white"></div>
                          )}
                        </div>
                        <div>
                          <div>{emp.first_name} {emp.last_name}</div>
                          {emp.department_name && (
                            <span className="font-normal text-xs text-neutral-500">
                              {emp.department_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-neutral-500 ml-10">
                        {emp.email}
                        {emp.position && ` • ${emp.position}`}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </details>
          </div>

          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`::-webkit-scrollbar { display: none; }`}</style>
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">
                No conversations yet. Start a new chat!
              </div>
            ) : (
              conversations.filter(conv => {
                if (!searchTerm) return true;
                const searchLower = searchTerm.toLowerCase();
                const name = conv.other_user_first_name ? `${conv.other_user_first_name} ${conv.other_user_last_name}` : '';
                const email = conv.other_user_email || '';
                return name.toLowerCase().includes(searchLower) || email.toLowerCase().includes(searchLower);
              }).map((conv) => (
                <div
                  key={conv.other_user_id}
                  onClick={() => selectConversation(conv)}
                  className={`p-4 cursor-pointer border-b border-neutral-100 relative ${selectedUser?.user_id === conv.other_user_id ? 'bg-blue-50 border-l-[3px] border-l-primary-500' : 'bg-white border-l-[3px] border-l-transparent'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold flex-1 flex items-center gap-2">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white font-semibold text-xs">
                          {conv.other_user_first_name ? conv.other_user_first_name.charAt(0) : (conv.other_user_email?.split('@')[0]?.charAt(0)?.toUpperCase() || 'U')}
                        </div>
                        {onlineUsers.has(conv.other_user_id) && (
                          <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border border-white"></div>
                        )}
                      </div>
                      <div>
                        {conv.other_user_first_name ? `${conv.other_user_first_name} ${conv.other_user_last_name}` : (conv.other_user_email?.split('@')[0] || 'User')}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {conv.unread_count > 0 && (
                        <span className="badge badge-danger text-[0.7rem] min-w-[20px] bg-red-500 text-white rounded-full flex items-center justify-center">{conv.unread_count}</span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.other_user_id);
                        }}
                        className="bg-transparent border-none cursor-pointer text-sm p-0.5 text-neutral-400 hover:text-red-500"
                        title="Delete conversation"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-neutral-500 overflow-hidden text-ellipsis whitespace-nowrap ml-10">
                    {conv.last_message}
                  </div>
                  <div className="text-xs text-neutral-400 mt-1 ml-10">
                    {new Date(conv.last_message_time).toLocaleString()}
                  </div>
                </div>
              ))

            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-neutral-50 max-h-full h-full">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white font-semibold">
                      {selectedUser.first_name?.charAt(0)}{selectedUser.last_name?.charAt(0)}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: onlineUsers.has(selectedUser.user_id) ? '#10b981' : '#6b7280' }} />
                  </div>
                  <div>
                    <h3 className="mb-0.5 text-base font-semibold">{selectedUser.first_name} {selectedUser.last_name}</h3>
                    <div className="text-xs text-neutral-500">{onlineUsers.has(selectedUser.user_id) ? 'Online' : 'Offline'}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-outline p-2 text-lg border border-neutral-200 bg-white rounded"
                    onClick={startVoiceCall}
                    title="Voice Call"
                    disabled={isInCall}
                  >
                    <i className="fas fa-phone"></i>
                  </button>
                  <button
                    className="btn btn-outline p-2 text-lg border border-neutral-200 bg-white rounded"
                    onClick={startVideoCall}
                    title="Video Call"
                    disabled={isInCall}
                  >
                    <i className="fas fa-video"></i>
                  </button>
                  <button
                    className="btn btn-outline p-2 text-lg border border-neutral-200 bg-white rounded"
                    onClick={startScreenShare}
                    title="Screen Share"
                    disabled={isInCall}
                  >
                    <i className="fas fa-desktop"></i>
                  </button>
                  <button
                    className="btn btn-outline p-2 text-lg border border-neutral-200 bg-white rounded text-neutral-400 hover:text-red-500"
                    onClick={() => deleteConversation(selectedUser.user_id)}
                    title="Delete Conversation"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>

              {/* Video Call Area */}
              {isInCall && (
                <div className="p-4 bg-black relative" style={{ height: '400px' }}>
                  <div className="relative w-full h-full">
                    {/* Remote Video/Screen */}
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className={`w-full h-full rounded-lg bg-black ${callStatus === 'screen' ? 'object-contain' : 'object-cover'}`}
                    />
                    {/* No remote stream message */}
                    {!remoteStream && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-center">
                        <div className="spinner-border text-light mb-2" role="status"></div>
                        <div>Waiting for connection...</div>
                      </div>
                    )}
                    {/* Local Video Overlay */}
                    <div className="absolute bottom-4 right-4 rounded-lg overflow-hidden shadow-md border-2 border-white" style={{ width: '150px', height: '100px' }}>
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover bg-[#333]"
                      />
                    </div>
                    {/* Call Controls */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 z-10">
                      <button
                        onClick={endCall}
                        className="btn btn-danger w-[50px] h-[50px] rounded-full flex items-center justify-center text-xl bg-red-500 text-white border-none cursor-pointer"
                      >
                        <i className="fas fa-phone-slash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                {hasMoreMessages && (
                  <div className="text-center mb-4">
                    <button
                      onClick={loadMoreMessages}
                      className="btn btn-sm btn-outline px-3 py-1 text-xs rounded-full border border-neutral-300 bg-white"
                    >
                      Load older messages
                    </button>
                  </div>
                )}

                {messages.length === 0 ? (
                  <div className="text-center text-neutral-400 mt-8">
                    <div className="text-5xl mb-4 opacity-50">💬</div>
                    <p>No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isOwn = msg.sender_id === user.userId;
                    const showAvatar = !isOwn && (index === 0 || messages[index - 1].sender_id !== msg.sender_id);

                    return (
                      <div
                        key={msg.message_id || index}
                        className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isOwn && (
                          <div className="w-8 mr-2 flex items-end">
                            {showAvatar ? (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white font-semibold text-xs">
                                {selectedUser.first_name?.charAt(0)}{selectedUser.last_name?.charAt(0)}
                              </div>
                            ) : <div className="w-8" />}
                          </div>
                        )}

                        <div className="max-w-[70%]">
                          <div
                            className={`px-4 py-3 shadow-sm relative rounded-2xl ${
                              isOwn
                                ? 'rounded-tr-none bg-primary-500 text-white'
                                : 'rounded-tl-none bg-white text-neutral-900'
                            }`}
                          >
                            {msg.message}
                            {renderAttachment(msg)}
                          </div>
                          <div className="text-xs opacity-80 mt-1 text-right flex items-center justify-end gap-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {msg.sender_id === user.userId && (
                              <span>
                                {msg.is_read ? (
                                  <i className="fas fa-check-double text-blue-400" title="Read"></i>
                                ) : (
                                  <i className="fas fa-check text-neutral-400" title="Sent"></i>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-neutral-200 bg-white">
                {uploading && (
                  <div className="mb-2 text-sm text-primary-500">
                    Uploading file...
                  </div>
                )}
                {selectedFile && (
                  <div className="mb-2 flex items-center gap-2 p-2 bg-neutral-100 rounded text-sm">
                    <i className="fas fa-file"></i>
                    <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{selectedFile.name}</span>
                    <button onClick={removeSelectedFile} className="bg-transparent border-none cursor-pointer text-red-500">
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                )}

                <div className="flex gap-3 items-end">
                  <div className="relative">
                    <button
                      className="btn btn-outline p-3 rounded-full border border-neutral-300"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      <i className="far fa-smile"></i>
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-full left-0 mb-2 z-50">
                        <EmojiPicker onEmojiClick={onEmojiClick} />
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      className="btn btn-outline p-3 rounded-full border border-neutral-300"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <i className="fas fa-paperclip"></i>
                    </button>
                  </div>

                  <form onSubmit={handleSendMessage} className="flex-1 flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      placeholder="Type a message..."
                      className="form-input flex-1 p-3 rounded-3xl border border-neutral-300 outline-none"
                    />
                    <button
                      type="submit"
                      className="btn btn-primary p-3 rounded-full w-12 h-12 flex items-center justify-center bg-primary-500 text-white border-none"
                      disabled={(!newMessage.trim() && !selectedFile) || uploading}
                    >
                      <i className="fas fa-paper-plane"></i>
                    </button>
                  </form>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-400">
              <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-6">
                <i className="fas fa-comments text-4xl text-neutral-300"></i>
              </div>
              <h3 className="text-xl font-semibold text-neutral-700 mb-2">Select a conversation</h3>
              <p>Choose a contact from the left to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div >
  );
};

export default Chat;
