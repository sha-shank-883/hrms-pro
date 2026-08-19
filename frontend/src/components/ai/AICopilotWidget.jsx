import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { aiCopilotService } from '../../services';
import {
  FaRobot,
  FaTimes,
  FaPaperPlane,
  FaMagic,
  FaExternalLinkAlt,
  FaUserCheck,
  FaMoneyBillWave,
  FaCalendarCheck,
  FaBriefcase,
  FaShieldAlt,
  FaLaptopCode,
  FaChartLine,
  FaChevronDown,
  FaTrashAlt,
  FaTasks,
  FaBullseye,
  FaBuilding,
  FaPlaneArrival,
  FaHeadset
} from 'react-icons/fa';

export const AICopilotWidget = () => {
  const { user, hasModule } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const role = user?.role || 'employee';
  const isSuperAdmin = !!(user?.isSuperAdmin || user?.role === 'super_admin');

  // Check if AI Copilot should be displayed
  const isEnabled = isSuperAdmin || hasModule('ai_assistant');

  useEffect(() => {
    if (isEnabled && isOpen) {
      loadSuggestions();
      if (messages.length === 0) {
        initWelcomeMessage();
      }
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isEnabled]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSuggestions = async () => {
    try {
      const res = await aiCopilotService.getSuggestions();
      if (res.data) setSuggestions(res.data);
    } catch (_) {
      // Fallback suggestions
      setSuggestions([
        { label: '🏖️ My Leave Balance', prompt: 'What is my current leave balance?' },
        { label: '💵 My Salary Info', prompt: 'What is my current salary and position?' },
        { label: '📅 Attendance Summary', prompt: 'Show attendance records for today' }
      ]);
    }
  };

  const initWelcomeMessage = () => {
    const roleTitle = isSuperAdmin ? 'Global Super Admin' : role === 'admin' ? 'Company Administrator' : role === 'manager' ? 'Department Manager' : 'Team Member';
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: `👋 Hello **${user?.first_name || 'there'}**! I am your **HRMS Pro AI Copilot**.\n\nI have real-time access to your database to query records, calculate payroll, check attendance, or post job openings tailored to your **${roleTitle}** permissions.`,
        action_cards: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleSendMessage = async (promptToSend) => {
    const query = (promptToSend || inputMessage).trim();
    if (!query || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await aiCopilotService.chat(query, messages.slice(-4));
      const aiData = res.data;

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiData.reply || 'Request completed.',
        tool_executed: aiData.tool_executed,
        action_cards: aiData.action_cards || [],
        requires_confirmation: aiData.requires_confirmation || false,
        pending_action: aiData.pending_action || null,
        disambiguation_options: aiData.disambiguation_options || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `⚠️ **Notice**: ${err.response?.data?.message || err.message || 'Unable to connect to AI engine. Please ensure API keys are configured.'}`,
        action_cards: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async (pendingAction) => {
    if (!pendingAction || loading) return;
    setLoading(true);

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: `✅ Confirmed: Proceed with ${pendingAction.toolName}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await aiCopilotService.chat('', messages.slice(-4), true, pendingAction);
      const aiData = res.data;

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiData.reply || 'Operation confirmed and executed.',
        tool_executed: aiData.tool_executed,
        action_cards: aiData.action_cards || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `❌ Execution failed: ${err.response?.data?.message || err.message}`,
          action_cards: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAction = () => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'user',
        text: '❌ Cancelled the operation.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'Understood. The pending operation was aborted without making any changes to the database.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleCardNavigation = (link) => {
    if (link) {
      navigate(link);
      setIsOpen(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    initWelcomeMessage();
  };

  if (!isEnabled) return null;

  return (
    <>
      {/* Floating Launcher Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 group">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-full shadow-2xl hover:shadow-indigo-500/25 transition-all duration-300 transform hover:scale-105 active:scale-95 border border-white/20"
            title="Open HRMS Pro AI Copilot"
          >
            <div className="relative">
              <FaRobot className="text-lg animate-bounce" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full animate-pulse"></span>
            </div>
            <span className="text-xs font-bold tracking-wide hidden sm:inline-block">AI Copilot</span>
          </button>
        </div>
      )}

      {/* Floating Copilot Modal Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[460px] h-[620px] max-h-[90vh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-neutral-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-pink-600/10 dark:from-indigo-950/50 dark:via-purple-950/50 dark:to-pink-950/50 border-b border-neutral-200/80 dark:border-slate-800/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md">
                <FaRobot size={15} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-neutral-800 dark:text-white">AI HR Copilot</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-md border border-indigo-200 dark:border-indigo-800">
                    {isSuperAdmin ? 'SUPER ADMIN' : role}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-500 dark:text-slate-400">Autonomous Database & Calculations Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-slate-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors"
                title="Clear Conversation"
              >
                <FaTrashAlt size={12} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-slate-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors"
                title="Minimize Copilot"
              >
                <FaChevronDown size={13} />
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <FaRobot size={11} />
                  </div>
                )}
                <div className={`max-w-[85%] space-y-2`}>
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none shadow-sm'
                        : 'bg-neutral-100 dark:bg-slate-800/90 text-neutral-800 dark:text-slate-100 rounded-bl-none border border-neutral-200/60 dark:border-slate-700/60'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">
                      {renderFormattedText(msg.text)}
                    </div>
                  </div>

                  {/* Render Interactive Action Cards */}
                  {msg.action_cards && msg.action_cards.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {msg.action_cards.map((card, idx) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-slate-850 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-3 shadow-md hover:shadow-lg transition-all text-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <h4 className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                                {getCardIcon(card.type)}
                                <span>{card.title}</span>
                              </h4>
                              {card.subtitle && (
                                <p className="text-[11px] text-neutral-500 dark:text-slate-400">{card.subtitle}</p>
                              )}
                            </div>
                            {card.link && (
                              <button
                                onClick={() => handleCardNavigation(card.link)}
                                className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg flex items-center gap-1 border border-indigo-200 dark:border-indigo-800 transition-colors shrink-0"
                              >
                                <span>View</span>
                                <FaExternalLinkAlt size={9} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Render Disambiguation Chips */}
                  {msg.disambiguation_options && msg.disambiguation_options.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">Select Employee:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.disambiguation_options.map((opt, oIdx) => (
                          <button
                            key={oIdx}
                            onClick={() => handleSendMessage(`Show profile for ${opt.name} (${opt.employee_code})`)}
                            disabled={loading}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-all text-left shadow-2xs"
                          >
                            👤 {opt.name} <span className="opacity-75 font-normal">({opt.employee_code} • {opt.department})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Render Two-Phase Confirmation Gate */}
                  {msg.requires_confirmation && msg.pending_action && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-2 text-xs shadow-xs">
                      <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                        <FaShieldAlt className="text-amber-600 dark:text-amber-400" />
                        <span>High-Impact Action Confirmation Required</span>
                      </div>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400/90 leading-tight">
                        Action: <strong className="font-semibold">{msg.pending_action.toolName}</strong>
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleConfirmAction(msg.pending_action)}
                          disabled={loading}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition-colors shadow-xs flex items-center gap-1"
                        >
                          <span>✅ Proceed & Confirm</span>
                        </button>
                        <button
                          onClick={handleCancelAction}
                          disabled={loading}
                          className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-neutral-800 dark:text-slate-200 font-semibold rounded-lg text-[11px] transition-colors"
                        >
                          <span>❌ Cancel</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div
                    className={`text-[9px] text-neutral-400 dark:text-slate-500 px-1 ${
                      msg.sender === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex gap-2.5 items-center text-xs text-neutral-500 dark:text-slate-400 animate-pulse pl-1">
                <div className="w-6 h-6 rounded-lg bg-indigo-600/80 text-white flex items-center justify-center shrink-0">
                  <FaRobot size={11} className="animate-spin" />
                </div>
                <div className="bg-neutral-100 dark:bg-slate-800 px-3 py-2 rounded-xl border border-neutral-200 dark:border-slate-700 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></div>
                  <span>AI Copilot is fetching data & reasoning...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Carousel */}
          {suggestions.length > 0 && (
            <div className="px-3 py-2 bg-neutral-50/80 dark:bg-slate-850/80 border-t border-neutral-200/50 dark:border-slate-800/50 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(s.prompt)}
                    disabled={loading}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-neutral-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 border border-neutral-200 dark:border-slate-700 rounded-full whitespace-nowrap transition-all shadow-2xs shrink-0"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Prompt Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white dark:bg-slate-900 border-t border-neutral-200 dark:border-slate-800 flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Ask Copilot anything (e.g. "What is Aman's salary?")...`}
              disabled={loading}
              className="flex-1 px-3.5 py-2 text-xs bg-neutral-100 dark:bg-slate-800 text-neutral-900 dark:text-white rounded-xl border border-neutral-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl disabled:opacity-40 transition-all shadow-sm"
              title="Send Prompt"
            >
              <FaPaperPlane size={11} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

// Helper: Formatted Markdown text renderer with bold and lists
const renderFormattedText = (text) => {
  if (!text) return '';
  const parts = text.split('\n');
  return parts.map((line, idx) => {
    // Bold replacement
    const boldFormatted = line.split(/(\*\*.*?\*\*)/g).map((chunk, cIdx) => {
      if (chunk.startsWith('**') && chunk.endsWith('**')) {
        return <strong key={cIdx} className="font-bold text-indigo-950 dark:text-indigo-200">{chunk.slice(2, -2)}</strong>;
      }
      return chunk;
    });

    return (
      <span key={idx} className="block min-h-[1.1rem]">
        {boldFormatted}
      </span>
    );
  });
};

// Helper: Get Icon for Action Card
const getCardIcon = (type) => {
  switch (type) {
    case 'employee_card':
      return <FaUserCheck className="text-emerald-500" size={13} />;
    case 'payroll_calculation_card':
      return <FaMoneyBillWave className="text-indigo-500" size={13} />;
    case 'attendance_card':
    case 'success_card':
      return <FaCalendarCheck className="text-amber-500" size={13} />;
    case 'leave_card':
    case 'leave_action_card':
      return <FaPlaneArrival className="text-emerald-500" size={13} />;
    case 'job_card':
      return <FaBriefcase className="text-purple-500" size={13} />;
    case 'asset_card':
      return <FaLaptopCode className="text-cyan-500" size={13} />;
    case 'task_card':
      return <FaTasks className="text-blue-500" size={13} />;
    case 'goal_card':
      return <FaBullseye className="text-pink-500" size={13} />;
    case 'department_card':
      return <FaBuilding className="text-violet-500" size={13} />;
    case 'ticket_card':
      return <FaHeadset className="text-orange-500" size={13} />;
    case 'superadmin_card':
      return <FaChartLine className="text-rose-500" size={13} />;
    default:
      return <FaShieldAlt className="text-indigo-500" size={13} />;
  }
};

export default AICopilotWidget;
