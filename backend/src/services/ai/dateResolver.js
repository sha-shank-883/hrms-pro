/**
 * Deterministic Date & Period Resolution Engine
 * Accurately parses relative date expressions without hallucination.
 */

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Format a Date object to YYYY-MM-DD
 */
function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Resolve relative date strings (today, yesterday, tomorrow, next Friday, etc.)
 * @param {string} text - Relative date phrase
 * @param {Date} [referenceDate=new Date()] - Reference date
 * @returns {string|null} Resolved YYYY-MM-DD string or null
 */
function resolveRelativeDate(text, referenceDate = new Date()) {
  if (!text || typeof text !== 'string') return null;

  const clean = text.toLowerCase().trim();

  // 1. Direct keywords
  if (clean === 'today' || clean === 'now') {
    return formatDate(referenceDate);
  }
  if (clean === 'yesterday') {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - 1);
    return formatDate(d);
  }
  if (clean === 'tomorrow') {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() + 1);
    return formatDate(d);
  }

  // 2. Exact ISO match (YYYY-MM-DD)
  const isoMatch = clean.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (isoMatch) return isoMatch[0];

  // 3. Day of week expressions (e.g. "next Friday", "this Monday", "coming Thursday")
  for (let i = 0; i < DAYS.length; i++) {
    const dayName = DAYS[i];
    if (clean.includes(dayName)) {
      const currentDayIdx = referenceDate.getDay();
      let diff = i - currentDayIdx;

      if (clean.includes('next')) {
        diff = diff <= 0 ? diff + 7 : diff;
        if (clean.includes('next week')) diff += 7;
      } else if (clean.includes('last') || clean.includes('previous')) {
        diff = diff >= 0 ? diff - 7 : diff;
      } else {
        // "this Friday" or just "Friday" -> upcoming
        if (diff <= 0) diff += 7;
      }

      const target = new Date(referenceDate);
      target.setDate(target.getDate() + diff);
      return formatDate(target);
    }
  }

  return null;
}

/**
 * Resolve relative period/month (e.g. "last month", "current quarter")
 */
function resolveRelativePeriod(text, referenceDate = new Date()) {
  if (!text || typeof text !== 'string') return null;
  const clean = text.toLowerCase().trim();

  const curMonth = referenceDate.getMonth() + 1;
  const curYear = referenceDate.getFullYear();

  if (clean.includes('last month') || clean.includes('previous month')) {
    const prevMonth = curMonth === 1 ? 12 : curMonth - 1;
    const prevYear = curMonth === 1 ? curYear - 1 : curYear;
    return { month: prevMonth, year: prevYear, label: `${prevMonth}/${prevYear}` };
  }

  if (clean.includes('this month') || clean.includes('current month')) {
    return { month: curMonth, year: curYear, label: `${curMonth}/${curYear}` };
  }

  return { month: curMonth, year: curYear, label: `${curMonth}/${curYear}` };
}

module.exports = {
  formatDate,
  resolveRelativeDate,
  resolveRelativePeriod
};
