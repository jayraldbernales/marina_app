// src/utils/time.ts

export function formatHoursAgo(hours: number): string {
  if (!Number.isFinite(hours)) return "";

  // Handle pre-order (future dates)
  if (hours < 0) {
    const absHours = Math.abs(hours);

    // Less than 1 hour in the future
    if (absHours < 1) {
      const minutes = Math.ceil(absHours * 60);
      return `Harvest on ${minutes} min`;
    }

    // Less than 24 hours in the future
    if (absHours < 24) {
      const wholeHours = Math.floor(absHours);
      return `Harvest on ${wholeHours} hr${wholeHours > 1 ? "s" : ""}`;
    }

    // 24+ hours in the future
    const days = Math.floor(absHours / 24);
    return `Harvest on ${days} day${days > 1 ? "s" : ""}`;
  }

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
