"use client";

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleHelp,
  Clock,
  Flame,
  Layers,
  Sparkles,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  StudyApiError,
  studyGet,
  type DashboardData,
  type QuestionPriority,
  type QuestionStatus,
} from "../lib/api";
import { formatDate, formatDueDate, greeting, percent, plural, todayLabel } from "../lib/format";
import { sendHomeworkNotifications } from "../lib/notifications";
import { StatusPill } from "../components/status";
import { subjectShortName } from "../components/subject-chips";
import {
  Alert,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ProgressBar,
  Skeleton,
} from "../components/ui";

type NavigateOptions = {
  subjectId?: number;
  questionStatus?: QuestionStatus;
  priority?: QuestionPriority;
};

type DashboardTabProps = {
  onNavigate: (
    tab: "lessons" | "questions" | "homeworks",
    options?: NavigateOptions,
  ) => void;
};

function StatCard({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: number | string;
  hint: string;
  tone: string;
  icon: ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-[var(--font-mono)] text-[10px] uppercase tracking-[0.12em] text-slate-500">
          {label}
        </p>
        <span className={`grid size-8 place-items-center rounded-lg ${tone}`}>{icon}</span>
      </div>
      <p className="mt-3 font-[var(--font-display)] text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">{hint}</p>
    </Card>
  );
}

export function DashboardTab({ onNavigate }: DashboardTabProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    studyGet<DashboardData>("/dashboard")
      .then((result) => {
        if (cancelled) return;
        setData(result);
        sendHomeworkNotifications(result.attention.homeworks);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(
          caught instanceof StudyApiError
            ? caught.detail
            : "The dashboard could not be loaded.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function reload() {
    setLoading(true);
    setError(null);
    setReloadKey((key) => key + 1);
  }

  if (loading && !data) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <Card>
        <EmptyState
          icon={<CircleHelp className="size-5" />}
          title="The dashboard is unavailable"
          description={error ?? undefined}
          action={
            <Button variant="secondary" onClick={reload}>
              Try again
            </Button>
          }
        />
      </Card>
    );
  }

  if (!data) return null;

  const pendingQuestions = data.questions.by_status.pending + data.questions.by_status.asked;
  const understood = data.totals.understood;
  const needsAttention =
    data.attention.lessons.length +
    data.attention.overdue.length +
    data.attention.urgent.length +
    data.attention.homeworks.length;
  const continueLesson = data.continue;

  return (
    <div className="space-y-4">
      <header>
        <p className="font-[var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-slate-500">
          {todayLabel()}
        </p>
        <h1 className="mt-2 font-[var(--font-display)] text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {greeting()}.
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {needsAttention > 0
            ? `${needsAttention} ${plural(needsAttention, "item")} ${needsAttention === 1 ? "needs" : "need"} your attention.`
            : "You are up to date. Keep the momentum going."}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Lessons"
          value={data.totals.lessons}
          hint={`${data.totals.subtitles} subtitles in total`}
          tone="bg-indigo-50 text-indigo-600"
          icon={<BookOpen className="size-4" />}
        />
        <StatCard
          label="Understood"
          value={understood}
          hint={`${percent(understood, data.totals.subtitles)}% of all subtitles`}
          tone="bg-emerald-50 text-emerald-600"
          icon={<CheckCircle2 className="size-4" />}
        />
        <StatCard
          label="Needs review"
          value={data.totals.confusing + data.totals.has_questions}
          hint={`${data.totals.confusing} confusing · ${data.totals.has_questions} with questions`}
          tone="bg-amber-50 text-amber-600"
          icon={<Flame className="size-4" />}
        />
        <StatCard
          label="Open questions"
          value={pendingQuestions}
          hint={`${data.questions.by_status.pending} pending · ${data.questions.by_status.asked} asked`}
          tone="bg-rose-50 text-rose-600"
          icon={<CircleHelp className="size-4" />}
        />
      </div>

      <Card>
        <CardHeader
          title="Needs attention"
          description="Lessons and questions that could slow you down."
          action={
            needsAttention > 0 ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onNavigate("questions")}
              >
                Review questions
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Button>
            ) : undefined
          }
        />
        {needsAttention === 0 ? (
          <EmptyState
            icon={<Sparkles className="size-5" />}
            title="Nothing needs attention"
            description="Confusing lessons and overdue questions will appear here."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {data.attention.lessons.length > 0 ? (
              <div className="px-4 py-3.5 sm:px-5">
                <p className="mb-2 flex items-center gap-1.5 font-[var(--font-mono)] text-[10px] uppercase tracking-[0.12em] text-slate-500">
                  <Flame className="size-3.5 text-amber-500" aria-hidden="true" />
                  Lessons to revisit
                </p>
                <ul className="space-y-1">
                  {data.attention.lessons.map((lesson) => (
                    <li key={lesson.id}>
                      <button
                        type="button"
                        onClick={() => onNavigate("lessons", { subjectId: lesson.subject_id })}
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-slate-800">
                            {lesson.title}
                          </span>
                          <span className="block truncate text-[11px] text-slate-500">
                            {lesson.subject_name} · Chapter {lesson.chapter_number} ·{" "}
                            {lesson.confusing + lesson.has_questions}{" "}
                            {plural(lesson.confusing + lesson.has_questions, "subtitle")} to review
                          </span>
                        </span>
                        <StatusPill status={lesson.status} className="shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {data.attention.overdue.length > 0 ? (
              <div className="px-4 py-3.5 sm:px-5">
                <p className="mb-2 flex items-center gap-1.5 font-[var(--font-mono)] text-[10px] uppercase tracking-[0.12em] text-slate-500">
                  <Clock className="size-3.5 text-sky-500" aria-hidden="true" />
                  Waiting more than 7 days
                </p>
                <ul className="space-y-1">
                  {data.attention.overdue.map((question) => (
                    <li key={question.id}>
                      <button
                        type="button"
                        onClick={() => onNavigate("questions", { questionStatus: "asked" })}
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-slate-800">
                            {question.title}
                          </span>
                          <span className="block truncate text-[11px] text-slate-500">
                            {question.subject_name}
                            {question.teacher ? ` · ${question.teacher}` : ""} · asked{" "}
                            {formatDate(question.asked_at)}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                          {question.days_waiting}d
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {data.attention.urgent.length > 0 ? (
              <div className="px-4 py-3.5 sm:px-5">
                <p className="mb-2 flex items-center gap-1.5 font-[var(--font-mono)] text-[10px] uppercase tracking-[0.12em] text-slate-500">
                  <Flame className="size-3.5 text-rose-500" aria-hidden="true" />
                  Urgent questions
                </p>
                <ul className="space-y-1">
                  {data.attention.urgent.map((question) => (
                    <li key={question.id}>
                      <button
                        type="button"
                        onClick={() => onNavigate("questions", { priority: "urgent" })}
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-slate-800">
                            {question.title}
                          </span>
                          <span className="block truncate text-[11px] text-slate-500">
                            {question.subject_name} · {question.status}
                          </span>
                        </span>
                        <ArrowRight className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Homework deadlines"
          description="Overdue and upcoming homework, soonest first."
          action={
            <Button variant="secondary" size="sm" onClick={() => onNavigate("homeworks")}>
              All homeworks
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Button>
          }
        />
        {data.attention.homeworks.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="size-5" />}
            title="No homework deadlines"
            description="Overdue and upcoming homework will appear here."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.attention.homeworks.map((homework) => (
              <li key={homework.id}>
                <button
                  type="button"
                  onClick={() => onNavigate("homeworks")}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:px-5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-800">
                      {homework.title}
                    </span>
                    <span className="block truncate text-[11px] text-slate-500">
                      {homework.subject_name} · {formatDueDate(homework.due_on)}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      homework.days_left < 0
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    {homework.days_left < 0
                      ? `${Math.abs(homework.days_left)}d late`
                      : homework.days_left === 0
                        ? "Today"
                        : `${homework.days_left}d`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Questions by status" description="Where your questions stand." />
          <div className="space-y-3 px-4 py-4 sm:px-5">
            {(["pending", "asked", "answered", "archived"] as QuestionStatus[]).map((status) => {
              const count = data.questions.by_status[status];
              const share = percent(count, data.questions.total);
              return (
                <div key={status}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium capitalize text-slate-700">{status}</span>
                    <span className="text-slate-500">
                      {count} · {share}%
                    </span>
                  </div>
                  <ProgressBar
                    value={share}
                    tone={status === "answered" ? "emerald" : status === "asked" ? "indigo" : "amber"}
                    label={`${status} questions`}
                  />
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Continue studying" description="Pick up where you left off." />
          {continueLesson ? (
            <div className="px-4 py-4 sm:px-5">
              <p className="text-sm font-medium text-slate-800">{continueLesson.title}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {continueLesson.subject_name} · Chapter {continueLesson.chapter_number} ·{" "}
                {continueLesson.understood}/{continueLesson.total} understood
              </p>
              <div className="mt-3 flex items-center gap-3">
                <ProgressBar
                  value={percent(continueLesson.understood, continueLesson.total)}
                  className="flex-1"
                  label="Lesson progress"
                />
                <Button
                  size="sm"
                  onClick={() => onNavigate("lessons", { subjectId: continueLesson.subject_id })}
                >
                  Open lessons
                </Button>
              </div>
              <div className="mt-3">
                <StatusPill status={continueLesson.status} />
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<CheckCircle2 className="size-5" />}
              title="Everything is studied"
              description="Every lesson has been reviewed."
            />
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Subject organization"
          description="Progress and open questions per subject."
          action={
            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
              <Layers className="size-3.5" aria-hidden="true" />
              {data.subjects.length} subjects
            </span>
          }
        />
        <ul className="divide-y divide-slate-100">
          {data.subjects.map((subject) => (
            <li key={subject.id} className="px-4 py-3.5 sm:px-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {subjectShortName(subject)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {subject.lessons} lessons · {subject.questions} questions ·{" "}
                    {subject.unresolved} unresolved
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-700">{subject.progress}%</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate("lessons", { subjectId: subject.id })}
                  >
                    Open
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </div>
              <ProgressBar
                value={subject.progress}
                className="mt-2"
                tone={subject.progress >= 70 ? "emerald" : subject.progress >= 40 ? "indigo" : "amber"}
                label={`${subject.name} progress`}
              />
            </li>
          ))}
        </ul>
      </Card>

      {error ? (
        <Alert tone="warning">
          The dashboard could not be refreshed.{" "}
          <button
            type="button"
            onClick={reload}
            className="font-semibold underline underline-offset-2"
          >
            Try again
          </button>
        </Alert>
      ) : null}
    </div>
  );
}