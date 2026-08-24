/** Convert a stored timeline value (ISO or legacy display text) to a Date. */
export const parseTimelineDate = (value: string): Date | null => {
  if (!value) return null;
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

/**
 * Presentation-day slots are announced separately. Older saved records used a
 * midnight placeholder, which must not be presented as a confirmed 12:00 AM
 * schedule on the public site.
 */
export const formatPresentationDayDate = (value: string): string => {
  const date = parseTimelineDate(value);
  if (!date) return value;

  const parts = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  const isMidnight = part('hour') === '12' && part('minute') === '00' && part('dayPeriod')?.toUpperCase() === 'AM';

  if (!isMidnight) return formatTimelineDate(value);

  return `${new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(date)} (Time will be shared soon)`;
};

/** Value accepted by an <input type="datetime-local"> in the visitor's timezone. */
export const toTimelineDateTimeInput = (value: string): string => {
  const date = parseTimelineDate(value);
  if (!date) return '';
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
};
