// src/lib/utils/date.js
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

export function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

export function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

export function isToday(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export function isThisWeek(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
  return date >= weekStart;
}
