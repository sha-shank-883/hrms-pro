import React, { useEffect, useState, useRef } from 'react';
import { chatService, employeeService } from '../services';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';

const Chat = () => {
  const { user } = useAuth();
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

    // Initialize Socket.io connection
    socketRef.current = io('http://localhost:5001', {
      withCredentials: true,
      query: {
        tenantId: tenantId
      }
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id);
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    socketRef.current.on('reconnect', () => {
      console.log('Socket reconnected');
    });

    socketRef.current.on('update_online_users', (userIds) => {
      console.log('Online users updated:', userIds);
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
        console.log('User available, joining with user ID:', user.userId);
        socketRef.current.emit('join', user.userId);
      } else {
        const onConnect = () => {
          console.log('Socket connected (in user effect), joining with user ID:', user.userId);
          socketRef.current.emit('join', user.userId);
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

    const handleReceiveMessage = (data) => {
      console.log('Received message:', data);

      // Always add the message to the messages list if we're in the correct conversation
      if (selectedUser &&
        (data.sender_id === selectedUser.user_id || data.receiver_id === selectedUser.user_id)) {
        console.log('Adding message to conversation with:', selectedUser.user_id);
        setMessages(prev => {
          // Prevent duplicate messages
          if (prev.some(m => m.message_id === data.message_id)) return prev;

          return [...prev, {
            message_id: data.message_id,
            sender_id: data.sender_id,
            receiver_id: data.receiver_id,
            message: data.message,
            created_at: data.created_at,
            is_read: false,
            attachment_url: data.attachment_url || null,
            attachment_type: data.attachment_type || null,
            attachment_name: data.attachment_name || null
          }];
        });
      } else {
        console.log('Message not for current conversation. Selected user:', selectedUser?.user_id, 'Message sender:', data.sender_id, 'Message receiver:', data.receiver_id);
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
      setConversations(response.data);
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
      const newMessages = response.data;
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

      const messageData = {
        receiver_id: selectedUser.user_id,
        message: newMessage,
        // TODO: Implement client-side encryption before sending
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
      console.log('Received remote track:', event);
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
            style={{
              maxWidth: '250px',
              maxHeight: '250px',
              borderRadius: '0.5rem',
              marginTop: '0.5rem',
              cursor: 'pointer'
            }}
          />
        </a>
      );
    } else if (isVideo) {
      return (
        <video
          controls
          style={{ maxWidth: '300px', borderRadius: '0.5rem', marginTop: '0.5rem' }}
        >
          <source src={msg.attachment_url} type={msg.attachment_type} />
        </video>
      );
    } else if (isAudio) {
      return (
        <audio controls style={{ marginTop: '0.5rem', width: '250px' }}>
          <source src={msg.attachment_url} type={msg.attachment_type} />
        </audio>
      );
    } else {
      return (
        <a
          href={msg.attachment_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '0.5rem',
            padding: '0.5rem',
            background: 'rgba(0,0,0,0.1)',
            borderRadius: '0.375rem',
            textDecoration: 'none',
            color: 'inherit'
          }}
        >
          <span><i className="fas fa-paperclip"></i></span>
          <span>{msg.attachment_name || 'Download File'}</span>
        </a>
      );
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: '100vh' }}>
      {error && <div className="error" style={{ margin: '1rem', padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '0.375rem' }}>{error}</div>}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', maxHeight: 'calc(100vh - 100px)' }}>
        {/* Sidebar - Conversations List */}
        <div style={{ width: '320px', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>Conversations</h3>
            <details>
              <summary style={{ cursor: 'pointer', color: '#3b82f6', marginBottom: '0.5rem', fontWeight: '500' }}>Start New Chat</summary>
              {/* Search Input */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Search by name, email, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input"
                    style={{ flex: 1, fontSize: '0.875rem', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                  />
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className="btn btn-outline"
                      style={{ padding: '0.5rem', fontSize: '0.875rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', background: 'white' }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '0.5rem', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`::-webkit-scrollbar { display: none; }`}</style>
                {filteredEmployees.length === 0 ? (
                  <div style={{ padding: '0.5rem', color: '#6b7280', fontStyle: 'italic' }}>
                    {searchTerm ? 'No employees found matching your search' : 'No employees available'}
                  </div>
                ) : (
                  filteredEmployees.map(emp => (
                    <div
                      key={emp.employee_id}
                      onClick={() => startNewChat(emp)}
                      style={{
                        padding: '0.75rem',
                        cursor: 'pointer',
                        borderRadius: '0.5rem',
                        marginBottom: '0.25rem',
                        backgroundColor: selectedUser?.employee_id === emp.employee_id ? '#eff6ff' : 'transparent',
                        border: selectedUser?.employee_id === emp.employee_id ? '1px solid #3b82f6' : '1px solid transparent'
                      }}
                      className="hover:bg-gray-100"
                    >
                      <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ position: 'relative' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600', fontSize: '0.75rem' }}>
                            {emp.first_name?.charAt(0)}{emp.last_name?.charAt(0)}
                          </div>
                          {onlineUsers.has(emp.user_id) && (
                            <div style={{ position: 'absolute', bottom: '0', right: '0', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', border: '1px solid white' }}></div>
                          )}
                        </div>
                        <div>
                          <div>{emp.first_name} {emp.last_name}</div>
                          {emp.department_name && (
                            <span style={{
                              fontWeight: 'normal',
                              fontSize: '0.75rem',
                              color: '#6b7280'
                            }}>
                              {emp.department_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '2.5rem' }}>
                        {emp.email}
                        {emp.position && ` • ${emp.position}`}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </details>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`::-webkit-scrollbar { display: none; }`}</style>
            {conversations.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
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
                  style={{
                    padding: '1rem',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f3f4f6',
                    backgroundColor: selectedUser?.user_id === conv.other_user_id ? '#eff6ff' : 'white',
                    position: 'relative',
                    borderLeft: selectedUser?.user_id === conv.other_user_id ? '3px solid #3b82f6' : '3px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: '600', flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ position: 'relative' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600', fontSize: '0.75rem' }}>
                          {conv.other_user_first_name ? conv.other_user_first_name.charAt(0) : (conv.other_user_email?.split('@')[0]?.charAt(0)?.toUpperCase() || 'U')}
                        </div>
                        {onlineUsers.has(conv.other_user_id) && (
                          <div style={{ position: 'absolute', bottom: '0', right: '0', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', border: '1px solid white' }}></div>
                        )}
                      </div>
                      <div>
                        {conv.other_user_first_name ? `${conv.other_user_first_name} ${conv.other_user_last_name}` : (conv.other_user_email?.split('@')[0] || 'User')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {conv.unread_count > 0 && (
                        <span className="badge badge-danger" style={{ fontSize: '0.7rem', minWidth: '20px', backgroundColor: '#ef4444', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{conv.unread_count}</span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.other_user_id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          padding: '0.1rem',
                          color: '#9ca3af'
                        }}
                        title="Delete conversation"
                        onMouseEnter={(e) => e.target.style.color = '#ef4444'}
                        onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginLeft: '2.5rem' }}>
                    {conv.last_message}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem', marginLeft: '2.5rem' }}>
                    {new Date(conv.last_message_time).toLocaleString()}
                  </div>
                </div>
              ))

            )}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f9fafb', maxHeight: '100%', height: '100%' }}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600' }}>
                      {selectedUser.first_name?.charAt(0)}{selectedUser.last_name?.charAt(0)}
                    </div>
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', borderRadius: '50%', backgroundColor: onlineUsers.has(selectedUser.user_id) ? '#10b981' : '#6b7280', border: '2px solid white' }} />
                  </div>
                  <div>
                    <h3 style={{ marginBottom: '0.125rem', fontSize: '1rem', fontWeight: '600' }}>{selectedUser.first_name} {selectedUser.last_name}</h3>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{onlineUsers.has(selectedUser.user_id) ? 'Online' : 'Offline'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-outline"
                    style={{ padding: '0.5rem', fontSize: '1.125rem', border: '1px solid #e5e7eb', background: 'white', borderRadius: '0.375rem' }}
                    onClick={startVoiceCall}
                    title="Voice Call"
                    disabled={isInCall}
                  >
                    <i className="fas fa-phone"></i>
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ padding: '0.5rem', fontSize: '1.125rem', border: '1px solid #e5e7eb', background: 'white', borderRadius: '0.375rem' }}
                    onClick={startVideoCall}
                    title="Video Call"
                    disabled={isInCall}
                  >
                    <i className="fas fa-video"></i>
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ padding: '0.5rem', fontSize: '1.125rem', border: '1px solid #e5e7eb', background: 'white', borderRadius: '0.375rem' }}
                    onClick={startScreenShare}
                    title="Screen Share"
                    disabled={isInCall}
                  >
                    <i className="fas fa-desktop"></i>
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ padding: '0.5rem', fontSize: '1.125rem', border: '1px solid #e5e7eb', background: 'white', color: '#9ca3af', borderRadius: '0.375rem' }}
                    onClick={() => deleteConversation(selectedUser.user_id)}
                    title="Delete Conversation"
                    onMouseEnter={(e) => e.target.style.color = '#ef4444'}
                    onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>

              {/* Video Call Area */}
              {isInCall && (
                <div style={{ padding: '1rem', background: '#000', position: 'relative', height: '400px' }}>
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    {/* Remote Video/Screen */}
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: callStatus === 'screen' ? 'contain' : 'cover',
                        borderRadius: '0.5rem',
                        backgroundColor: '#000'
                      }}
                    />

                    {/* No remote stream message */}
                    {!remoteStream && (
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: 'white',
                        textAlign: 'center'
                      }}>
                        <div className="spinner-border text-light mb-2" role="status"></div>
                        <div>Waiting for connection...</div>
                      </div>
                    )}

                    {/* Local Video Overlay */}
                    <div style={{
                      position: 'absolute',
                      bottom: '1rem',
                      right: '1rem',
                      width: '150px',
                      height: '100px',
                      borderRadius: '0.5rem',
                      overflow: 'hidden',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      border: '2px solid white'
                    }}>
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          backgroundColor: '#333'
                        }}
                      />
                    </div>

                    {/* Call Controls */}
                    <div style={{
                      position: 'absolute',
                      bottom: '1rem',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: '1rem',
                      zIndex: 10
                    }}>
                      <button
                        onClick={endCall}
                        className="btn btn-danger"
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.25rem',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <i className="fas fa-phone-slash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages Area */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {hasMoreMessages && (
                  <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <button
                      onClick={loadMoreMessages}
                      className="btn btn-sm btn-outline"
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: '1rem', border: '1px solid #d1d5db', background: 'white' }}
                    >
                      Load older messages
                    </button>
                  </div>
                )}

                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>💬</div>
                    <p>No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isOwn = msg.sender_id === user.userId;
                    const showAvatar = !isOwn && (index === 0 || messages[index - 1].sender_id !== msg.sender_id);

                    return (
                      <div
                        key={msg.message_id || index}
                        style={{
                          display: 'flex',
                          justifyContent: isOwn ? 'flex-end' : 'flex-start',
                          marginBottom: '0.5rem'
                        }}
                      >
                        {!isOwn && (
                          <div style={{ width: '32px', marginRight: '0.5rem', display: 'flex', alignItems: 'flex-end' }}>
                            {showAvatar ? (
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600', fontSize: '0.75rem' }}>
                                {selectedUser.first_name?.charAt(0)}{selectedUser.last_name?.charAt(0)}
                              </div>
                            ) : <div style={{ width: '32px' }} />}
                          </div>
                        )}

                        <div style={{ maxWidth: '70%' }}>
                          <div
                            style={{
                              padding: '0.75rem 1rem',
                              borderRadius: '1rem',
                              borderTopRightRadius: isOwn ? '0' : '1rem',
                              borderTopLeftRadius: isOwn ? '1rem' : '0',
                              backgroundColor: isOwn ? '#3b82f6' : 'white',
                              color: isOwn ? 'white' : '#1f2937',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              position: 'relative'
                            }}
                          >
                            {msg.message}
                            {renderAttachment(msg)}
                          </div>
                          <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {msg.sender_id === user.userId && (
                              <span>
                                {msg.is_read ? (
                                  <i className="fas fa-check-double" style={{ color: '#60a5fa' }} title="Read"></i>
                                ) : (
                                  <i className="fas fa-check" style={{ color: '#9ca3af' }} title="Sent"></i>
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
              <div style={{ padding: '1rem', borderTop: '1px solid #e5e7eb', background: 'white' }}>
                {uploading && (
                  <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#3b82f6' }}>
                    Uploading file...
                  </div>
                )}
                {selectedFile && (
                  <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
                    <i className="fas fa-file"></i>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</span>
                    <button onClick={removeSelectedFile} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                  <div style={{ position: 'relative' }}>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '0.75rem', borderRadius: '50%', border: '1px solid #d1d5db' }}
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      <i className="far fa-smile"></i>
                    </button>
                    {showEmojiPicker && (
                      <div style={{ position: 'absolute', bottom: '100%', left: '0', marginBottom: '0.5rem', zIndex: 50 }}>
                        <EmojiPicker onEmojiClick={onEmojiClick} />
                      </div>
                    )}
                  </div>

                  <div style={{ position: 'relative' }}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                    <button
                      className="btn btn-outline"
                      style={{ padding: '0.75rem', borderRadius: '50%', border: '1px solid #d1d5db' }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <i className="fas fa-paperclip"></i>
                    </button>
                  </div>

                  <form onSubmit={handleSendMessage} style={{ flex: 1, display: 'flex', gap: '0.75rem' }}>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      placeholder="Type a message..."
                      className="form-input"
                      style={{ flex: 1, padding: '0.75rem', borderRadius: '1.5rem', border: '1px solid #d1d5db', outline: 'none' }}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ padding: '0.75rem', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3b82f6', color: 'white', border: 'none' }}
                      disabled={(!newMessage.trim() && !selectedFile) || uploading}
                    >
                      <i className="fas fa-paper-plane"></i>
                    </button>
                  </form>
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <i className="fas fa-comments" style={{ fontSize: '2.5rem', color: '#d1d5db' }}></i>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Select a conversation</h3>
              <p>Choose a contact from the left to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div >
  );
};

export default Chat;
