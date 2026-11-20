"use client";

import { Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  HOMEWORK_SUBJECTS,
  StudyApiError,
  studyMutate,
  type Homework,
  type HomeworkPriority,
  type HomeworkStatus,
  type HomeworkSubject,
  type Lesson,
  type SubjectSummary,
} from "../lib/api";
import { todayISO } from "../lib/format";
import { subjectShortName } from "./subject-chips";
import {
  HOMEWORK_PRIORITY_META,
  HOMEWORK_PRIORITY_ORDER,
  HOMEWORK_STATUS_META,
  HOMEWORK_STATUS_ORDER,
} from "./status";
import { Alert, Button, Field, Input, Select, StudyDialog, Textarea } from "./ui";

type Draft = {
  title: string;
  subject: HomeworkSubject;
  lesson_id: number | null;
  description: string;
  teacher: string;
  priority: HomeworkPriority;
  status: HomeworkStatus;
  assigned_on: string;
  due_on: string;
  notes: string;
  result: string;
};

function emptyDraft(): Draft {
  return {
    title: "",
    subject: "math",
    lesson_id: null,
    description: "",
    teacher: "",
    priority: "normal",
    status: "not_started",
    assigned_on: todayISO(),
    due_on: "",
    notes: "",
    result: "",
  };
}

type HomeworkDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homework: Homework | null;
  lessons: Lesson[];
  subjects: SubjectSummary[];
  onSaved: (homework: Homework) => void;
  onDeleted: (id: number) => void;
};

export function HomeworkDialog({ open, ...props }: HomeworkDialogProps) {
  if (!open) return null;
  return <HomeworkForm {...props} />;
}

function HomeworkForm({
  onOpenChange,
  homework,
  lessons,
  subjects,
  onSaved,
  onDeleted,
}: Omit<HomeworkDialogProps, "open">) {
  const [draft, setDraft] = useState<Draft>(() =>
    homework
      ? {
          title: homework.title,
          subject: homework.subject,
          lesson_id: homework.lesson_id,
          description: homework.description,
          teacher: homework.teacher,
          priority: homework.priority,
          status: homework.status,
          assigned_on: homework.assigned_on ?? "",
          due_on: homework.due_on ?? "",
          notes: homework.notes,
          result: homework.result,
        }
      : emptyDraft(),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function patchDraft<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError(null);

    const title = draft.title.trim();
    if (!title) {
      setError("Give the homework a title.");
      return;
    }
    if (draft.due_on && draft.assigned_on && draft.due_on < draft.assigned_on) {
      setError("The due date cannot be before the assigned date.");
      return;
    }

    setSaving(true);
    try {
      const body = {
        title,
        subject: draft.subject,
        lesson_id: draft.lesson_id,
        description: draft.description,
        teacher: draft.teacher,
        priority: draft.priority,
        status: draft.status,
        assigned_on: draft.assigned_on || null,
        due_on: draft.due_on || null,
        notes: draft.notes,
        result: draft.result,
      };
      const saved = homework
        ? await studyMutate<Homework>(`/homeworks/${homework.id}`, "PATCH", body)
        : await studyMutate<Homework>("/homeworks", "POST", body);
      onSaved(saved);
      toast.success(homework ? "Homework updated" : "Homework added");
      onOpenChange(false);
    } catch (caught) {
      setError(
        caught instanceof StudyApiError
          ? caught.detail
          : "The homework could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!homework || saving) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await studyMutate(`/homeworks/${homework.id}`, "DELETE");
      onDeleted(homework.id);
      toast.success("Homework deleted");
      onOpenChange(false);
    } catch (caught) {
      setError(
        caught instanceof StudyApiError
          ? caught.detail
          : "The homework could not be deleted.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <StudyDialog
      open
      onOpenChange={onOpenChange}
      title={homework ? "Edit homework" : "New homework"}
      description="Track what is due, how it is going, and the feedback you received."
      wide
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            {homework ? (
              confirmDelete ? (
                <Button
                  variant="danger"
                  size="sm"
                  loading={saving}
                  onClick={() => void handleDelete()}
                >
                  Confirm delete
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                  disabled={saving}
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </Button>
              )
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" form="homework-form" loading={saving}>
              Save homework
            </Button>
          </div>
        </div>
      }
    >
      <form id="homework-form" onSubmit={handleSubmit} className="space-y-4">
        {error ? <Alert>{error}</Alert> : null}

        <Field label="Title" htmlFor="homework-title">
          <Input
            id="homework-title"
            value={draft.title}
            onChange={(event) => patchDraft("title", event.target.value)}
            placeholder="e.g. Limits and continuity exercises"
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Subject" htmlFor="homework-subject">
            <Select
              id="homework-subject"
              value={draft.subject}
              onChange={(event) =>
                patchDraft("subject", event.target.value as HomeworkSubject)
              }
            >
              {HOMEWORK_SUBJECTS.map((subject) => (
                <option key={subject.value} value={subject.value}>
                  {subject.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Lesson" htmlFor="homework-lesson" hint="Optional">
            <Select
              id="homework-lesson"
              value={draft.lesson_id === null ? "" : String(draft.lesson_id)}
              onChange={(event) =>
                patchDraft("lesson_id", event.target.value ? Number(event.target.value) : null)
              }
            >
              <option value="">No lesson</option>
              {subjects.map((subject) => {
                const subjectLessons = lessons.filter(
                  (lesson) => lesson.subject_id === subject.id,
                );
                if (subjectLessons.length === 0) return null;
                return (
                  <optgroup key={subject.id} label={subjectShortName(subject)}>
                    {subjectLessons.map((lesson) => (
                      <option key={lesson.id} value={lesson.id}>
                        {lesson.title}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </Select>
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Assigned date" htmlFor="homework-assigned" hint="Optional">
            <Input
              id="homework-assigned"
              type="date"
              value={draft.assigned_on}
              onChange={(event) => patchDraft("assigned_on", event.target.value)}
            />
          </Field>
          <Field label="Due date" htmlFor="homework-due" hint="Drives the deadline grouping.">
            <Input
              id="homework-due"
              type="date"
              value={draft.due_on}
              onChange={(event) => patchDraft("due_on", event.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Teacher" htmlFor="homework-teacher" hint="Optional">
            <Input
              id="homework-teacher"
              value={draft.teacher}
              onChange={(event) => patchDraft("teacher", event.target.value)}
              placeholder="Who assigned it"
            />
          </Field>
          <Field label="Priority" htmlFor="homework-priority">
            <Select
              id="homework-priority"
              value={draft.priority}
              onChange={(event) =>
                patchDraft("priority", event.target.value as HomeworkPriority)
              }
            >
              {HOMEWORK_PRIORITY_ORDER.map((priority) => (
                <option key={priority} value={priority}>
                  {HOMEWORK_PRIORITY_META[priority].label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Status" htmlFor="homework-status">
            <Select
              id="homework-status"
              value={draft.status}
              onChange={(event) =>
                patchDraft("status", event.target.value as HomeworkStatus)
              }
            >
              {HOMEWORK_STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {HOMEWORK_STATUS_META[status].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Result" htmlFor="homework-result" hint="Grade or feedback (optional)">
            <Input
              id="homework-result"
              value={draft.result}
              onChange={(event) => patchDraft("result", event.target.value)}
              placeholder="e.g. 18/20"
            />
          </Field>
        </div>

        <Field label="Description" htmlFor="homework-description" hint="What you need to do.">
          <Textarea
            id="homework-description"
            rows={4}
            value={draft.description}
            onChange={(event) => patchDraft("description", event.target.value)}
            placeholder="Exercises, pages, instructions…"
          />
        </Field>

        <Field label="Notes" htmlFor="homework-notes" hint="Personal comments (optional).">
          <Textarea
            id="homework-notes"
            rows={3}
            value={draft.notes}
            onChange={(event) => patchDraft("notes", event.target.value)}
            placeholder="What to remember, questions to ask…"
          />
        </Field>
      </form>
    </StudyDialog>
  );
}