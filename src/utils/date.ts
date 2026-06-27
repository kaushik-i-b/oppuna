/** Lightweight, dependency-free date helpers. */

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function daysAgo(n: number): number {
  return startOfDay(Date.now() - n * 24 * 60 * 60 * 1000);
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(ts: number): string {
  return `${formatDate(ts)} · ${formatTime(ts)}`;
}

export function relativeDay(ts: number): string {
  const today = startOfDay(Date.now());
  const day = startOfDay(ts);
  const diff = Math.round((today - day) / (24 * 60 * 60 * 1000));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return formatDate(ts);
}

export function weekdayShort(ts: number): string {
  return new Date(ts).toLocaleDateString([], { weekday: 'short' });
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
