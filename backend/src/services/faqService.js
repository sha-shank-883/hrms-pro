const { query } = require('../config/database');

const FAQ_INTENTS = {
  'login': ['login', 'sign in', 'signin', 'can\'t login', 'cant login', 'unable to login', 'access', 'credential', 'authentication'],
  'password_reset': ['password reset', 'forgot password', 'change password', 'reset password', 'forgot my password', 'password change'],
  'attendance': ['attendance', 'clock in', 'clock out', 'check in', 'check out', 'punch', 'time tracking', 'late mark', 'absent'],
  'leave': ['leave', 'vacation', 'holiday', 'time off', 'pto', 'sick leave', 'casual leave', 'maternity', 'paternity', 'bereavement'],
  'payroll': ['payroll', 'salary', 'payslip', 'pay slip', 'payment', 'tax', 'deduction', 'bonus', 'overtime'],
  'onboarding': ['onboarding', 'new employee', 'joining', 'induction', 'welcome', 'orientation'],
  'reports': ['report', 'download report', 'export', 'analytics', 'dashboard', 'data export'],
  'roles': ['role', 'permission', 'access control', 'authorization', 'user role', 'rbac', 'rights'],
  'garage': ['garage', 'vehicle', 'fleet', 'maintenance', 'repair', 'service request', 'workshop'],
  'profile': ['profile', 'update profile', 'edit profile', 'my details', 'personal info', 'contact details'],
  'documents': ['document', 'upload document', 'download document', 'file', 'attachment', 'kyc'],
  'general': ['help', 'support', 'contact', 'how to', 'how do i', 'what is', 'guide', 'tutorial']
};

const getFAQMatch = async (message, category = null) => {
  const normalizedMessage = message.toLowerCase().trim();

  const intent = detectIntent(normalizedMessage);
  const keywords = extractKeywords(normalizedMessage);

  let queryText = `
    SELECT a.*, c.name as category_name, c.slug as category_slug
    FROM faq_articles a
    LEFT JOIN faq_categories c ON a.category_id = c.category_id
    WHERE a.is_published = true
  `;
  const params = [];
  let paramCount = 1;

  if (category) {
    queryText += ` AND c.slug = $${paramCount}`;
    params.push(category);
    paramCount++;
  }

  if (keywords.length > 0) {
    const searchTerms = keywords.map(k => k.replace(/[^\w\s]/g, '')).filter(k => k.length > 2);
    if (searchTerms.length > 0) {
      const tsQuery = searchTerms.join(' & ');
      queryText += ` AND search_vector @@ to_tsquery('english', $${paramCount})`;
      params.push(tsQuery);
      paramCount++;

      queryText += ` ORDER BY ts_rank(search_vector, to_tsquery('english', $${paramCount})) DESC`;
      params.push(tsQuery);
      paramCount++;
    } else {
      queryText += ' ORDER BY a.helpful_count DESC';
    }
  } else {
    queryText += ' ORDER BY a.helpful_count DESC';
  }

  queryText += ' LIMIT 5';

  try {
    const result = await query(queryText, params);

    if (result.rows.length === 0) {
      return { matched: false, articles: [] };
    }

    const bestMatch = result.rows[0];
    const confidence = calculateConfidence(normalizedMessage, bestMatch, keywords);

    return {
      matched: confidence >= 0.4,
      confidence,
      article: confidence >= 0.4 ? bestMatch : null,
      articles: result.rows.map(a => ({
        id: a.article_id,
        question: a.question,
        answer: a.answer,
        category: a.category_name,
        confidence: calculateConfidence(normalizedMessage, a, keywords)
      }))
    };
  } catch (error) {
    console.error('[FAQService] Error matching FAQ:', error);
    return { matched: false, articles: [], error: error.message };
  }
};

const detectIntent = (message) => {
  for (const [intent, patterns] of Object.entries(FAQ_INTENTS)) {
    for (const pattern of patterns) {
      if (message.includes(pattern)) {
        return intent;
      }
    }
  }
  return 'general';
};

const extractKeywords = (message) => {
  return message
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'some', 'same', 'also', 'just', 'about', 'above', 'after', 'again', 'being', 'does', 'down', 'each', 'else', 'from', 'more', 'most', 'much', 'must', 'only', 'over', 'some', 'such', 'than', 'that', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 'very', 'were', 'when', 'which', 'while', 'with'].includes(w))
    .map(w => w.toLowerCase());
};

const calculateConfidence = (message, article, keywords) => {
  let score = 0;
  const articleWords = (article.question + ' ' + article.answer).toLowerCase();
  const articleKeywords = typeof article.keywords === 'string' ? JSON.parse(article.keywords || '[]') : (article.keywords || []);

  for (const keyword of keywords) {
    if (articleWords.includes(keyword)) {
      score += 0.15;
    }
  }

  const questionWords = article.question.toLowerCase().split(/\s+/);
  const messageBigrams = [];

  for (let i = 0; i < message.split(/\s+/).length - 1; i++) {
    messageBigrams.push(message.split(/\s+/).slice(i, i + 2).join(' '));
  }

  for (const bigram of messageBigrams) {
    if (article.question.toLowerCase().includes(bigram)) {
      score += 0.25;
    }
  }

  for (const kw of articleKeywords) {
    if (message.includes(kw.toLowerCase())) {
      score += 0.2;
    }
  }

  const intent = detectIntent(message);
  const articleSlug = article.category_slug || '';
  if (intent === articleSlug) {
    score += 0.1;
  }

  return Math.min(1, score);
};

const recordFeedback = async (articleId, helpful) => {
  try {
    const column = helpful ? 'helpful_count' : 'not_helpful_count';
    await query(
      `UPDATE faq_articles SET ${column} = ${column} + 1 WHERE article_id = $1`,
      [articleId]
    );
    return true;
  } catch (error) {
    console.error('[FAQService] Error recording feedback:', error);
    return false;
  }
};

const searchFAQs = async (searchTerm, category = null, page = 1, limit = 20) => {
  try {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    let queryText = `
      SELECT a.*, c.name as category_name, c.slug as category_slug
      FROM faq_articles a
      LEFT JOIN faq_categories c ON a.category_id = c.category_id
      WHERE a.is_published = true
    `;
    let countQuery = `
      SELECT COUNT(*) as total
      FROM faq_articles a
      LEFT JOIN faq_categories c ON a.category_id = c.category_id
      WHERE a.is_published = true
    `;
    const params = [];
    const countParams = [];
    let paramCount = 1;

    if (category) {
      queryText += ` AND c.slug = $${paramCount}`;
      countQuery += ` AND c.slug = $${paramCount}`;
      params.push(category);
      countParams.push(category);
      paramCount++;
    }

    if (searchTerm) {
      const searchClause = ` AND (a.question ILIKE $${paramCount} OR a.answer ILIKE $${paramCount} OR a.keywords::text ILIKE $${paramCount})`;
      queryText += searchClause;
      countQuery += searchClause;
      params.push(`%${searchTerm}%`);
      countParams.push(`%${searchTerm}%`);
      paramCount++;
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    queryText += ` ORDER BY a.helpful_count DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limitNum, offset);

    const result = await query(queryText, params);

    return {
      articles: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  } catch (error) {
    console.error('[FAQService] Error searching FAQs:', error);
    throw error;
  }
};

const getAllCategories = async () => {
  try {
    const result = await query(
      'SELECT c.*, COUNT(a.article_id) as article_count FROM faq_categories c LEFT JOIN faq_articles a ON c.category_id = a.category_id AND a.is_published = true GROUP BY c.category_id ORDER BY c.display_order, c.name'
    );
    return result.rows;
  } catch (error) {
    console.error('[FAQService] Error getting categories:', error);
    throw error;
  }
};

module.exports = {
  getFAQMatch,
  recordFeedback,
  searchFAQs,
  getAllCategories,
  FAQ_INTENTS,
  detectIntent
};
