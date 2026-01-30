export function formatHoursAgo(hours: number): string {
  if (!Number.isFinite(hours) || hours < 0) return "";

  // Less than 1 hour → show minutes
  if (hours < 1) {
    const minutes = Math.max(1, Math.floor(hours * 60));
    return `${minutes} min ago`;
  }

  // Less than 24 hours → show hours
  if (hours < 24) {
    const wholeHours = Math.floor(hours);
    return `${wholeHours} hr${wholeHours > 1 ? "s" : ""} ago`;
  }

  // 24+ hours → show days
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}
