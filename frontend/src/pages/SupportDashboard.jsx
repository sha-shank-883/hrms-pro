import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supportService } from '../services/supportService';
import { useAuth } from '../context/AuthContext';
import {
  FaTicketAlt, FaComments, FaRobot, FaQuestionCircle, FaHeadset,
  FaArrowUp, FaArrowDown, FaExclamationTriangle, FaSpinner, FaUserPlus, FaTrash, FaCheck, FaClock
} from 'react-icons/fa';

const SupportDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [agents, setAgents] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newAgentEmail, setNewAgentEmail] = useState('');
  const [addingAgent, setAddingAgent] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [dashResult, agentsResult, chatsResult] = await Promise.all([
        supportService.getAdminDashboard(),
        supportService.getAdminAgents(),
        supportService.getAdminChats({ limit: 10 })
      ]);
      setDashboard(dashResult.data);
      setAgents(agentsResult.data);
      setActiveChats(chatsResult.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const handleAddAgent = async () => {
    if (!newAgentEmail) return;
    setAddingAgent(true);
    try {
      const userResult = await (await import('../services/index')).employeeService?.getAll({ search: newAgentEmail, limit: 1 });
      if (userResult?.data?.length > 0) {
        await supportService.addAdminAgent(userResult.data[0].user_id);
        await loadDashboard();
        setNewAgentEmail('');
      }
    } catch (err) {
      console.error('Failed to add agent:', err);
    } finally {
      setAddingAgent(false);
    }
  };

  const handleRemoveAgent = async (agentId) => {
    if (!window.confirm('Remove this support agent?')) return;
    try {
      await supportService.removeAdminAgent(agentId);
      loadDashboard();
    } catch (err) {
      console.error('Failed to remove agent:', err);
    }
  };

  const handleToggleAvailability = async (agentId, available) => {
    try {
      await supportService.updateAdminAgent(agentId, { is_available: available });
      loadDashboard();
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-3xl text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <FaExclamationTriangle className="text-red-500 text-3xl mx-auto mb-2" />
        <p className="text-red-700">{error}</p>
        <button onClick={loadDashboard} className="mt-3 text-sm text-red-600 underline">Retry</button>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, label, value, color, sublabel, trend }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value || 0}</p>
          {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="text-white text-lg" />
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-3 text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend >= 0 ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
          <span>{Math.abs(trend)}% from last week</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor and manage customer support</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/support/tickets')}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            All Tickets
          </button>
          <button onClick={() => navigate('/support/faq')}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Manage FAQ
          </button>
        </div>
      </div>

      {dashboard && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={FaTicketAlt} label="Open Tickets" value={dashboard.tickets?.open} color="bg-orange-500" sublabel={`${dashboard.tickets?.urgent || 0} urgent`} />
            <StatCard icon={FaComments} label="Active Chats" value={dashboard.chats?.active_chats} color="bg-primary-500" sublabel={`${dashboard.chats?.waiting_chats || 0} waiting`} />
            <StatCard icon={FaRobot} label="AI Conversations" value={dashboard.chats?.ai_chats} color="bg-secondary-500" sublabel={`${dashboard.ai?.total_queries || 0} queries this week`} />
            <StatCard icon={FaHeadset} label="Available Agents" value={dashboard.tickets?.available_agents} color="bg-green-500" sublabel={`${dashboard.tickets?.busy_agents || 0} busy`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Active Chats</h2>
                  <span className="text-xs text-gray-400">{activeChats?.length || 0} active</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {activeChats?.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No active chats</div>
                  ) : (
                    activeChats?.slice(0, 5).map(chat => (
                      <div key={chat.chat_id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate('/support/tickets')}>
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${chat.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                          <div>
                            <p className="text-sm font-medium text-gray-800">{chat.user_email || `User #${chat.user_id}`}</p>
                            <p className="text-xs text-gray-400">
                              {chat.is_ai_active ? '🤖 AI handling' : '👤 Agent assigned'}
                              {chat.department && ` · ${chat.department}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            chat.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                            chat.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>{chat.priority}</span>
                          {parseInt(chat.unread) > 0 && (
                            <span className="bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                              {chat.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Recent Activity</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {dashboard.recent_activity?.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No recent activity</div>
                  ) : (
                    dashboard.recent_activity?.map((activity, idx) => (
                      <div key={idx} className="px-5 py-3 flex items-center gap-3">
                        <FaTicketAlt className="text-gray-300 text-sm" />
                        <div>
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">{activity.ref}</span> - {activity.description?.slice(0, 60)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(activity.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Support Agents</h2>
                  <span className="text-xs text-gray-400">{agents?.length || 0} total</span>
                </div>
                <div className="p-4">
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={newAgentEmail}
                      onChange={(e) => setNewAgentEmail(e.target.value)}
                      placeholder="Add agent by email..."
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-400"
                    />
                    <button onClick={handleAddAgent} disabled={addingAgent || !newAgentEmail}
                      className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50">
                      {addingAgent ? <FaSpinner className="animate-spin" /> : <FaUserPlus />}
                    </button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {agents?.map(agent => (
                      <div key={agent.agent_id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2.5 h-2.5 rounded-full ${agent.is_available ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <div>
                            <p className="text-sm font-medium text-gray-800">{agent.email || `Agent #${agent.agent_id}`}</p>
                            <p className="text-[11px] text-gray-400">{agent.current_chats || 0} active chats</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleToggleAvailability(agent.agent_id, !agent.is_available)}
                            className={`p-1.5 rounded text-xs ${agent.is_available ? 'text-gray-400 hover:text-green-600' : 'text-gray-300 hover:text-gray-600'}`}
                            title={agent.is_available ? 'Set offline' : 'Set online'}>
                            {agent.is_available ? <FaCheck size={12} /> : <FaClock size={12} />}
                          </button>
                          <button onClick={() => handleRemoveAgent(agent.agent_id)}
                            className="p-1.5 rounded text-gray-300 hover:text-red-500 transition-colors">
                            <FaTrash size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!agents || agents.length === 0) && (
                      <p className="text-sm text-gray-400 text-center py-4">No support agents configured</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-900 mb-3">AI Performance</h2>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Avg Confidence</span>
                      <span className="font-medium">{dashboard.ai?.avg_confidence ? (dashboard.ai.avg_confidence * 100).toFixed(1) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${dashboard.ai?.avg_confidence ? dashboard.ai.avg_confidence * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">FAQ Match Rate</span>
                    <span className="font-medium">
                      {dashboard.ai?.total_queries > 0
                        ? ((dashboard.ai.faq_matches / dashboard.ai.total_queries) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total AI Queries (7d)</span>
                    <span className="font-medium">{dashboard.ai?.total_queries || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SupportDashboard;
