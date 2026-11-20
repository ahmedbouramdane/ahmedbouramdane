import type {
  HomeworkPriority,
  HomeworkStatus,
  QuestionPriority,
  QuestionStatus,
  SubtitleStatus,
} from "../lib/api";

type StatusMeta = { label: string; pill: string; dot: string; hint: string };

export const SUBTITLE_STATUS_ORDER: SubtitleStatus[] = [
  "not_studied",
  "understood",
  "confusing",
  "has_questions",
  "needs_revision",
];

export const SUBTITLE_STATUS_META: Record<SubtitleStatus, StatusMeta> = {
  not_studied: {
    label: "Not studied",
    pill: "border-slate-200 bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
    hint: "Not reviewed yet",
  },
  understood: {
    label: "Understood",
    pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    hint: "Clear and confident",
  },
  confusing: {
    label: "Confusing",
    pill: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
    hint: "Needs another pass",
  },
  has_questions: {
    label: "Has questions",
    pill: "border-rose-200 bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
    hint: "Ask the teacher",
  },
  needs_revision: {
    label: "Needs revision",
    pill: "border-violet-200 bg-violet-50 text-violet-700",
    dot: "bg-violet-500",
    hint: "Review again soon",
  },
};

export const QUESTION_STATUS_ORDER: QuestionStatus[] = ["pending", "asked", "answered", "archived"];

export const QUESTION_STATUS_META: Record<QuestionStatus, StatusMeta> = {
  pending: {
    label: "Pending",
    pill: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
    hint: "Not sent to the teacher yet",
  },
  asked: {
    label: "Asked",
    pill: "border-sky-200 bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
    hint: "Waiting for an answer",
  },
  answered: {
    label: "Answered",
    pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    hint: "Answer received",
  },
  archived: {
    label: "Archived",
    pill: "border-slate-200 bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
    hint: "Kept for reference",
  },
};

export const PRIORITY_ORDER: QuestionPriority[] = ["urgent", "normal", "low"];

export const PRIORITY_META: Record<
  QuestionPriority,
  { label: string; badge: string; stripe: string; dot: string }
> = {
  low: {
    label: "Low",
    badge: "border-slate-200 bg-slate-100 text-slate-600",
    stripe: "border-l-slate-300",
    dot: "bg-slate-400",
  },
  normal: {
    label: "Normal",
    badge: "border-indigo-200 bg-indigo-50 text-indigo-700",
    stripe: "border-l-indigo-400",
    dot: "bg-indigo-500",
  },
  urgent: {
    label: "Urgent",
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    stripe: "border-l-rose-500",
    dot: "bg-rose-500",
  },
};

export function StatusPill({
  status,
  className = "",
}: {
  status: SubtitleStatus;
  className?: string;
}) {
  const meta = SUBTITLE_STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${meta.pill} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export function QuestionStatusPill({
  status,
  className = "",
}: {
  status: QuestionStatus;
  className?: string;
}) {
  const meta = QUESTION_STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${meta.pill} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export const HOMEWORK_STATUS_ORDER: HomeworkStatus[] = [
  "not_started",
  "in_progress",
  "submitted",
  "graded",
];

export const HOMEWORK_STATUS_META: Record<HomeworkStatus, StatusMeta> = {
  not_started: {
    label: "To do",
    pill: "border-slate-200 bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
    hint: "Not started",
  },
  in_progress: {
    label: "In progress",
    pill: "border-sky-200 bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
    hint: "Working on it",
  },
  submitted: {
    label: "Submitted",
    pill: "border-indigo-200 bg-indigo-50 text-indigo-700",
    dot: "bg-indigo-500",
    hint: "Handed in",
  },
  graded: {
    label: "Graded",
    pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    hint: "Feedback received",
  },
};

export const HOMEWORK_PRIORITY_ORDER: HomeworkPriority[] = ["high", "normal", "low"];

export const HOMEWORK_PRIORITY_META: Record<
  HomeworkPriority,
  { label: string; badge: string; dot: string }
> = {
  low: {
    label: "Low",
    badge: "border-slate-200 bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  },
  normal: {
    label: "Normal",
    badge: "border-indigo-200 bg-indigo-50 text-indigo-700",
    dot: "bg-indigo-500",
  },
  high: {
    label: "High",
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
  },
};

export function PriorityBadge({
  priority,
  className = "",
}: {
  priority: QuestionPriority;
  className?: string;
}) {
  const meta = PRIORITY_META[priority];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.badge} ${className}`}
    >
      {meta.label}
    </span>
  );
}

export function HomeworkStatusPill({
  status,
  className = "",
}: {
  status: HomeworkStatus;
  className?: string;
}) {
  const meta = HOMEWORK_STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${meta.pill} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}