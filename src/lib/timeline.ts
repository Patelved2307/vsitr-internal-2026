/** Convert a stored timeline value (ISO or legacy display text) to a Date. */
export const parseTimelineDate = (value: string): Date | null => {
  if (!value) return null;
  
  // If the value contains any letters or custom text indicating it's a custom text/description date,
  // (e.g. contains parentheses, or words like "soon", "will", "shared", "tbd", "pending")
  // we do not want to parse it as a Date object, to avoid V8's Date.parse from discarding the comment.
  const lowercase = value.toLowerCase();
  if (
    lowercase.includes('(') ||
    lowercase.includes(')') ||
    lowercase.includes('soon') ||
    lowercase.includes('will') ||
    lowercase.includes('shared') ||
    lowercase.includes('tbd') ||
    lowercase.includes('pending')
  ) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/** Format dates consistently for the public timeline and the admin list. */
export const formatTimelineDate = (value: string): string => {
  const date = parseTimelineDate(value);
  if (!date) return value;

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).replace(' at ', ', ').replace(' am', ' AM').replace(' pm', ' PM');
};

/** Value accepted by an <input type="datetime-local"> in the visitor's timezone. */
export const toTimelineDateTimeInput = (value: string): string => {
  const date = parseTimelineDate(value);
  if (!date) return '';
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
};
