import React, { useEffect, useState, useRef } from 'react';
import { chatService, employeeService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import io from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';
import { encrypt as e2eEncrypt, decrypt as e2eDecrypt } from '../utils/cryptoBrowser';
import {
  FaPhone,
  FaPhoneSlash,
  FaVideo,
  FaVideoSlash,
  FaDesktop,
  FaMicrophone,
  FaMicrophoneSlash,
  FaPaperclip,
  FaPaperPlane,
  FaSmile,
  FaTrash,
  FaSearch,
  FaReply,
  FaTimes,
  FaCheck,
  FaCheckDouble,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileArchive,
  FaFileAlt,
  FaFileImage,
  FaDownload,
  FaUsers,
  FaUser,
  FaStar,
  FaRegStar,
  FaExpand,
  FaCompress,
  FaShareAlt,
  FaShieldAlt,
  FaArrowDown
} from 'react-icons/fa';

export const Chat = () => {
  const { user } = useAuth();
  const { markAsRead } = useNotifications();

  // Navigation & Data
  const [activeTab, setActiveTab] = useState('direct'); // 'direct' | 'channels' | 'starred'
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  // WebRTC Audio / Video / Screen Sharing
  const [callStatus, setCallStatus] = useState(null); // 'voice' | 'video' | 'screen'
  const [isInCall, setIsInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // Refs
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const callContainerRef = useRef(null);

  // 1. Socket.io Connection Setup
  useEffect(() => {
    const tenantId = localStorage.getItem('tenant_id') || user?.tenant_id || 'tenant_default';
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    const socketUrl = apiUrl.replace('/api', '');

    socketRef.current = io(socketUrl, {
      withCredentials: true,
      query: { tenantId }
    });

    socketRef.current.on('connect', () => {
      if (user?.userId) {
        socketRef.current.emit('join', {
          userId: user.userId,
          token: localStorage.getItem('token')
        });
      }
    });

    socketRef.current.on('update_online_users', (userIds) => {
      setOnlineUsers(new Set(userIds));
    });

    // WebRTC: Incoming Call
    socketRef.current.on('call_initiated', (data) => {
      setIncomingCall(data);
    });

    socketRef.current.on('call_accepted', async (data) => {
      await handleCallAccepted(data);
    });

    socketRef.current.on('call_rejected', (data) => {
      alert(data?.reason || 'Call was declined by the user.');
      endCall();
    });

    socketRef.current.on('ice_candidate', async (data) => {
      if (peerConnectionRef.current && data.candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('[WebRTC] Error adding ice candidate:', err);
        }
      }
    });

    socketRef.current.on('call_ended', () => {
      endCall();
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (localStream) localStream.getTracks().forEach((t) => t.stop());
    };
  }, [user?.userId, user?.tenant_id]);

  // 2. Real-Time Chat Event Listeners
  useEffect(() => {
    if (!socketRef.current) return;

    const handleReceiveMessage = async (data) => {
      const decryptedText = await e2eDecrypt(data.message);

      if (
        selectedUser &&
        (data.sender_id === selectedUser.user_id || data.receiver_id === selectedUser.user_id)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m.message_id === data.message_id)) return prev;
          return [
            ...prev,
            {
              ...data,
              message: decryptedText,
              reply_to: data.reply_to || null,
              reactions: data.reactions || []
            }
          ];
        });

        // Mark as read immediately
        if (data.sender_id === selectedUser.user_id) {
          socketRef.current.emit('mark_read', { sender_id: selectedUser.user_id });
        }
      }

      loadConversations();
    };

    const handleUserTyping = (data) => {
      if (selectedUser && data.sender_id === selectedUser.user_id) {
        setTypingUsers((prev) => new Set(prev).add(data.sender_id));
      }
    };

    const handleUserStopTyping = (data) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(data.sender_id);
        return next;
      });
    };

    const handleMessagesRead = (data) => {
      if (selectedUser && data.reader_id === selectedUser.user_id) {
        setMessages((prev) =>
          prev.map((msg) => (msg.sender_id === user.userId ? { ...msg, is_read: true } : msg))
        );
      }
    };

    const handleMessageReaction = (data) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.message_id === data.messageId) {
            const currentReactions = msg.reactions || [];
            const existingIndex = currentReactions.findIndex((r) => r.userId === data.userId);
            let updated = [...currentReactions];
            if (existingIndex > -1) {
              updated[existingIndex] = { userId: data.userId, reaction: data.reaction };
            } else {
              updated.push({ userId: data.userId, reaction: data.reaction });
            }
            return { ...msg, reactions: updated };
          }
          return msg;
        })
      );
    };

    const handleMessageDeleted = (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.message_id === data.messageId
            ? { ...msg, is_deleted: true, message: '🚫 This message was deleted' }
            : msg
        )
      );
    };

    socketRef.current.on('receive_message', handleReceiveMessage);
    socketRef.current.on('user_typing', handleUserTyping);
    socketRef.current.on('user_stop_typing', handleUserStopTyping);
    socketRef.current.on('messages_read', handleMessagesRead);
    socketRef.current.on('message_reaction', handleMessageReaction);
    socketRef.current.on('message_deleted', handleMessageDeleted);

    return () => {
      socketRef.current.off('receive_message', handleReceiveMessage);
      socketRef.current.off('user_typing', handleUserTyping);
      socketRef.current.off('user_stop_typing', handleUserStopTyping);
      socketRef.current.off('messages_read', handleMessagesRead);
      socketRef.current.off('message_reaction', handleMessageReaction);
      socketRef.current.off('message_deleted', handleMessageDeleted);
    };
  }, [selectedUser, user?.userId]);

  // Initial Load
  useEffect(() => {
    loadEmployees();
    loadConversations();
    markAsRead('chat');
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadMessages();
      socketRef.current?.emit('mark_read', { sender_id: selectedUser.user_id });
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadEmployees = async () => {
    try {
      const res = await employeeService.getForChat();
      setEmployees(res.data || []);
      setFilteredEmployees(res.data || []);
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  const loadConversations = async () => {
    try {
      const res = await chatService.getConversations();
      const decrypted = await Promise.all(
        (res.data || []).map(async (conv) => ({
          ...conv,
          last_message: await e2eDecrypt(conv.last_message)
        }))
      );
      setConversations(decrypted);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedUser) return;
    try {
      const res = await chatService.getMessages(selectedUser.user_id, { page: 1, limit: 50 });
      const decrypted = await Promise.all(
        (res.data || []).map(async (msg) => ({
          ...msg,
          message: msg.is_deleted ? '🚫 This message was deleted' : await e2eDecrypt(msg.message)
        }))
      );
      setMessages(decrypted);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  // 3. WebRTC Peer Connection Core
  const initiatePeerConnection = async () => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    };

    peerConnectionRef.current = new RTCPeerConnection(configuration);

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate && selectedUser) {
        socketRef.current.emit('ice_candidate', {
          target_user_id: selectedUser.user_id,
          candidate: event.candidate
        });
      }
    };

    peerConnectionRef.current.ontrack = (event) => {
      const rStream = event.streams[0];
      setRemoteStream(rStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = rStream;
        remoteVideoRef.current.play().catch((e) => console.error('Play error:', e));
      }
    };
  };

  const startVoiceCall = async () => {
    if (!selectedUser) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
      setCallStatus('voice');
      setIsInCall(true);

      await initiatePeerConnection();
      stream.getTracks().forEach((track) => peerConnectionRef.current.addTrack(track, stream));

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      socketRef.current.emit('initiate_call', {
        receiver_id: selectedUser.user_id,
        caller_id: user.userId,
        caller_name: `${user.first_name || user.email}`,
        callType: 'voice',
        offer
      });
    } catch (err) {
      alert('Could not access microphone: ' + err.message);
    }
  };

  const startVideoCall = async () => {
    if (!selectedUser) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setLocalStream(stream);
      setCallStatus('video');
      setIsInCall(true);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      await initiatePeerConnection();
      stream.getTracks().forEach((track) => peerConnectionRef.current.addTrack(track, stream));

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      socketRef.current.emit('initiate_call', {
        receiver_id: selectedUser.user_id,
        caller_id: user.userId,
        caller_name: `${user.first_name || user.email}`,
        callType: 'video',
        offer
      });
    } catch (err) {
      alert('Could not access camera/mic: ' + err.message);
    }
  };

  const startScreenShare = async () => {
    if (!selectedUser) return;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      setLocalStream(stream);
      setCallStatus('screen');
      setIsInCall(true);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      await initiatePeerConnection();
      stream.getTracks().forEach((track) => peerConnectionRef.current.addTrack(track, stream));

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      socketRef.current.emit('initiate_call', {
        receiver_id: selectedUser.user_id,
        caller_id: user.userId,
        caller_name: `${user.first_name || user.email}`,
        callType: 'screen',
        offer
      });

      stream.getVideoTracks()[0].onended = () => {
        endCall();
      };
    } catch (err) {
      alert('Screen share cancelled or failed: ' + err.message);
    }
  };

  const handleAcceptIncomingCall = async () => {
    if (!incomingCall) return;
    const { caller_id, callType, offer } = incomingCall;

    try {
      let stream;
      if (callType === 'voice') {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } else if (callType === 'video') {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      }

      setLocalStream(stream);
      setCallStatus(callType);
      setIsInCall(true);
      setIncomingCall(null);

      // Select caller if not currently open
      const callerEmp = employees.find((e) => e.user_id === caller_id);
      if (callerEmp) setSelectedUser(callerEmp);

      if (callType === 'video' && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      await initiatePeerConnection();
      stream.getTracks().forEach((track) => peerConnectionRef.current.addTrack(track, stream));

      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      socketRef.current.emit('accept_call', {
        caller_id,
        answer,
        callType
      });
    } catch (err) {
      alert('Error accepting call: ' + err.message);
      setIncomingCall(null);
    }
  };

  const handleDeclineIncomingCall = () => {
    if (incomingCall && socketRef.current) {
      socketRef.current.emit('reject_call', { caller_id: incomingCall.caller_id });
    }
    setIncomingCall(null);
  };

  const handleCallAccepted = async (data) => {
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
    } catch (err) {
      console.error('[WebRTC] Call acceptance error:', err);
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach((t) => (t.enabled = !t.enabled));
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach((t) => (t.enabled = !t.enabled));
      setIsVideoDisabled(!isVideoDisabled);
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus(null);
    setIsInCall(false);

    if (selectedUser && socketRef.current) {
      socketRef.current.emit('end_call', { target_user_id: selectedUser.user_id });
    }
  };

  // 4. Message Actions: Send, Reply, React, Delete
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const textToSend = newMessage.trim();
    if ((!textToSend && !selectedFile) || !selectedUser || uploading) return;

    setUploading(true);
    let attachmentData = {};

    try {
      if (selectedFile) {
        const uploadRes = await chatService.uploadFile(selectedFile);
        attachmentData = {
          attachment_url: uploadRes.data?.url || uploadRes.url,
          attachment_name: selectedFile.name,
          attachment_type: selectedFile.type || 'application/octet-stream'
        };
      }

      const msgPayload = {
        receiver_id: selectedUser.user_id,
        message: textToSend,
        reply_to_id: replyingTo ? replyingTo.message_id : null,
        ...attachmentData
      };

      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('send_message', msgPayload);
      } else {
        await chatService.sendMessage(msgPayload);
        loadMessages();
      }

      setNewMessage('');
      setSelectedFile(null);
      setReplyingTo(null);
      setShowEmojiPicker(false);
    } catch (err) {
      alert('Failed to send message: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleTyping = () => {
    if (!selectedUser || !socketRef.current) return;
    socketRef.current.emit('typing', {
      receiver_id: selectedUser.user_id,
      sender_id: user.userId
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('stop_typing', {
        receiver_id: selectedUser.user_id,
        sender_id: user.userId
      });
    }, 2000);
  };

  const handleReaction = (messageId, reaction) => {
    if (socketRef.current) {
      socketRef.current.emit('message_reaction', { messageId, reaction });
    }
  };

  const handleDeleteMessage = (messageId) => {
    if (confirm('Delete this message for everyone?')) {
      if (socketRef.current) {
        socketRef.current.emit('delete_message', { messageId });
      }
    }
  };

  // Render Attachment Card
  const renderAttachment = (msg) => {
    if (!msg.attachment_url) return null;
    const isImg = msg.attachment_type?.startsWith('image/');
    const isVid = msg.attachment_type?.startsWith('video/');
    const isAud = msg.attachment_type?.startsWith('audio/');
    const isPdf = msg.attachment_type?.includes('pdf');
    const isDoc = msg.attachment_type?.includes('word') || msg.attachment_name?.endsWith('.docx');
    const isSheet = msg.attachment_type?.includes('sheet') || msg.attachment_name?.endsWith('.xlsx');

    if (isImg) {
      return (
        <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="block mt-2">
          <img src={msg.attachment_url} alt="Attachment" className="max-h-60 rounded-xl shadow-sm border border-neutral-200 hover:opacity-95 transition-opacity" />
        </a>
      );
    }

    if (isVid) {
      return (
        <video controls className="max-h-60 rounded-xl mt-2 border border-neutral-200">
          <source src={msg.attachment_url} type={msg.attachment_type} />
        </video>
      );
    }

    if (isAud) {
      return (
        <audio controls className="mt-2 w-64">
          <source src={msg.attachment_url} type={msg.attachment_type} />
        </audio>
      );
    }

    return (
      <a
        href={msg.attachment_url}
        target="_blank"
        rel="noopener noreferrer"
        download={msg.attachment_name}
        className="mt-2 flex items-center gap-3 p-3 bg-neutral-100 dark:bg-gray-700/60 rounded-xl border border-neutral-200 dark:border-gray-600 hover:bg-neutral-200 dark:hover:bg-gray-600 transition-colors text-inherit no-underline"
      >
        <div className="p-2.5 bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 rounded-lg text-lg">
          {isPdf ? <FaFilePdf /> : isDoc ? <FaFileWord /> : isSheet ? <FaFileExcel /> : <FaFileAlt />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate text-gray-900 dark:text-white">{msg.attachment_name || 'Document'}</p>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Click to Download</span>
        </div>
        <FaDownload className="text-gray-400 hover:text-primary-600 text-sm" />
      </a>
    );
  };

  return (
    <div className="h-[84vh] flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-neutral-200 dark:border-gray-800 shadow-xl relative">
      {/* 1. Incoming Call Dialog Alert */}
      {incomingCall && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900/95 backdrop-blur-md text-white px-6 py-4 rounded-3xl shadow-2xl border border-purple-500/50 flex items-center gap-6 animate-bounce">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-lg shadow-lg">
              {incomingCall.caller_name?.charAt(0) || 'U'}
            </div>
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-gray-900 animate-ping" />
          </div>
          <div>
            <h4 className="text-sm font-black">{incomingCall.caller_name}</h4>
            <p className="text-xs text-purple-300 font-medium capitalize">
              Incoming {incomingCall.callType === 'voice' ? 'Audio' : incomingCall.callType === 'video' ? 'Video' : 'Screen Share'} Call...
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAcceptIncomingCall}
              className="p-3 bg-emerald-600 hover:bg-emerald-500 rounded-full text-white shadow-lg transition-transform hover:scale-110"
              title="Accept Call"
            >
              <FaPhone className="text-base" />
            </button>
            <button
              onClick={handleDeclineIncomingCall}
              className="p-3 bg-red-600 hover:bg-red-500 rounded-full text-white shadow-lg transition-transform hover:scale-110"
              title="Decline Call"
            >
              <FaPhoneSlash className="text-base" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Main Teams Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 border-r border-neutral-200 dark:border-gray-800 flex flex-col bg-neutral-50/50 dark:bg-gray-900/80">
          {/* Sidebar Header & Search */}
          <div className="p-4 border-b border-neutral-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <span>💬 Teams Chat</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                {onlineUsers.size} Online
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                placeholder="Search colleagues..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  const q = e.target.value.toLowerCase();
                  setFilteredEmployees(
                    employees.filter(
                      (emp) =>
                        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(q) ||
                        emp.email?.toLowerCase().includes(q) ||
                        emp.department_name?.toLowerCase().includes(q)
                    )
                  );
                }}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-gray-800 border border-neutral-200 dark:border-gray-700 outline-none focus:border-primary-500 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Conversations & Employee List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {searchTerm ? (
              filteredEmployees.map((emp) => (
                <div
                  key={emp.user_id}
                  onClick={() => {
                    setSelectedUser(emp);
                    setSearchTerm('');
                  }}
                  className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                    selectedUser?.user_id === emp.user_id
                      ? 'bg-primary-50 dark:bg-primary-950/40 border border-primary-300 dark:border-primary-800'
                      : 'hover:bg-neutral-100 dark:hover:bg-gray-800/60'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs shadow-xs">
                      {emp.first_name?.charAt(0)}{emp.last_name?.charAt(0)}
                    </div>
                    {onlineUsers.has(emp.user_id) && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {emp.first_name} {emp.last_name}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{emp.position || emp.department_name || emp.email}</p>
                  </div>
                </div>
              ))
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">
                <p>No conversations yet.</p>
                <p className="mt-1 text-[11px]">Search a teammate above to start collaborating!</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = selectedUser?.user_id === conv.other_user_id;
                const isOnline = onlineUsers.has(conv.other_user_id);
                return (
                  <div
                    key={conv.other_user_id}
                    onClick={() => {
                      const emp = employees.find((e) => e.user_id === conv.other_user_id) || {
                        user_id: conv.other_user_id,
                        first_name: conv.other_user_first_name,
                        last_name: conv.other_user_last_name,
                        email: conv.other_user_email
                      };
                      setSelectedUser(emp);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-primary-100/70 dark:bg-primary-950/60 border border-primary-300 dark:border-primary-700 shadow-sm'
                        : 'hover:bg-neutral-100 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-black text-white text-xs shadow-xs">
                        {conv.other_user_first_name?.charAt(0) || 'U'}
                      </div>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {conv.other_user_first_name} {conv.other_user_last_name}
                        </h4>
                        <span className="text-[10px] text-gray-400">
                          {conv.last_message_time ? new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {conv.last_message || 'Attachment sent'}
                      </p>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-primary-600 text-white shadow-xs">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Chat / Call Window */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden relative">
          {selectedUser ? (
            <>
              {/* Header with Teams Audio/Video/Screen Calling Controls */}
              <div className="px-6 py-3.5 border-b border-neutral-200 dark:border-gray-800 flex items-center justify-between bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-10 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                      {selectedUser.first_name?.charAt(0)}{selectedUser.last_name?.charAt(0)}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${
                        onlineUsers.has(selectedUser.user_id) ? 'bg-emerald-500' : 'bg-gray-400'
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <span>{selectedUser.first_name} {selectedUser.last_name}</span>
                      <span className="text-[10px] font-normal text-gray-500 dark:text-gray-400">({selectedUser.email})</span>
                    </h3>
                    <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      {typingUsers.has(selectedUser.user_id) ? (
                        <span className="animate-pulse">typing...</span>
                      ) : onlineUsers.has(selectedUser.user_id) ? (
                        'Active Now'
                      ) : (
                        <span className="text-gray-400">Offline</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Teams Call Toolbar */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={startVoiceCall}
                    disabled={isInCall}
                    className="p-2.5 rounded-xl border border-neutral-200 dark:border-gray-700 bg-neutral-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/50 transition-colors shadow-xs"
                    title="Start HD Audio Call"
                  >
                    <FaPhone className="text-xs" />
                  </button>
                  <button
                    onClick={startVideoCall}
                    disabled={isInCall}
                    className="p-2.5 rounded-xl border border-neutral-200 dark:border-gray-700 bg-neutral-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/50 transition-colors shadow-xs"
                    title="Start HD Video Call"
                  >
                    <FaVideo className="text-xs" />
                  </button>
                  <button
                    onClick={startScreenShare}
                    disabled={isInCall}
                    className="p-2.5 rounded-xl border border-neutral-200 dark:border-gray-700 bg-neutral-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/50 transition-colors shadow-xs"
                    title="Share Screen"
                  >
                    <FaDesktop className="text-xs" />
                  </button>
                </div>
              </div>

              {/* In-Call Teams Video/Screen Overlay */}
              {isInCall && (
                <div
                  ref={callContainerRef}
                  className="p-4 bg-gray-950 border-b border-gray-800 relative flex flex-col items-center justify-center min-h-[320px] max-h-[420px] overflow-hidden"
                >
                  {/* Remote Stream Video */}
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full max-h-[360px] rounded-2xl bg-black ${
                      callStatus === 'screen' ? 'object-contain' : 'object-cover'
                    }`}
                  />
                  {!remoteStream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gray-900/80 gap-3">
                      <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-bold tracking-wider text-purple-300 uppercase">
                        Connecting {callStatus} call with {selectedUser.first_name}...
                      </p>
                    </div>
                  )}

                  {/* Local Stream Floating PiP */}
                  <div className="absolute bottom-6 right-6 w-36 h-24 rounded-xl overflow-hidden border-2 border-purple-400 shadow-2xl bg-gray-900 z-20">
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  </div>

                  {/* Teams Call Control Dock */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-2.5 bg-gray-900/90 backdrop-blur-xl border border-gray-700 rounded-full shadow-2xl z-30">
                    <button
                      onClick={toggleMute}
                      className={`p-3 rounded-full text-white transition-transform hover:scale-110 ${
                        isAudioMuted ? 'bg-red-600' : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                      title={isAudioMuted ? 'Unmute Mic' : 'Mute Mic'}
                    >
                      {isAudioMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
                    </button>
                    <button
                      onClick={toggleVideo}
                      className={`p-3 rounded-full text-white transition-transform hover:scale-110 ${
                        isVideoDisabled ? 'bg-red-600' : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                      title={isVideoDisabled ? 'Turn Camera On' : 'Turn Camera Off'}
                    >
                      {isVideoDisabled ? <FaVideoSlash /> : <FaVideo />}
                    </button>
                    <button
                      onClick={endCall}
                      className="p-3 bg-red-600 hover:bg-red-700 rounded-full text-white shadow-xl transition-transform hover:scale-110 font-bold"
                      title="End Call"
                    >
                      <FaPhoneSlash />
                    </button>
                  </div>
                </div>
              )}

              {/* Messages Container */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 bg-neutral-50/50 dark:bg-gray-900/40"
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-12">
                    <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center text-2xl mb-3 shadow-inner">
                      💬
                    </div>
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">No Messages Yet</h4>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">
                      Send a message or share documents to start the conversation.
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.sender_id === user.userId;
                    return (
                      <div
                        key={msg.message_id || idx}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                      >
                        <div className="flex items-end gap-2 max-w-[75%]">
                          {!isMe && (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-white text-[10px] shrink-0 mb-1 shadow-xs">
                              {selectedUser.first_name?.charAt(0)}
                            </div>
                          )}

                          <div
                            className={`p-3.5 rounded-2xl shadow-sm relative text-xs leading-relaxed ${
                              isMe
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-xs'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-neutral-200 dark:border-gray-700 rounded-bl-xs'
                            }`}
                          >
                            {/* Quoted Parent Reply */}
                            {msg.reply_to && (
                              <div
                                className={`mb-2 p-2 rounded-lg border-l-2 text-[11px] ${
                                  isMe
                                    ? 'bg-black/20 border-white/80 text-purple-100'
                                    : 'bg-neutral-100 dark:bg-gray-700 border-primary-500 text-gray-600 dark:text-gray-300'
                                }`}
                              >
                                <p className="font-bold text-[10px] uppercase opacity-75">Replying to message</p>
                                <p className="truncate">{msg.reply_to.message}</p>
                              </div>
                            )}

                            <p className="break-words select-text">{msg.message}</p>
                            {renderAttachment(msg)}

                            {/* Reactions Pill Display */}
                            {msg.reactions && msg.reactions.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {msg.reactions.map((r, rIdx) => (
                                  <span
                                    key={rIdx}
                                    className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/80 dark:bg-gray-900/80 text-gray-800 dark:text-gray-200 border border-neutral-200 dark:border-gray-700 shadow-xs"
                                  >
                                    {r.reaction}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Quick Message Actions (Hover toolbar) */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white dark:bg-gray-800 border border-neutral-200 dark:border-gray-700 p-1 rounded-full shadow-md">
                            <button
                              onClick={() => handleReaction(msg.message_id, '👍')}
                              className="p-1 hover:bg-neutral-100 dark:hover:bg-gray-700 rounded-full text-xs"
                              title="Like"
                            >
                              👍
                            </button>
                            <button
                              onClick={() => handleReaction(msg.message_id, '❤️')}
                              className="p-1 hover:bg-neutral-100 dark:hover:bg-gray-700 rounded-full text-xs"
                              title="Heart"
                            >
                              ❤️
                            </button>
                            <button
                              onClick={() => handleReaction(msg.message_id, '🎉')}
                              className="p-1 hover:bg-neutral-100 dark:hover:bg-gray-700 rounded-full text-xs"
                              title="Celebrate"
                            >
                              🎉
                            </button>
                            <button
                              onClick={() => setReplyingTo(msg)}
                              className="p-1 text-gray-400 hover:text-primary-600 rounded-full text-xs"
                              title="Reply"
                            >
                              <FaReply />
                            </button>
                            {isMe && (
                              <button
                                onClick={() => handleDeleteMessage(msg.message_id)}
                                className="p-1 text-gray-400 hover:text-red-600 rounded-full text-xs"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Timestamp & Read Receipts */}
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1 px-1">
                          <span>
                            {msg.created_at
                              ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : ''}
                          </span>
                          {isMe && (
                            <span>
                              {msg.is_read ? (
                                <FaCheckDouble className="text-blue-500" title="Read" />
                              ) : (
                                <FaCheck className="text-gray-400" title="Sent" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Replying Banner */}
              {replyingTo && (
                <div className="px-6 py-2 bg-purple-50 dark:bg-purple-950/40 border-t border-purple-200 dark:border-purple-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FaReply className="text-purple-600" />
                    <span className="font-bold text-purple-900 dark:text-purple-300">Replying to:</span>
                    <span className="text-gray-600 dark:text-gray-400 truncate">{replyingTo.message}</span>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-red-500">
                    <FaTimes />
                  </button>
                </div>
              )}

              {/* Selected File Banner */}
              {selectedFile && (
                <div className="px-6 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-t border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FaPaperclip className="text-emerald-600" />
                    <span className="font-bold text-emerald-900 dark:text-emerald-300">{selectedFile.name}</span>
                    <span className="text-[10px] text-gray-500">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-red-500">
                    <FaTimes />
                  </button>
                </div>
              )}

              {/* Message Input & Document Attachment Bar */}
              <div className="p-4 bg-white dark:bg-gray-900 border-t border-neutral-200 dark:border-gray-800 relative">
                {showEmojiPicker && (
                  <div className="absolute bottom-full left-4 mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden border border-neutral-200 dark:border-gray-700">
                    <EmojiPicker onEmojiClick={(e) => setNewMessage((prev) => prev + e.emoji)} theme="auto" />
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2.5 text-gray-400 hover:text-yellow-500 rounded-full hover:bg-neutral-100 dark:hover:bg-gray-800 transition-colors text-base"
                    title="Insert Emoji"
                  >
                    <FaSmile />
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                    }}
                    className="hidden"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.csv,.txt"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 text-gray-400 hover:text-primary-600 rounded-full hover:bg-neutral-100 dark:hover:bg-gray-800 transition-colors text-base"
                    title="Attach Documents, Media, or Files"
                  >
                    <FaPaperclip />
                  </button>

                  <input
                    type="text"
                    placeholder="Type a message or paste documents..."
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    className="flex-1 px-4 py-2.5 text-xs rounded-full bg-neutral-100 dark:bg-gray-800 border border-transparent focus:border-primary-500 outline-none text-gray-900 dark:text-white transition-all shadow-inner"
                  />

                  <button
                    type="submit"
                    disabled={(!newMessage.trim() && !selectedFile) || uploading}
                    className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title="Send Message"
                  >
                    <FaPaperPlane className="text-xs" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
              <div className="w-20 h-20 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center text-3xl mb-4 shadow-sm">
                💬
              </div>
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">Welcome to HRMS Pro Teams Workspace</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">
                Select a teammate from the left sidebar to start messaging, HD voice/video calls, and document collaboration.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
