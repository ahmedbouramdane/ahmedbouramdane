"use client";

import { BookOpen, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  StudyApiError,
  studyGet,
  studyMutate,
  type Lesson,
  type LessonList as LessonListData,
  type Subtitle,
  type SubtitleStatus,
} from "../lib/api";
import { percent } from "../lib/format";
import { LessonList, filterLessons } from "../components/lesson-list";
import { SubjectChips } from "../components/subject-chips";
import { SUBTITLE_STATUS_META, SUBTITLE_STATUS_ORDER } from "../components/status";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Input,
  ProgressBar,
  Select,
  Skeleton,
} from "../components/ui";

export function LessonsTab({ initialSubjectId }: { initialSubjectId?: number }) {
  const [data, setData] = useState<LessonListData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const [subjectId, setSubjectId] = useState<number | null>(initialSubjectId ?? null);
  const [status, setStatus] = useState<SubtitleStatus | "all">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    studyGet<LessonListData>("/lessons")
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(
          caught instanceof StudyApiError
            ? caught.detail
            : "The lessons could not be loaded.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const subjects = useMemo(() => data?.subjects ?? [], [data]);
  const lessons = useMemo(() => data?.items ?? [], [data]);

  const filtered = useMemo(
    () => filterLessons(lessons, subjectId, status, query),
    [lessons, subjectId, status, query],
  );

  const totals = useMemo(() => {
    let understood = 0;
    let subtitles = 0;
    for (const subject of subjects) {
      understood += subject.understood;
      subtitles += subject.subtitles;
    }
    return { understood, subtitles };
  }, [subjects]);

  function replaceLesson(updated: Lesson) {
    setData((current) =>
      current
        ? {
            ...current,
            items: current.items.map((lesson) => (lesson.id === updated.id ? updated : lesson)),
          }
        : current,
    );
  }

  async function updateSubtitleStatus(
    lessonId: number,
    subtitle: Subtitle,
    nextStatus: SubtitleStatus,
  ) {
    const previous = subtitle;
    setData((current) =>
      current
        ? {
            ...current,
            items: current.items.map((lesson) =>
              lesson.id === lessonId
                ? {
                    ...lesson,
                    subtitles: lesson.subtitles.map((item) =>
                      item.id === subtitle.id
                        ? {
                            ...item,
                            status: nextStatus,
                            last_reviewed_at: new Date().toISOString(),
                          }
                        : item,
                    ),
                  }
                : lesson,
            ),
          }
        : current,
    );

    try {
      const result = await studyMutate<{ subtitle: Subtitle; lesson: Lesson }>(
        `/subtitles/${subtitle.id}`,
        "PATCH",
        { status: nextStatus },
      );
      replaceLesson(result.lesson);
      toast.success("Status updated");
    } catch (caught) {
      setData((current) =>
        current
          ? {
              ...current,
              items: current.items.map((lesson) =>
                lesson.id === lessonId
                  ? {
                      ...lesson,
                      subtitles: lesson.subtitles.map((item) =>
                        item.id === subtitle.id ? previous : item,
                      ),
                    }
                  : lesson,
              ),
            }
          : current,
      );
      toast.error(
        caught instanceof StudyApiError ? caught.detail : "The status could not be saved.",
      );
    }
  }

  async function updateSubtitleNote(lessonId: number, subtitle: Subtitle, note: string) {
    const previous = subtitle;
    setData((current) =>
      current
        ? {
            ...current,
            items: current.items.map((lesson) =>
              lesson.id === lessonId
                ? {
                    ...lesson,
                    subtitles: lesson.subtitles.map((item) =>
                      item.id === subtitle.id ? { ...item, note } : item,
                    ),
                  }
                : lesson,
            ),
          }
        : current,
    );

    try {
      const result = await studyMutate<{ subtitle: Subtitle; lesson: Lesson }>(
        `/subtitles/${subtitle.id}`,
        "PATCH",
        { note },
      );
      replaceLesson(result.lesson);
      toast.success("Note saved");
    } catch (caught) {
      setData((current) =>
        current
          ? {
              ...current,
              items: current.items.map((lesson) =>
                lesson.id === lessonId
                  ? {
                      ...lesson,
                      subtitles: lesson.subtitles.map((item) =>
                        item.id === subtitle.id ? previous : item,
                      ),
                    }
                  : lesson,
              ),
            }
        : current,
      );
      toast.error(
        caught instanceof StudyApiError ? caught.detail : "The note could not be saved.",
      );
      throw caught;
    }
  }

  async function updateLessonOverride(lesson: Lesson, override: SubtitleStatus | null) {
    setData((current) =>
      current
        ? {
            ...current,
            items: current.items.map((item) =>
              item.id === lesson.id ? { ...item, status_override: override } : item,
            ),
          }
        : current,
    );

    try {
      const result = await studyMutate<Lesson>(`/lessons/${lesson.id}`, "PATCH", {
        status_override: override,
      });
      replaceLesson(result);
      toast.success("Lesson status updated");
    } catch (caught) {
      setData((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === lesson.id
                  ? { ...item, status_override: lesson.status_override }
                  : item,
              ),
            }
          : current,
      );
      toast.error(
        caught instanceof StudyApiError ? caught.detail : "The lesson could not be updated.",
      );
    }
  }

  async function updateLessonNote(lesson: Lesson, note: string) {
    setData((current) =>
      current
        ? {
            ...current,
            items: current.items.map((item) =>
              item.id === lesson.id ? { ...item, note } : item,
            ),
          }
        : current,
    );

    try {
      const result = await studyMutate<Lesson>(`/lessons/${lesson.id}`, "PATCH", { note });
      replaceLesson(result);
      toast.success("Lesson note saved");
    } catch (caught) {
      setData((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === lesson.id ? { ...item, note: lesson.note } : item,
              ),
            }
          : current,
      );
      toast.error(
        caught instanceof StudyApiError ? caught.detail : "The note could not be saved.",
      );
      throw caught;
    }
  }

  function clearFilters() {
    setSubjectId(null);
    setStatus("all");
    setQuery("");
  }

  function reload() {
    setLoading(true);
    setError(null);
    setReloadKey((key) => key + 1);
  }

  if (loading && !data) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <Card>
        <EmptyState
          icon={<BookOpen className="size-5" />}
          title="The lessons could not be loaded"
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

  const progress = percent(totals.understood, totals.subtitles);
  const hasFilters = subjectId !== null || status !== "all" || query.trim().length > 0;

  return (
    <div className="space-y-4">
      <header>
        <p className="font-[var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-slate-500">
          Lessons
        </p>
        <h1 className="mt-2 font-[var(--font-display)] text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Curriculum
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Mark every subtitle as you study, and keep a note for anything you want to revisit.
        </p>
      </header>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="font-medium text-slate-700">
            {totals.understood}/{totals.subtitles} subtitles understood
          </span>
          <span className="text-slate-500">{progress}%</span>
        </div>
        <ProgressBar
          value={progress}
          className="mt-2"
          tone={progress >= 70 ? "emerald" : progress >= 40 ? "indigo" : "amber"}
          label="Overall curriculum progress"
        />
      </Card>

      <Card className="p-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search lessons or subtitles…"
              aria-label="Search lessons"
              className="pl-9 pr-9"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as SubtitleStatus | "all")}
            aria-label="Filter lessons by status"
            className="sm:w-48"
          >
            <option value="all">All statuses</option>
            {SUBTITLE_STATUS_ORDER.map((value) => (
              <option key={value} value={value}>
                {SUBTITLE_STATUS_META[value].label}
              </option>
            ))}
          </Select>
        </div>
        <div className="mt-3">
          <SubjectChips subjects={subjects} activeSubjectId={subjectId} onSelect={setSubjectId} />
        </div>
      </Card>

      {error ? <Alert tone="warning">{error}</Alert> : null}

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BookOpen className="size-5" />}
            title="No lessons match"
            description="Try another subject, status, or search term."
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <LessonList
          lessons={filtered}
          subjects={subjects}
          onSubtitleStatusChange={updateSubtitleStatus}
          onSubtitleNoteSave={updateSubtitleNote}
          onLessonOverrideChange={updateLessonOverride}
          onLessonNoteSave={updateLessonNote}
        />
      )}
    </div>
  );
}