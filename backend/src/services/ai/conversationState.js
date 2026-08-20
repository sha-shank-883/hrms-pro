/**
 * Structured Conversation State & Pronoun Resolution Engine
 * Maintains active entity pointers and prevents cross-turn slot pollution.
 */

class ConversationStateManager {
  constructor() {
    this.sessions = new Map();
    this.SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour
  }

  _getSession(sessionId) {
    const id = sessionId || 'default';
    let session = this.sessions.get(id);
    if (!session || Date.now() - session.updatedAt > this.SESSION_TTL_MS) {
      session = {
        activeEntity: null,     // { type: 'employee', id, name, code, department }
        activeDepartment: null, // { id, name }
        activeWorkflow: null,   // { type: 'create_employee', slots: {}, updatedAt }
        updatedAt: Date.now()
      };
      this.sessions.set(id, session);
    }
    session.updatedAt = Date.now();
    return session;
  }

  /**
   * Set the active entity reference for pronouns
   */
  setActiveEntity(sessionId, entity) {
    const session = this._getSession(sessionId);
    session.activeEntity = {
      type: entity.type || 'employee',
      id: entity.id || entity.employee_id,
      name: entity.name || `${entity.first_name || ''} ${entity.last_name || ''}`.trim(),
      code: entity.code || entity.employee_code,
      department: entity.department || entity.department_name,
      updatedAt: Date.now()
    };
  }

  /**
   * Get current active entity
   */
  getActiveEntity(sessionId) {
    const session = this._getSession(sessionId);
    return session.activeEntity;
  }

  /**
   * Resolve pronouns ("his", "her", "their", "that employee", "them") to active entity name
   */
  resolvePronouns(text, sessionId) {
    if (!text || typeof text !== 'string') return text;
    const session = this._getSession(sessionId);
    const active = session.activeEntity;

    if (!active || !active.name) return text;

    const pronounPatterns = [
      /\b(?:his|her|their)\s+(?:salary|attendance|leave|leaves|profile|details|goals|manager|department|status|records?)\b/gi,
      /\b(?:that|this|the\s+same)\s+(?:employee|worker|staff|person|candidate|member)\b/gi,
      /\bfor\s+(?:him|her|them)\b/gi,
      /\babout\s+(?:him|her|them)\b/gi
    ];

    let resolved = text;
    resolved = resolved.replace(/\b(?:his|her|their)\s+(salary|attendance|leaves?|profile|details|goals|manager|department|status|records?)\b/gi, `${active.name}'s $1`);
    resolved = resolved.replace(/\b(?:that|this|the\s+same)\s+(?:employee|worker|staff|person|candidate|member)\b/gi, active.name);
    resolved = resolved.replace(/\bfor\s+(?:him|her|them)\b/gi, `for ${active.name}`);
    resolved = resolved.replace(/\babout\s+(?:him|her|them)\b/gi, `about ${active.name}`);

    return resolved;
  }

  /**
   * Start or update structured slot collection workflow
   */
  updateWorkflowSlots(sessionId, workflowType, newSlots = {}) {
    const session = this._getSession(sessionId);
    if (!session.activeWorkflow || session.activeWorkflow.type !== workflowType) {
      session.activeWorkflow = {
        type: workflowType,
        slots: { ...newSlots },
        startedAt: Date.now()
      };
    } else {
      session.activeWorkflow.slots = {
        ...session.activeWorkflow.slots,
        ...newSlots
      };
    }
    return session.activeWorkflow.slots;
  }

  /**
   * Get active workflow state
   */
  getWorkflowState(sessionId) {
    const session = this._getSession(sessionId);
    return session.activeWorkflow;
  }

  /**
   * Reset workflow after successful execution or cancel
   */
  clearWorkflow(sessionId) {
    const session = this._getSession(sessionId);
    session.activeWorkflow = null;
  }
}

module.exports = new ConversationStateManager();
