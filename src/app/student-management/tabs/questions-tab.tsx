"use client";

import { MessageCircleQuestion, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  StudyApiError,
  studyGet,
  studyMutate,
  type Question,
  type QuestionPage,
  type QuestionPriority,
  type QuestionStatus,
  type RemindersData,
  type SubjectList,
  type SubjectSummary,
} from "../lib/api";
import { matchesSearch } from "../lib/format";
import { QuestionRow } from "../components/question-card";
import { QuestionDetailDialog } from "../components/question-detail-dialog";
import { QuestionDialog } from "../components/question-dialog";
import { PRIORITY_META, PRIORITY_ORDER, QUESTION_STATUS_META, QUESTION_STATUS_ORDER } from "../components/status";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Input,
  Select,
  Skeleton,
} from "../components/ui";

type StatusFilter = QuestionStatus | "all";

export function QuestionsTab({
  initialStatus,
  initialPriority,
}: {
  initialStatus?: QuestionStatus;
  initialPriority?: QuestionPriority;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [reminders, setReminders] = useState<RemindersData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const [status, setStatus] = useState<StatusFilter>(initialStatus ?? "all");
  const [priority, setPriority] = useState<QuestionPriority | "all">(initialPriority ?? "all");
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [teacher, setTeacher] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [editStatus, setEditStatus] = useState<QuestionStatus | undefined>(undefined);
  const [selected, setSelected] = useState<Question | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      studyGet<QuestionPage>("/questions?limit=1000"),
      studyGet<RemindersData>("/reminders"),
      studyGet<SubjectList>("/subjects"),
    ])
      .then(([page, reminderData, subjectData]) => {
        if (cancelled) return;
        setQuestions(page.items);
        setReminders(reminderData);
        setSubjects(subjectData.items);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(
          caught instanceof StudyApiError
            ? caught.detail
            : "The questions could not be loaded.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const teachers = useMemo(() => {
    const names = new Set<string>();
    for (const question of questions) {
      if (question.teacher.trim()) names.add(question.teacher.trim());
    }
    return [...names].sort((left, right) => left.localeCompare(right));
  }, [questions]);

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = {
      all: 0,
      pending: 0,
      asked: 0,
      answered: 0,
      archived: 0,
    };
    for (const question of questions) {
      result[question.status] += 1;
      if (question.status !== "archived") result.all += 1;
    }
    return result;
  }, [questions]);

  const filtered = useMemo(
    () =>
      questions.filter((question) => {
        if (status === "all") {
          if (question.status === "archived") return false;
        } else if (question.status !== status) {
          return false;
        }
        if (priority !== "all" && question.priority !== priority) return false;
        if (subjectId !== null && question.subject_id !== subjectId) return false;
        if (teacher.trim() && !matchesSearch(question.teacher, teacher)) return false;
        if (
          query.trim() &&
          !matchesSearch(
            [
              question.title,
              question.body,
              question.response,
              question.personal_note,
              question.teacher,
            ].join(" "),
            query,
          )
        ) {
          return false;
        }
        return true;
      }),
    [questions, status, priority, subjectId, teacher, query],
  );

  const hasFilters =
    status !== "all" ||
    priority !== "all" ||
    subjectId !== null ||
    teacher.trim().length > 0 ||
    query.trim().length > 0;

  function openCreate() {
    setEditing(null);
    setEditStatus(undefined);
    setDialogOpen(true);
  }

  function openEdit(question: Question, nextStatus?: QuestionStatus) {
    setSelected(null);
    setEditing(question);
    setEditStatus(nextStatus);
    setDialogOpen(true);
  }

  async function refreshReminders() {
    try {
      setReminders(await studyGet<RemindersData>("/reminders"));
    } catch {
      // Reminders are a nice-to-have; keep the last known values.
    }
  }

  function handleSaved(saved: Question) {
    setQuestions((current) => {
      const exists = current.some((question) => question.id === saved.id);
      return exists
        ? current.map((question) => (question.id === saved.id ? saved : question))
        : [saved, ...current];
    });
    void refreshReminders();
  }

  async function changeStatus(question: Question, nextStatus: QuestionStatus) {
    if (nextStatus === "answered" && !question.response.trim()) {
      toast.info("Add the teacher's response first.");
      openEdit(question, "answered");
      return;
    }
    try {
      const updated = await studyMutate<Question>(`/questions/${question.id}`, "PATCH", {
        status: nextStatus,
      });
      setQuestions((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setSelected((current) =>
        current && current.id === updated.id ? updated : current,
      );
      toast.success(
        nextStatus === "asked"
          ? "Marked as asked"
          : nextStatus === "archived"
            ? "Question archived"
            : "Question restored",
      );
      void refreshReminders();
    } catch (caught) {
      toast.error(
        caught instanceof StudyApiError ? caught.detail : "The question could not be updated.",
      );
    }
  }

  async function deleteQuestion(question: Question) {
    try {
      await studyMutate(`/questions/${question.id}`, "DELETE");
      setQuestions((current) => current.filter((item) => item.id !== question.id));
      setSelected((current) => (current && current.id === question.id ? null : current));
      toast.success("Question deleted");
      void refreshReminders();
    } catch (caught) {
      toast.error(
        caught instanceof StudyApiError ? caught.detail : "The question could not be deleted.",
      );
    }
  }

  function clearFilters() {
    setStatus("all");
    setPriority("all");
    setSubjectId(null);
    setTeacher("");
    setQuery("");
  }

  function reload() {
    setLoading(true);
    setError(null);
    setReloadKey((key) => key + 1);
  }

  if (loading && questions.length === 0) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-12 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<MessageCircleQuestion className="size-5" />}
          title="The questions could not be loaded"
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

  const chips: { id: StatusFilter; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    ...QUESTION_STATUS_ORDER.map((value) => ({
      id: value,
      label: QUESTION_STATUS_META[value].label,
      count: counts[value],
    })),
  ];

  const reminderCount = (reminders?.overdue_count ?? 0) + (reminders?.urgent_count ?? 0);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-[var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-slate-500">
            Questions
          </p>
          <h1 className="mt-2 font-[var(--font-display)] text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Questions for teachers
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {filtered.length} shown · {questions.length} total
          </p>
        </div>
        <Button onClick={openCreate} className="hidden lg:inline-flex">
          <Plus className="size-4" aria-hidden="true" />
          New question
        </Button>
      </header>

      {reminderCount > 0 ? (
        <Alert tone="warning" className="flex flex-wrap items-center justify-between gap-2">
          <span>
            {reminders?.overdue_count ?? 0} overdue · {reminders?.urgent_count ?? 0} urgent
          </span>
          <button
            type="button"
            onClick={() => {
              setStatus("asked");
              setPriority("all");
            }}
            className="font-semibold underline underline-offset-2"
          >
            Show asked questions
          </button>
        </Alert>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map((chip) => {
          const active = status === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              aria-pressed={active}
              onClick={() => setStatus(chip.id)}
              className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                active
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              {chip.label}
              <span className={active ? "text-[10px] text-indigo-100" : "text-[10px] text-slate-400"}>
                {chip.count}
              </span>
            </button>
          );
        })}
      </div>

      <Card className="p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search questions…"
              aria-label="Search questions"
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
            value={subjectId ?? ""}
            onChange={(event) =>
              setSubjectId(event.target.value ? Number(event.target.value) : null)
            }
            aria-label="Filter by subject"
          >
            <option value="">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </Select>

          <Select
            value={priority}
            onChange={(event) => setPriority(event.target.value as QuestionPriority | "all")}
            aria-label="Filter by priority"
          >
            <option value="all">All priorities</option>
            {PRIORITY_ORDER.map((value) => (
              <option key={value} value={value}>
                {PRIORITY_META[value].label}
              </option>
            ))}
          </Select>

          <div className="flex gap-2">
            <Input
              value={teacher}
              onChange={(event) => setTeacher(event.target.value)}
              placeholder="Teacher…"
              aria-label="Filter by teacher"
              list="study-teacher-filter"
            />
            <datalist id="study-teacher-filter">
              {teachers.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
        </div>

        {hasFilters ? (
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
              <SlidersHorizontal className="size-3.5" aria-hidden="true" />
              Filters applied
            </span>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          </div>
        ) : null}
      </Card>

      {error ? <Alert tone="warning">{error}</Alert> : null}

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<MessageCircleQuestion className="size-5" />}
            title="No questions here"
            description={
              hasFilters
                ? "Try clearing the filters or searching for something else."
                : "Capture your first question for a teacher."
            }
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button onClick={openCreate}>
                  <Plus className="size-4" aria-hidden="true" />
                  New question
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {filtered.map((question) => (
            <QuestionRow key={question.id} question={question} onOpen={setSelected} />
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={openCreate}
        aria-label="New question"
        className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-40 grid size-14 place-items-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 lg:hidden"
      >
        <Plus className="size-6" aria-hidden="true" />
      </button>

      {selected ? (
        <QuestionDetailDialog
          question={selected}
          onClose={() => setSelected(null)}
          onEdit={openEdit}
          onStatusChange={(item, nextStatus) => void changeStatus(item, nextStatus)}
          onDelete={(item) => void deleteQuestion(item)}
        />
      ) : null}

      <QuestionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        question={editing}
        initialStatus={editStatus}
        subjects={subjects}
        teachers={teachers}
        onSaved={handleSaved}
      />
    </div>
  );
}