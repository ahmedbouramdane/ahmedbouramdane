"use client";

import { ChevronDown, StickyNote } from "lucide-react";
import { useState } from "react";
import type { Lesson, SubjectSummary, Subtitle, SubtitleStatus } from "../lib/api";
import { formatDate, matchesSearch, percent } from "../lib/format";
import {
  SUBTITLE_STATUS_META,
  SUBTITLE_STATUS_ORDER,
  StatusPill,
} from "./status";
import { subjectShortName } from "./subject-chips";
import { NoteEditor } from "./note-editor";
import { Field, ProgressBar, Select } from "./ui";

export type LessonListProps = {
  lessons: Lesson[];
  subjects: SubjectSummary[];
  onSubtitleStatusChange: (
    lessonId: number,
    subtitle: Subtitle,
    status: SubtitleStatus,
  ) => Promise<void>;
  onSubtitleNoteSave: (lessonId: number, subtitle: Subtitle, note: string) => Promise<void>;
  onLessonOverrideChange: (lesson: Lesson, override: SubtitleStatus | null) => Promise<void>;
  onLessonNoteSave: (lesson: Lesson, note: string) => Promise<void>;
};

function CollapsedNote({
  hasNote,
  label,
  emptyLabel,
  ariaLabel,
  onExpand,
}: {
  hasNote: boolean;
  label: string;
  emptyLabel: string;
  ariaLabel: string;
  onExpand: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onExpand}
      aria-expanded={false}
      aria-label={ariaLabel}
      className={`mt-2 flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
        hasNote
          ? "border-amber-200/70 bg-amber-50/40 hover:border-amber-300 hover:bg-amber-50/70"
          : "border-dashed border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <StickyNote
        className={`size-3.5 shrink-0 ${hasNote ? "text-amber-500" : "text-slate-400"}`}
        aria-hidden="true"
      />
      <span
        className={`min-w-0 flex-1 truncate text-[11px] font-medium ${
          hasNote ? "text-slate-700" : "text-slate-500"
        }`}
      >
        {hasNote ? label : emptyLabel}
      </span>
      <ChevronDown className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
    </button>
  );
}

function NoteSectionHeader({ label, onHide }: { label: string; onHide: () => void }) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <span className="inline-flex items-center gap-1 font-[var(--font-mono)] text-[9px] uppercase tracking-[0.12em] text-slate-500">
        <StickyNote className="size-3 text-amber-500" aria-hidden="true" />
        {label}
      </span>
      <button
        type="button"
        onClick={onHide}
        className="rounded px-1 text-[10px] font-medium text-slate-400 transition hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
      >
        Hide
      </button>
    </div>
  );
}

function SubtitleNote({
  subtitle,
  onSave,
}: {
  subtitle: Subtitle;
  onSave: (note: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasNote = Boolean(subtitle.note.trim());

  if (!expanded) {
    return (
      <CollapsedNote
        hasNote={hasNote}
        label="Show my note"
        emptyLabel="Add a note"
        ariaLabel={`Note for ${subtitle.title}`}
        onExpand={() => setExpanded(true)}
      />
    );
  }

  return (
    <div className="mt-2">
      <NoteSectionHeader label="My note" onHide={() => setExpanded(false)} />
      <NoteEditor
        defaultEditing={!subtitle.note.trim()}
        compact
        label={`Note for ${subtitle.title}`}
        value={subtitle.note}
        placeholder="Add a note…"
        onCancel={() => {
          if (!subtitle.note.trim()) setExpanded(false);
        }}
        onSave={onSave}
      />
    </div>
  );
}

function SubtitleRow({
  subtitle,
  onStatusChange,
  onNoteSave,
}: {
  subtitle: Subtitle;
  onStatusChange: (status: SubtitleStatus) => Promise<void>;
  onNoteSave: (note: string) => Promise<void>;
}) {
  const [savingStatus, setSavingStatus] = useState(false);
  const meta = SUBTITLE_STATUS_META[subtitle.status];

  async function handleStatusChange(status: SubtitleStatus) {
    if (status === subtitle.status) return;
    setSavingStatus(true);
    try {
      await onStatusChange(status);
    } finally {
      setSavingStatus(false);
    }
  }

  return (
    <div className="border-b border-slate-100 px-4 py-3 last:border-b-0 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <span
            className={`mt-1.5 size-2 shrink-0 rounded-full ${meta.dot}`}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-sm leading-snug text-slate-800">{subtitle.title}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {subtitle.last_reviewed_at
                ? `Reviewed ${formatDate(subtitle.last_reviewed_at)}`
                : "Not reviewed yet"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusPill status={subtitle.status} className="hidden sm:inline-flex" />
          <Select
            value={subtitle.status}
            disabled={savingStatus}
            aria-label={`Status for ${subtitle.title}`}
            onChange={(event) => void handleStatusChange(event.target.value as SubtitleStatus)}
            className="min-h-9 w-auto py-1 pl-2 pr-7 text-xs"
          >
            {SUBTITLE_STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {SUBTITLE_STATUS_META[status].label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <SubtitleNote subtitle={subtitle} onSave={onNoteSave} />
    </div>
  );
}

function LessonNote({
  lesson,
  onSave,
}: {
  lesson: Lesson;
  onSave: (note: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasNote = Boolean(lesson.note.trim());

  if (!expanded) {
    return (
      <div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <StickyNote className="size-3.5 text-amber-500" aria-hidden="true" />
          Lesson note
        </span>
        <div className="mt-1">
          <CollapsedNote
            hasNote={hasNote}
            label="Show my notes"
            emptyLabel="Add a lesson note"
            ariaLabel={`Note for ${lesson.title}`}
            onExpand={() => setExpanded(true)}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <StickyNote className="size-3.5 text-amber-500" aria-hidden="true" />
          Lesson note
        </span>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="rounded px-1 text-[10px] font-medium text-slate-400 transition hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
        >
          Hide
        </button>
      </div>
      <div className="mt-1.5">
        <NoteEditor
          defaultEditing={!lesson.note.trim()}
          label={`Note for ${lesson.title}`}
          value={lesson.note}
          placeholder="What should you remember about this lesson?"
          onCancel={() => {
            if (!lesson.note.trim()) setExpanded(false);
          }}
          onSave={onSave}
        />
      </div>
    </div>
  );
}

function LessonCard({
  lesson,
  open,
  onToggle,
  onSubtitleStatusChange,
  onSubtitleNoteSave,
  onLessonOverrideChange,
  onLessonNoteSave,
}: {
  lesson: Lesson;
  open: boolean;
  onToggle: () => void;
} & Pick<
  LessonListProps,
  | "onSubtitleStatusChange"
  | "onSubtitleNoteSave"
  | "onLessonOverrideChange"
  | "onLessonNoteSave"
>) {
  const { subtitle_stats: stats } = lesson;
  const progress = percent(stats.understood, stats.total);
  const panelId = `lesson-panel-${lesson.id}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50/70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:px-5"
      >
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 font-[var(--font-mono)] text-[11px] font-semibold text-slate-600">
          {lesson.chapter_number}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">{lesson.title}</span>
            {lesson.attention ? (
              <span
                className="size-1.5 rounded-full bg-amber-500"
                title="Needs attention"
                aria-label="Needs attention"
              />
            ) : null}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
            <StatusPill status={lesson.status} />
            <span>
              {stats.understood}/{stats.total} understood
            </span>
            {lesson.note ? <span className="truncate">· {lesson.note}</span> : null}
          </span>
          <ProgressBar
            value={progress}
            className="mt-2"
            tone={progress >= 70 ? "emerald" : progress >= 40 ? "indigo" : "amber"}
            label={`${lesson.title} progress`}
          />
        </span>
        <ChevronDown
          className={`mt-1 size-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div id={panelId}>
          {lesson.subtitles.length === 0 ? (
            <p className="px-4 py-4 text-xs text-slate-500 sm:px-5">
              This lesson has no subtitles yet.
            </p>
          ) : (
            lesson.subtitles.map((subtitle) => (
              <SubtitleRow
                key={subtitle.id}
                subtitle={subtitle}
                onStatusChange={(status) =>
                  onSubtitleStatusChange(lesson.id, subtitle, status)
                }
                onNoteSave={(note) => onSubtitleNoteSave(lesson.id, subtitle, note)}
              />
            ))
          )}

          <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3.5 sm:px-5">
            <Field
              label="Lesson status"
              htmlFor={`lesson-status-${lesson.id}`}
              hint="Auto follows the subtitles unless you override it."
            >
              <Select
                id={`lesson-status-${lesson.id}`}
                value={lesson.status_override ?? "auto"}
                onChange={(event) =>
                  void onLessonOverrideChange(
                    lesson,
                    event.target.value === "auto"
                      ? null
                      : (event.target.value as SubtitleStatus),
                  )
                }
                className="min-h-10 py-1.5 text-xs"
              >
                <option value="auto">Auto (from subtitles)</option>
                {SUBTITLE_STATUS_ORDER.map((status) => (
                  <option key={status} value={status}>
                    {SUBTITLE_STATUS_META[status].label}
                  </option>
                ))}
              </Select>
            </Field>
            <LessonNote lesson={lesson} onSave={(note) => onLessonNoteSave(lesson, note)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function LessonList({
  lessons,
  subjects,
  onSubtitleStatusChange,
  onSubtitleNoteSave,
  onLessonOverrideChange,
  onLessonNoteSave,
}: LessonListProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  function toggle(lessonId: number) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  }

  const groups = subjects
    .map((subject) => ({
      subject,
      lessons: lessons.filter((lesson) => lesson.subject_id === subject.id),
    }))
    .filter((group) => group.lessons.length > 0);

  const hiddenLessons = lessons.filter(
    (lesson) => !subjects.some((subject) => subject.id === lesson.subject_id),
  );

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.subject.id} aria-label={subjectShortName(group.subject)}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="font-[var(--font-display)] text-sm font-semibold tracking-tight text-slate-800">
              {subjectShortName(group.subject)}
            </h2>
            <span className="text-[11px] text-slate-500">
              {group.lessons.length} {group.lessons.length === 1 ? "lesson" : "lessons"}
            </span>
          </div>
          <div className="space-y-2">
            {group.lessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                open={expanded.has(lesson.id)}
                onToggle={() => toggle(lesson.id)}
                onSubtitleStatusChange={onSubtitleStatusChange}
                onSubtitleNoteSave={onSubtitleNoteSave}
                onLessonOverrideChange={onLessonOverrideChange}
                onLessonNoteSave={onLessonNoteSave}
              />
            ))}
          </div>
        </section>
      ))}

      {hiddenLessons.length > 0 ? (
        <section aria-label="Other lessons">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="font-[var(--font-display)] text-sm font-semibold tracking-tight text-slate-800">
              Other lessons
            </h2>
            <span className="text-[11px] text-slate-500">{hiddenLessons.length}</span>
          </div>
          <div className="space-y-2">
            {hiddenLessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                open={expanded.has(lesson.id)}
                onToggle={() => toggle(lesson.id)}
                onSubtitleStatusChange={onSubtitleStatusChange}
                onSubtitleNoteSave={onSubtitleNoteSave}
                onLessonOverrideChange={onLessonOverrideChange}
                onLessonNoteSave={onLessonNoteSave}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function filterLessons(
  lessons: Lesson[],
  subjectId: number | null,
  status: SubtitleStatus | "all",
  query: string,
) {
  const needle = query.trim();
  return lessons.filter((lesson) => {
    if (subjectId !== null && lesson.subject_id !== subjectId) return false;
    if (status !== "all" && lesson.status !== status) return false;
    if (!needle) return true;
    return matchesSearch(
      [
        lesson.title,
        lesson.note,
        ...lesson.subtitles.map((subtitle) => `${subtitle.title} ${subtitle.note}`),
      ].join(" "),
      needle,
    );
  });
}