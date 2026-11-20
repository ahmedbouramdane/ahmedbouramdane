"use client";

import { Eye, EyeOff } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  StudyApiError,
  studyGet,
  studyMutate,
  type Lesson,
  type LessonList,
  type Question,
  type QuestionDraft,
  type QuestionPriority,
  type QuestionStatus,
  type SubjectSummary,
} from "../lib/api";
import {
  PRIORITY_META,
  PRIORITY_ORDER,
  QUESTION_STATUS_META,
  QUESTION_STATUS_ORDER,
} from "./status";
import { Markdown } from "./markdown";
import { Alert, Button, Field, Input, Select, StudyDialog, Textarea } from "./ui";

function parseId(value: string) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function emptyDraft(subjectId: number, status: QuestionStatus): QuestionDraft {
  return {
    title: "",
    body: "",
    subject_id: subjectId,
    lesson_id: null,
    subtitle_id: null,
    teacher: "",
    priority: "normal",
    status,
    response: "",
    personal_note: "",
  };
}

type QuestionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: Question | null;
  initialStatus?: QuestionStatus;
  subjects: SubjectSummary[];
  teachers: string[];
  onSaved: (question: Question) => void;
};

export function QuestionDialog({ open, ...props }: QuestionDialogProps) {
  if (!open) return null;
  return <QuestionForm {...props} />;
}

function QuestionForm({
  onOpenChange,
  question,
  initialStatus,
  subjects,
  teachers,
  onSaved,
}: Omit<QuestionDialogProps, "open">) {
  const [draft, setDraft] = useState<QuestionDraft>(() =>
    question
      ? {
          title: question.title,
          body: question.body,
          subject_id: question.subject_id,
          lesson_id: question.lesson_id,
          subtitle_id: question.subtitle_id,
          teacher: question.teacher,
          priority: question.priority,
          status: initialStatus ?? question.status,
          response: question.response,
          personal_note: question.personal_note,
        }
      : emptyDraft(subjects[0]?.id ?? 0, initialStatus ?? "pending"),
  );
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewBody, setPreviewBody] = useState(false);
  const [previewResponse, setPreviewResponse] = useState(false);

  useEffect(() => {
    let cancelled = false;
    studyGet<LessonList>("/lessons")
      .then((result) => {
        if (!cancelled) setLessons(result.items);
      })
      .catch(() => {
        if (!cancelled) setLessons([]);
      })
      .finally(() => {
        if (!cancelled) setLessonsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const subjectLessons = useMemo(
    () => lessons.filter((lesson) => lesson.subject_id === draft.subject_id),
    [lessons, draft.subject_id],
  );
  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === draft.lesson_id) ?? null,
    [lessons, draft.lesson_id],
  );

  function update<K extends keyof QuestionDraft>(key: K, value: QuestionDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function handleSubjectChange(value: string) {
    setDraft((current) => ({
      ...current,
      subject_id: parseId(value) ?? 0,
      lesson_id: null,
      subtitle_id: null,
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next.subject_id;
      delete next.lesson_id;
      delete next.subtitle_id;
      return next;
    });
  }

  function handleLessonChange(value: string) {
    setDraft((current) => ({
      ...current,
      lesson_id: parseId(value),
      subtitle_id: null,
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next.lesson_id;
      delete next.subtitle_id;
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const nextErrors: Record<string, string> = {};
    if (!draft.title.trim()) nextErrors.title = "Add a short title.";
    if (!draft.body.trim()) nextErrors.body = "Describe the question.";
    if (!draft.subject_id) nextErrors.subject_id = "Choose a subject.";
    if (draft.status === "answered" && !draft.response.trim()) {
      nextErrors.response = "Add the teacher's response before marking it answered.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        ...draft,
        title: draft.title.trim(),
        body: draft.body.trim(),
        teacher: draft.teacher.trim(),
        response: draft.response.trim(),
        personal_note: draft.personal_note.trim(),
      };
      const result = question
        ? await studyMutate<Question>(`/questions/${question.id}`, "PATCH", payload)
        : await studyMutate<Question>("/questions", "POST", payload);
      toast.success(question ? "Question updated" : "Question added");
      onSaved(result);
      onOpenChange(false);
    } catch (caught) {
      setFormError(
        caught instanceof StudyApiError
          ? caught.detail
          : "The question could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <StudyDialog
      open
      onOpenChange={onOpenChange}
      title={question ? "Edit question" : "New question"}
      description={
        question
          ? "Update the details, status, or the teacher's response."
          : "Capture what you want to ask your teacher."
      }
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="study-question-form" loading={saving}>
            {question ? "Save changes" : "Add question"}
          </Button>
        </div>
      }
    >
      <form id="study-question-form" onSubmit={handleSubmit} className="space-y-3.5">
        {formError ? <Alert>{formError}</Alert> : null}

        <Field label="Title" htmlFor="study-question-title" error={errors.title}>
          <Input
            id="study-question-title"
            value={draft.title}
            maxLength={200}
            onChange={(event) => update("title", event.target.value)}
            placeholder="e.g. Why does the integral diverge here?"
          />
        </Field>

        <Field label="Question" htmlFor="study-question-body" error={errors.body}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-slate-500">
              Markdown + LaTeX: <span className="font-medium">**bold**</span>, lists,{" "}
              <span className="font-medium"># headings</span>, <span className="font-medium">$x^2$</span>.
            </p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPreviewBody((value) => !value)}
            >
              {previewBody ? (
                <EyeOff className="size-3.5" aria-hidden="true" />
              ) : (
                <Eye className="size-3.5" aria-hidden="true" />
              )}
              {previewBody ? "Hide preview" : "Preview"}
            </Button>
          </div>
          <Textarea
            id="study-question-body"
            value={draft.body}
            maxLength={20000}
            rows={4}
            onChange={(event) => update("body", event.target.value)}
            placeholder="Write the question and what you already tried… Markdown works here: **bold**, - lists, # headings. Use $…$ for LaTeX, e.g. $\int_0^1 x^2\,dx$."
          />
          {previewBody ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              {draft.body.trim() ? (
                <Markdown className="text-xs leading-relaxed text-slate-700">
                  {draft.body}
                </Markdown>
              ) : (
                <p className="text-xs text-slate-400">Nothing to preview yet.</p>
              )}
            </div>
          ) : null}
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Subject" htmlFor="study-question-subject" error={errors.subject_id}>
            <Select
              id="study-question-subject"
              value={draft.subject_id || ""}
              onChange={(event) => handleSubjectChange(event.target.value)}
            >
              <option value="" disabled>
                Choose a subject
              </option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Priority" htmlFor="study-question-priority">
            <Select
              id="study-question-priority"
              value={draft.priority}
              onChange={(event) => update("priority", event.target.value as QuestionPriority)}
            >
              {PRIORITY_ORDER.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_META[priority].label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Lesson"
            htmlFor="study-question-lesson"
            error={errors.lesson_id}
            hint={lessonsLoading ? "Loading lessons…" : undefined}
          >
            <Select
              id="study-question-lesson"
              value={draft.lesson_id ?? ""}
              disabled={lessonsLoading || subjectLessons.length === 0}
              onChange={(event) => handleLessonChange(event.target.value)}
            >
              <option value="">No lesson</option>
              {subjectLessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  Ch. {lesson.chapter_number} · {lesson.title}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Status" htmlFor="study-question-status">
            <Select
              id="study-question-status"
              value={draft.status}
              onChange={(event) => update("status", event.target.value as QuestionStatus)}
            >
              {QUESTION_STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {QUESTION_STATUS_META[status].label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label="Subtitle"
          htmlFor="study-question-subtitle"
          error={errors.subtitle_id}
          hint={selectedLesson ? undefined : "Pick a lesson first to link a subtitle."}
        >
          <Select
            id="study-question-subtitle"
            value={draft.subtitle_id ?? ""}
            disabled={!selectedLesson}
            onChange={(event) => update("subtitle_id", parseId(event.target.value))}
          >
            <option value="">No subtitle</option>
            {selectedLesson?.subtitles.map((subtitle) => (
              <option key={subtitle.id} value={subtitle.id}>
                {subtitle.title}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Teacher" htmlFor="study-question-teacher" hint="Optional">
          <Input
            id="study-question-teacher"
            value={draft.teacher}
            maxLength={120}
            list="study-teacher-options"
            onChange={(event) => update("teacher", event.target.value)}
            placeholder="e.g. Mr. Bennani"
          />
          <datalist id="study-teacher-options">
            {teachers.map((teacher) => (
              <option key={teacher} value={teacher} />
            ))}
          </datalist>
        </Field>

        <Field
          label="Teacher response"
          htmlFor="study-question-response"
          error={errors.response}
          hint="Required when the status is Answered."
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-slate-500">Markdown and LaTeX are rendered in the preview.</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPreviewResponse((value) => !value)}
            >
              {previewResponse ? (
                <EyeOff className="size-3.5" aria-hidden="true" />
              ) : (
                <Eye className="size-3.5" aria-hidden="true" />
              )}
              {previewResponse ? "Hide preview" : "Preview"}
            </Button>
          </div>
          <Textarea
            id="study-question-response"
            value={draft.response}
            maxLength={20000}
            rows={3}
            onChange={(event) => update("response", event.target.value)}
            placeholder="Paste or write the teacher's answer… You can use $\pi$, $\gamma$, $\frac{a}{b}$…"
          />
          {previewResponse ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              {draft.response.trim() ? (
                <Markdown className="text-xs leading-relaxed text-slate-700">
                  {draft.response}
                </Markdown>
              ) : (
                <p className="text-xs text-slate-400">Nothing to preview yet.</p>
              )}
            </div>
          ) : null}
        </Field>

        <Field label="Personal note" htmlFor="study-question-note" hint="Optional">
          <Textarea
            id="study-question-note"
            value={draft.personal_note}
            maxLength={5000}
            rows={2}
            onChange={(event) => update("personal_note", event.target.value)}
            placeholder="What you understood from the answer…"
          />
        </Field>
      </form>
    </StudyDialog>
  );
}