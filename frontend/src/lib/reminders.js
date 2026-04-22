// Helpers for turning UI-selected reminder presets into an ISO timestamp
// the backend can store, and for initialising the dropdown from an existing
// `reminder_at` on a saved task.

export const REMINDER_PRESETS = [
    { value: 'none',    label: 'No reminder',            offsetMs: null },
    { value: '15min',   label: '15 minutes before due',  offsetMs: 15 * 60 * 1000 },
    { value: '1hour',   label: '1 hour before due',      offsetMs: 60 * 60 * 1000 },
    { value: '1day',    label: '1 day before due',       offsetMs: 24 * 60 * 60 * 1000 },
    { value: '1week',   label: '1 week before due',      offsetMs: 7 * 24 * 60 * 60 * 1000 },
    { value: 'custom',  label: 'Custom time…',           offsetMs: null },
];

/**
 * `dueDate` is a YYYY-MM-DD string from the date input. We treat it as
 * 09:00 local time on that day so a "1 day before" reminder lands at a
 * reasonable hour the day before, not at midnight.
 */
function dueDateToLocalTime(dueDate) {
    if (!dueDate) return null;
    const [y, m, d] = dueDate.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, 9, 0, 0, 0);
}

export function computeReminderAt({ preset, dueDate, customTime }) {
    if (!preset || preset === 'none') return null;
    if (preset === 'custom') {
        if (!customTime) return null;
        const d = new Date(customTime);
        return isNaN(d.getTime()) ? null : d.toISOString();
    }
    const offset = REMINDER_PRESETS.find((p) => p.value === preset)?.offsetMs;
    const anchor = dueDateToLocalTime(dueDate);
    if (!offset || !anchor) return null;
    return new Date(anchor.getTime() - offset).toISOString();
}

/**
 * Given a saved `reminder_at` ISO string and a `due_date`, pick the preset
 * (or 'custom') that best represents that time, plus a datetime-local
 * string for the custom input if needed.
 */
export function inferReminderSelection({ reminderAt, dueDate }) {
    if (!reminderAt) return { preset: 'none', customTime: '' };
    const reminder = new Date(reminderAt);
    const anchor = dueDateToLocalTime(dueDate);
    if (anchor) {
        const diff = anchor.getTime() - reminder.getTime();
        const match = REMINDER_PRESETS.find((p) => p.offsetMs && p.offsetMs === diff);
        if (match) return { preset: match.value, customTime: '' };
    }
    return { preset: 'custom', customTime: toDatetimeLocalValue(reminder) };
}

export function toDatetimeLocalValue(date) {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
