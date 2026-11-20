export class StudyApiError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(detail: string, status: number) {
    super(detail);
    this.name = "StudyApiError";
    this.detail = detail;
    this.status = status;
  }
}

const friendlyErrors: Record<number, string> = {
  401: "Sign in to open your study space.",
  403: "This request must come from the study app.",
  429: "Too many sign-in attempts. Please wait a few minutes and try again.",
  503: "The study service is temporarily unavailable.",
};

async function readErrorDetail(response: Response) {
  try {
    const payload = (await response.json()) as { detail?: unknown };
    if (typeof payload.detail === "string" && payload.detail.trim()) return payload.detail;
  } catch {
    // Fall through to the friendly message.
  }
  return friendlyErrors[response.status] ?? "The study request could not be completed.";
}

export async function studyRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (typeof init?.body === "string") headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`/api/study${path}`, {
      ...init,
      headers,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new StudyApiError("The study service could not be reached.", 0);
  }

  if (!response.ok) throw new StudyApiError(await readErrorDetail(response), response.status);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function studyGet<T>(path: string) {
  return studyRequest<T>(path);
}

export function studyMutate<T>(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
) {
  return studyRequest<T>(path, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

export type SubtitleStatus =
  | "not_studied"
  | "understood"
  | "confusing"
  | "has_questions"
  | "needs_revision";

export type QuestionStatus = "pending" | "asked" | "answered" | "archived";
export type QuestionPriority = "low" | "normal" | "urgent";

export type StudyUser = { id: number; username: string };

export type Subtitle = {
  id: number;
  lesson_id: number;
  title: string;
  sort_order: number;
  status: SubtitleStatus;
  note: string;
  last_reviewed_at: string | null;
  updated_at: string;
};

export type Lesson = {
  id: number;
  subject_id: number;
  title: string;
  chapter_number: number;
  sort_order: number;
  status: SubtitleStatus;
  status_override: SubtitleStatus | null;
  attention: boolean;
  note: string;
  subtitle_stats: Record<SubtitleStatus, number> & { total: number };
  subtitles: Subtitle[];
  created_at: string;
  updated_at: string;
};

export type SubjectSummary = {
  id: number;
  name: string;
  slug: string;
  accent: string;
  lessons: number;
  subtitles: number;
  understood: number;
  confusing: number;
  has_questions: number;
  questions: number;
  unresolved: number;
  progress: number;
};

export type LessonList = {
  items: Lesson[];
  total: number;
  subjects: SubjectSummary[];
};

export type Question = {
  id: number;
  title: string;
  body: string;
  subject_id: number;
  subject_name: string;
  lesson_id: number | null;
  lesson_title: string | null;
  subtitle_id: number | null;
  subtitle_title: string | null;
  teacher: string;
  priority: QuestionPriority;
  status: QuestionStatus;
  response: string;
  personal_note: string;
  created_at: string;
  updated_at: string;
  asked_at: string | null;
  answered_at: string | null;
};

export type QuestionPage = {
  items: Question[];
  total: number;
  limit: number;
  offset: number;
};

export type AttentionLesson = {
  id: number;
  title: string;
  chapter_number: number;
  subject_id: number;
  subject_name: string;
  status: SubtitleStatus;
  confusing: number;
  has_questions: number;
  understood: number;
  total: number;
};

export type OverdueQuestion = {
  id: number;
  title: string;
  subject_name: string;
  teacher: string;
  asked_at: string;
  days_waiting: number;
};

export type UrgentQuestion = {
  id: number;
  title: string;
  subject_name: string;
  status: QuestionStatus;
  created_at: string;
};

export type ContinueLesson = {
  id: number;
  title: string;
  chapter_number: number;
  subject_id: number;
  subject_name: string;
  status: SubtitleStatus;
  understood: number;
  total: number;
};

export type DashboardData = {
  totals: { lessons: number; subtitles: number } & Record<SubtitleStatus, number>;
  questions: { total: number; by_status: Record<QuestionStatus, number> };
  homeworks: HomeworkSummary;
  subjects: SubjectSummary[];
  attention: {
    lessons: AttentionLesson[];
    overdue: OverdueQuestion[];
    urgent: UrgentQuestion[];
    homeworks: HomeworkDeadline[];
  };
  continue: ContinueLesson | null;
};

export type RemindersData = {
  overdue: OverdueQuestion[];
  urgent: UrgentQuestion[];
  confusing_lessons: AttentionLesson[];
  overdue_count: number;
  urgent_count: number;
  confusing_lesson_count: number;
  homeworks: HomeworkReminders;
};

export type SubjectList = { items: SubjectSummary[]; total: number };

export type QuestionDraft = {
  title: string;
  body: string;
  subject_id: number;
  lesson_id: number | null;
  subtitle_id: number | null;
  teacher: string;
  priority: QuestionPriority;
  status: QuestionStatus;
  response: string;
  personal_note: string;
};

export type HomeworkSubject = "math" | "physics" | "si" | "french" | "english" | "philosophy";
export type HomeworkPriority = "low" | "normal" | "high";
export type HomeworkStatus = "not_started" | "in_progress" | "submitted" | "graded";

export const HOMEWORK_SUBJECTS: { value: HomeworkSubject; label: string }[] = [
  { value: "math", label: "Mathématiques" },
  { value: "physics", label: "Physique et Chimie" },
  { value: "si", label: "Sciences de l'ingénieur" },
  { value: "french", label: "Français" },
  { value: "english", label: "Anglais" },
  { value: "philosophy", label: "Philosophie" },
];

export function homeworkSubjectLabel(value: string) {
  return HOMEWORK_SUBJECTS.find((subject) => subject.value === value)?.label ?? value;
}

export type Homework = {
  id: number;
  title: string;
  subject: HomeworkSubject;
  subject_name: string;
  lesson_id: number | null;
  lesson_title: string | null;
  description: string;
  teacher: string;
  priority: HomeworkPriority;
  status: HomeworkStatus;
  assigned_on: string | null;
  due_on: string | null;
  notes: string;
  result: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type HomeworkPage = {
  items: Homework[];
  total: number;
  limit: number;
  offset: number;
};

export type HomeworkDraft = {
  title: string;
  subject: HomeworkSubject;
  lesson_id: number | null;
  description: string;
  teacher: string;
  priority: HomeworkPriority;
  status: HomeworkStatus;
  assigned_on: string | null;
  due_on: string | null;
  notes: string;
  result: string;
};

export type HomeworkDeadline = {
  id: number;
  title: string;
  subject: HomeworkSubject;
  subject_name: string;
  due_on: string;
  days_left: number;
  status: HomeworkStatus;
  priority: HomeworkPriority;
};

export type HomeworkSummary = {
  total: number;
  by_status: Record<HomeworkStatus, number>;
  overdue: number;
  due_soon: number;
  upcoming: HomeworkDeadline[];
};

export type HomeworkReminders = {
  overdue: HomeworkDeadline[];
  today: HomeworkDeadline[];
  soon: HomeworkDeadline[];
  overdue_count: number;
  today_count: number;
  soon_count: number;
};