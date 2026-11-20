export function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function daysSince(value: string | null | undefined) {
  if (!value) return 0;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
}

export function percent(part: number, total: number) {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((part / total) * 100)));
}

export function plural(count: number, singular: string, pluralForm?: string) {
  return count === 1 ? singular : (pluralForm ?? `${singular}s`);
}

export function todayISO(from = new Date()) {
  const year = from.getFullYear();
  const month = String(from.getMonth() + 1).padStart(2, "0");
  const day = String(from.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseISODate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parts = value.split("-").map(Number);
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function daysUntil(value: string | null | undefined, from = new Date()): number | null {
  const target = parseISODate(value);
  if (!target) return null;
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}

export function formatDueDate(value: string | null | undefined) {
  const date = parseISODate(value);
  if (!date) return "";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function dueLabel(value: string | null | undefined) {
  const days = daysUntil(value);
  if (days === null) return "No due date";
  if (days < 0) {
    const late = Math.abs(days);
    return `${late} ${plural(late, "day")} overdue`;
  }
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

export function dueTone(value: string | null | undefined, status?: string) {
  if (status === "submitted" || status === "graded") return "text-emerald-600";
  const days = daysUntil(value);
  if (days === null) return "text-slate-500";
  if (days < 0) return "text-rose-600";
  if (days <= 1) return "text-amber-600";
  return "text-slate-500";
}

export function normalizeSearch(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

export function matchesSearch(haystack: string, needle: string) {
  const normalizedNeedle = normalizeSearch(needle.trim());
  if (!normalizedNeedle) return true;
  return normalizeSearch(haystack).includes(normalizedNeedle);
}

export function stripMath(value: string) {
  return value
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/\\\[[\s\S]*?\\\]/g, " ")
    .replace(/\\\([\s\S]*?\\\)/g, " ")
    .replace(/\$[^$\n]*\$/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripMarkdown(value: string) {
  const withoutBlocks = value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/~~~[\s\S]*?~~~/g, " ")
    .replace(/`([^`]*)`/g, "$1");

  const withoutLinks = withoutBlocks
    .replace(/!\[([^\]]*)\]\([^)\s]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)\s]*\)/g, "$1")
    .replace(/<((?:https?:\/\/|mailto:)[^>\s]+)>/g, "$1");

  const withoutMarks = withoutLinks
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s{0,3}(?:[-*+]|\d+[.)])\s+/gm, "")
    .replace(/^\s{0,3}(?:[-*_]\s*){3,}$/gm, " ")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/\|/g, " ");

  return stripMath(withoutMarks);
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function todayLabel(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}