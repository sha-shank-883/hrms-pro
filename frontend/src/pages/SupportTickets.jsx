import React, { useState, useEffect, useCallback } from 'react';
import { supportService } from '../services/supportService';
import { useAuth } from '../context/AuthContext';
import {
  FaTicketAlt, FaPlus, FaSearch, FaFilter, FaSpinner, FaEye, FaCheck,
  FaClock, FaExclamationTriangle, FaUser, FaPaperclip, FaTimes, FaReply, FaTrash
} from 'react-icons/fa';

const STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600'
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-600',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700'
};

const SupportTickets = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', description: '', category: 'general', priority: 'normal' });
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const limit = 20;

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit, search: search || undefined };
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const result = await supportService.getTickets(params);
      setTickets(result.tickets || []);
      setPagination(result.pagination);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, priorityFilter]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  useEffect(() => {
    const debounce = setTimeout(() => { setPage(1); loadTickets(); }, 400);
    return () => clearTimeout(debounce);
  }, [search]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicket.subject) return;
    setSubmitting(true);
    try {
      await supportService.createTicket(newTicket);
      setShowCreateModal(false);
      setNewTicket({ subject: '', description: '', category: 'general', priority: 'normal' });
      loadTickets();
    } catch (err) {
      console.error('Failed to create ticket:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (ticketId, status) => {
    try {
      await supportService.updateTicketStatus(ticketId, { status });
      loadTickets();
      if (selectedTicket?.ticket_id === ticketId) {
        setSelectedTicket(prev => ({ ...prev, status }));
      }
    } catch (err) {
      console.error('Failed to update ticket:', err);
    }
  };

  const handleAddComment = async (ticketId) => {
    if (!comment.trim()) return;
    try {
      await supportService.addTicketComment(ticketId, { comment, is_internal: false });
      setComment('');
      const result = await supportService.getTicketById(ticketId);
      setSelectedTicket(result.data);
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const viewTicket = async (ticketId) => {
    try {
      const result = await supportService.getTicketById(ticketId);
      setSelectedTicket(result.data);
    } catch (err) {
      console.error('Failed to load ticket:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-500 text-sm mt-1">
            {pagination ? `${pagination.total} total tickets` : 'Manage support tickets'}
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <FaPlus size={12} /> New Ticket
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400"
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400">
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400">
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <FaSpinner className="animate-spin text-3xl text-blue-500" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Ticket</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-gray-400">No tickets found</td>
                  </tr>
                ) : (
                  tickets.map(ticket => (
                    <tr key={ticket.ticket_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <span className="text-sm font-mono text-blue-600">{ticket.ticket_number}</span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-800 max-w-[250px] truncate">{ticket.subject}</p>
                        <p className="text-xs text-gray-400">{ticket.user_email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[ticket.status] || 'bg-gray-100'}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${PRIORITY_COLORS[ticket.priority] || 'bg-gray-100'}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-600">{ticket.category || '-'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-500">{new Date(ticket.created_at).toLocaleDateString()}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button onClick={() => viewTicket(ticket.ticket_id)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                          <FaEye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-40">
                  Previous
                </button>
                <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-40">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Create Ticket</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <input type="text" value={newTicket.subject} onChange={e => setNewTicket(p => ({ ...p, subject: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={newTicket.description} onChange={e => setNewTicket(p => ({ ...p, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 min-h-[80px]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={newTicket.category} onChange={e => setNewTicket(p => ({ ...p, category: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400">
                    <option value="general">General</option>
                    <option value="login">Login</option>
                    <option value="attendance">Attendance</option>
                    <option value="leave">Leave</option>
                    <option value="payroll">Payroll</option>
                    <option value="technical">Technical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select value={newTicket.priority} onChange={e => setNewTicket(p => ({ ...p, priority: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400">
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting || !newTicket.subject}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? <FaSpinner className="animate-spin" /> : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTicket && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedTicket(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedTicket.subject}</h2>
                <p className="text-sm text-gray-500 font-mono">{selectedTicket.ticket_number}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="flex gap-3 flex-wrap">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[selectedTicket.status]}`}>{selectedTicket.status}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${PRIORITY_COLORS[selectedTicket.priority]}`}>{selectedTicket.priority}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{selectedTicket.category}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{selectedTicket.source}</span>
              </div>

              {selectedTicket.description && (
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedTicket.description}
                </div>
              )}

              {isAdmin && selectedTicket.status !== 'closed' && (
                <div className="flex gap-2">
                  {selectedTicket.status === 'open' && (
                    <button onClick={() => handleUpdateStatus(selectedTicket.ticket_id, 'pending')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-medium hover:bg-yellow-200">
                      <FaClock size={11} /> Mark Pending
                    </button>
                  )}
                  {['open', 'pending'].includes(selectedTicket.status) && (
                    <button onClick={() => handleUpdateStatus(selectedTicket.ticket_id, 'resolved')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200">
                      <FaCheck size={11} /> Mark Resolved
                    </button>
                  )}
                  {selectedTicket.status === 'resolved' && (
                    <button onClick={() => handleUpdateStatus(selectedTicket.ticket_id, 'closed')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200">
                      <FaTimes size={11} /> Close
                    </button>
                  )}
                </div>
              )}

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Comments ({selectedTicket.comments?.length || 0})
                </h3>

                <div className="space-y-3 mb-4">
                  {selectedTicket.comments?.length === 0 ? (
                    <p className="text-sm text-gray-400">No comments yet</p>
                  ) : (
                    selectedTicket.comments?.map(comment => (
                      <div key={comment.comment_id} className={`p-3 rounded-lg ${comment.is_internal ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-700">{comment.user_email || 'User'}</span>
                          <span className="text-[10px] text-gray-400">{new Date(comment.created_at).toLocaleString()}</span>
                          {comment.is_internal && <span className="text-[10px] bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded">Internal</span>}
                        </div>
                        <p className="text-sm text-gray-700">{comment.comment}</p>
                      </div>
                    ))
                  )}
                </div>

                {selectedTicket.status !== 'closed' && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddComment(selectedTicket.ticket_id)}
                      placeholder="Add a comment..."
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                    <button onClick={() => handleAddComment(selectedTicket.ticket_id)} disabled={!comment.trim()}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                      <FaReply size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTickets;
