import { format, formatDistanceToNow } from "date-fns";

export function formatDateIST(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd MMM yyyy");
}

export function formatDateTimeIST(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd MMM yyyy HH:mm");
}

/** e.g. 12 Jun 2026, 10:45 AM IST */
export function formatCustomerTimestamp(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${format(d, "d MMM yyyy, h:mm a")} IST`;
}

export function relativeTime(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
