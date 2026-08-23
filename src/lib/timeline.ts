/** Convert a stored timeline value (ISO or legacy display text) to a Date. */
export const parseTimelineDate = (value: string): Date | null => {
  if (!value) return null;
  // Only parse if it looks like an ISO date string — do NOT parse free-text like "Time will be shared soon"
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/** Format dates consistently for the public timeline and the admin list. */
export const formatTimelineDate = (value: string): string => {
  if (!value) return value;

  // If the value is a proper ISO 8601 string (YYYY-MM-DDTHH:mm...), parse and format it
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      }).replace(' at ', ', ').replace(' am', ' AM').replace(' pm', ' PM');
    }
  }

  // For plain-text values like "26 August 2026 (Time will be shared soon)"
  // return them exactly as stored — do NOT try to parse them
  return value;
};

/** Value accepted by an <input type="datetime-local"> in the visitor's timezone. */
export const toTimelineDateTimeInput = (value: string): string => {
  if (!value) return '';
  // Only convert if it looks like an ISO date; plain text should not populate the datetime picker
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
};
