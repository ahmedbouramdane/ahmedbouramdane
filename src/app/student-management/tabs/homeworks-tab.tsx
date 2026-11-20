"use client";

import { Bell, BellRing, CalendarClock, ClipboardList, Pencil, Plus, Search, WifiOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  HOMEWORK_SUBJECTS,
  StudyApiError,
  studyGet,
  studyMutate,
  type Homework,
  type HomeworkPage,
  type HomeworkPriority,
  type HomeworkStatus,
  type HomeworkSubject,
  type Lesson,
  type LessonList,
  type SubjectList,
  type SubjectSummary,
} from "../lib/api";
import {
  daysUntil,
  dueLabel,
  dueTone,
  formatDueDate,
  matchesSearch,
} from "../lib/format";
import {
  homeworkNotificationItems,
  notificationPermission,
  refreshCachedHomeworks,
  requestNotificationPermission,
  sendHomeworkNotifications,
} from "../lib/notifications";
import { useOnline } from "../lib/use-online";
import { HomeworkDialog } from "../components/homework-dialog";
import {
  HOMEWORK_PRIORITY_META,
  HOMEWORK_PRIORITY_ORDER,
  HOMEWORK_STATUS_META,
  HOMEWORK_STATUS_ORDER,
  HomeworkStatusPill,
} from "../components/status";
import { Alert, Button, Card, EmptyState, Input, Select, Skeleton } from "../components/ui";

type StatusFilter = "all" | HomeworkStatus;
type SubjectFilter = "all" | HomeworkSubject;
type PriorityFilter = "all" | HomeworkPriority;

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex min-h-9 shrink-0 items-center rounded-full border px-3 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
        active
          ? "border-indigo-600 bg-indigo-600 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

function RemindersControl({ homeworks }: { homeworks: Homework[] }) {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "default",
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setPermission(notificationPermission());
    update();
    window.addEventListener("focus", update);
    return () => window.removeEventListener("focus", update);
  }, []);

  if (permission === "unsupported") return null;

  if (permission === "granted") {
    return (
      <span className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-medium text-emerald-700">
        <BellRing className="size-4" aria-hidden="true" />
        Reminders on
      </span>
    );
  }

  if (permission === "denied") {
    return (
      <span
        className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-500"
        title="Notifications are blocked. Enable them in your browser settings."
      >
        <Bell className="size-4" aria-hidden="true" />
        Reminders blocked
      </span>
    );
  }

  async function enable() {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === "granted") {
      sendHomeworkNotifications(homeworkNotificationItems(homeworks));
      toast.success("Homework reminders enabled");
    } else if (result === "denied") {
      toast.error("Notifications are blocked. Enable them in your browser settings.");
    }
  }

  return (
    <Button variant="secondary" onClick={() => void enable()}>
      <Bell className="size-4" aria-hidden="true" />
      Enable reminders
    </Button>
  );
}

function HomeworkRow({
  homework,
  onEdit,
  onStatusChange,
}: {
  homework: Homework;
  onEdit: (homework: Homework) => void;
  onStatusChange: (homework: Homework, status: HomeworkStatus) => void;
}) {
  const priority = HOMEWORK_PRIORITY_META[homework.priority];
  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={`mt-1.5 size-2 shrink-0 rounded-full ${priority.dot}`}
          title={`${priority.label} priority`}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 text-sm font-semibold text-slate-900">{homework.title}</p>
            <HomeworkStatusPill status={homework.status} />
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-slate-500">
            <span className="font-medium text-slate-600">{homework.subject_name}</span>
            {homework.lesson_title ? <span>· {homework.lesson_title}</span> : null}
            {homework.teacher ? <span>· {homework.teacher}</span> : null}
          </p>
          <p
            className={`mt-1 inline-flex items-center gap-1 text-[11px] font-medium ${dueTone(
              homework.due_on,
              homework.status,
            )}`}
          >
            <CalendarClock className="size-3.5" aria-hidden="true" />
            {homework.due_on
              ? `${formatDueDate(homework.due_on)} · ${dueLabel(homework.due_on)}`
              : "No due date"}
          </p>
          {homework.description ? (
            <p className="mt-1 line-clamp-2 text-xs text-slate-600">{homework.description}</p>
          ) : null}
          {homework.result ? (
            <p className="mt-1 text-[11px] text-slate-600">
              <span className="font-medium">Result:</span> {homework.result}
            </p>
          ) : null}
          {homework.notes ? (
            <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">{homework.notes}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Select
            value={homework.status}
            onChange={(event) =>
              onStatusChange(homework, event.target.value as HomeworkStatus)
            }
            aria-label={`Status for ${homework.title}`}
            className="min-h-8 w-auto py-1 pl-2 pr-6 text-[11px]"
          >
            {HOMEWORK_STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {HOMEWORK_STATUS_META[status].label}
              </option>
            ))}
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(homework)}
            className="min-h-8 px-2 text-[11px]"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            Edit
          </Button>
        </div>
      </div>
    </li>
  );
}

function HomeworkGroup({
  title,
  tone,
  items,
  onEdit,
  onStatusChange,
}: {
  title: string;
  tone: string;
  items: Homework[];
  onEdit: (homework: Homework) => void;
  onStatusChange: (homework: Homework, status: HomeworkStatus) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 font-[var(--font-mono)] text-[10px] uppercase tracking-[0.12em] text-slate-500">
          <span className={`size-1.5 rounded-full ${tone}`} aria-hidden="true" />
          {title}
        </h2>
        <span className="text-[11px] text-slate-500">{items.length}</span>
      </div>
      <ul className="space-y-2">
        {items.map((homework) => (
          <HomeworkRow
            key={homework.id}
            homework={homework}
            onEdit={onEdit}
            onStatusChange={onStatusChange}
          />
        ))}
      </ul>
    </section>
  );
}

export function HomeworksTab() {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [subject, setSubject] = useState<SubjectFilter>("all");
  const [priority, setPriority] = useState<PriorityFilter>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Homework | null>(null);
  const online = useOnline();

  useEffect(() => {
    let cancelled = false;
    studyGet<HomeworkPage>("/homeworks?limit=1000")
      .then((homeworkPage) => {
        if (cancelled) return;
        setHomeworks(homeworkPage.items);
        setError(null);
        sendHomeworkNotifications(homeworkNotificationItems(homeworkPage.items));
        void Promise.allSettled([
          studyGet<SubjectList>("/subjects"),
          studyGet<LessonList>("/lessons"),
        ]).then(([subjectResult, lessonResult]) => {
          if (cancelled) return;
          if (subjectResult.status === "fulfilled") {
            setSubjects(subjectResult.value.items);
          }
          if (lessonResult.status === "fulfilled") {
            setLessons(lessonResult.value.items);
          }
        });
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(
          caught instanceof StudyApiError
            ? caught.detail
            : "The homeworks could not be loaded.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const filtered = useMemo(() => {
    return homeworks.filter((homework) => {
      if (status !== "all" && homework.status !== status) return false;
      if (subject !== "all" && homework.subject !== subject) return false;
      if (priority !== "all" && homework.priority !== priority) return false;
      if (query.trim()) {
        const haystack = [
          homework.title,
          homework.description,
          homework.teacher,
          homework.notes,
          homework.result,
          homework.lesson_title ?? "",
          homework.subject_name,
        ].join(" ");
        if (!matchesSearch(haystack, query)) return false;
      }
      return true;
    });
  }, [homeworks, status, subject, priority, query]);

  const groups = useMemo(() => {
    const overdue: Homework[] = [];
    const today: Homework[] = [];
    const soon: Homework[] = [];
    const later: Homework[] = [];
    const someday: Homework[] = [];
    const done: Homework[] = [];

    for (const homework of filtered) {
      if (homework.status === "submitted" || homework.status === "graded") {
        done.push(homework);
        continue;
      }
      const days = daysUntil(homework.due_on);
      if (days === null) someday.push(homework);
      else if (days < 0) overdue.push(homework);
      else if (days === 0) today.push(homework);
      else if (days <= 7) soon.push(homework);
      else later.push(homework);
    }

    return { overdue, today, soon, later, someday, done };
  }, [filtered]);

  const hasMatches = filtered.length > 0;

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(homework: Homework) {
    setEditing(homework);
    setDialogOpen(true);
  }

  function handleSaved(saved: Homework) {
    setHomeworks((items) => {
      const exists = items.some((item) => item.id === saved.id);
      return exists
        ? items.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...items];
    });
    refreshCachedHomeworks();
  }

  function handleDeleted(id: number) {
    setHomeworks((items) => items.filter((item) => item.id !== id));
    refreshCachedHomeworks();
  }

  async function handleStatusChange(homework: Homework, next: HomeworkStatus) {
    if (next === homework.status) return;
    const previous = homework;
    setHomeworks((items) =>
      items.map((item) => (item.id === homework.id ? { ...item, status: next } : item)),
    );
    try {
      const saved = await studyMutate<Homework>(`/homeworks/${homework.id}`, "PATCH", {
        status: next,
      });
      setHomeworks((items) => items.map((item) => (item.id === saved.id ? saved : item)));
      refreshCachedHomeworks();
    } catch (caught) {
      setHomeworks((items) =>
        items.map((item) => (item.id === homework.id ? previous : item)),
      );
      toast.error(
        caught instanceof StudyApiError
          ? caught.detail
          : "The status could not be updated.",
      );
    }
  }

  function resetFilters() {
    setQuery("");
    setStatus("all");
    setSubject("all");
    setPriority("all");
  }

  function reload() {
    setLoading(true);
    setError(null);
    setReloadKey((key) => key + 1);
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-[var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-slate-500">
            Planner
          </p>
          <h1 className="mt-2 font-[var(--font-display)] text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Homeworks
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Deadlines, status, and feedback in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RemindersControl homeworks={homeworks} />
          <Button onClick={openCreate}>
            <Plus className="size-4" aria-hidden="true" />
            New homework
          </Button>
        </div>
      </header>

      {!online ? (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <WifiOff className="size-4" aria-hidden="true" />
          Offline — showing the homeworks saved on this device.
        </div>
      ) : null}

      {error ? (
        <Alert tone="warning">
          {error}{" "}
          <button
            type="button"
            onClick={reload}
            className="font-semibold underline underline-offset-2"
          >
            Try again
          </button>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-1 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-rose-500" aria-hidden="true" />
          Overdue
          <span className="font-semibold text-slate-900">{groups.overdue.length}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true" />
          Due today
          <span className="font-semibold text-slate-900">{groups.today.length}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-sky-500" aria-hidden="true" />
          Next 7 days
          <span className="font-semibold text-slate-900">{groups.soon.length}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
          Completed
          <span className="font-semibold text-slate-900">{groups.done.length}</span>
        </span>
      </div>

      <Card className="p-3.5">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, notes, teacher…"
              aria-label="Search homeworks"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={status}
              onChange={(event) => setStatus(event.target.value as StatusFilter)}
              aria-label="Filter by status"
              className="w-auto"
            >
              <option value="all">All statuses</option>
              {HOMEWORK_STATUS_ORDER.map((option) => (
                <option key={option} value={option}>
                  {HOMEWORK_STATUS_META[option].label}
                </option>
              ))}
            </Select>
            <Select
              value={priority}
              onChange={(event) => setPriority(event.target.value as PriorityFilter)}
              aria-label="Filter by priority"
              className="w-auto"
            >
              <option value="all">All priorities</option>
              {HOMEWORK_PRIORITY_ORDER.map((option) => (
                <option key={option} value={option}>
                  {HOMEWORK_PRIORITY_META[option].label}
                </option>
              ))}
            </Select>
          </div>
          <div
            role="group"
            aria-label="Filter by subject"
            className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <FilterChip active={subject === "all"} onClick={() => setSubject("all")}>
              All subjects
            </FilterChip>
            {HOMEWORK_SUBJECTS.map((option) => (
              <FilterChip
                key={option.value}
                active={subject === option.value}
                onClick={() => setSubject(option.value)}
              >
                {option.label}
              </FilterChip>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading homeworks">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : !hasMatches ? (
        <Card>
          <EmptyState
            icon={<ClipboardList className="size-5" />}
            title={homeworks.length === 0 ? "No homework yet" : "No homework matches"}
            description={
              homeworks.length === 0
                ? "Add homework to track deadlines, status, and feedback."
                : "Try changing the filters or search."
            }
            action={
              homeworks.length === 0 ? (
                <Button onClick={openCreate}>
                  <Plus className="size-4" aria-hidden="true" />
                  New homework
                </Button>
              ) : (
                <Button variant="secondary" onClick={resetFilters}>
                  Clear filters
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <HomeworkGroup
            title="Overdue"
            tone="bg-rose-500"
            items={groups.overdue}
            onEdit={openEdit}
            onStatusChange={(homework, next) => void handleStatusChange(homework, next)}
          />
          <HomeworkGroup
            title="Due today"
            tone="bg-amber-500"
            items={groups.today}
            onEdit={openEdit}
            onStatusChange={(homework, next) => void handleStatusChange(homework, next)}
          />
          <HomeworkGroup
            title="Next 7 days"
            tone="bg-sky-500"
            items={groups.soon}
            onEdit={openEdit}
            onStatusChange={(homework, next) => void handleStatusChange(homework, next)}
          />
          <HomeworkGroup
            title="Later"
            tone="bg-indigo-500"
            items={groups.later}
            onEdit={openEdit}
            onStatusChange={(homework, next) => void handleStatusChange(homework, next)}
          />
          <HomeworkGroup
            title="No due date"
            tone="bg-slate-400"
            items={groups.someday}
            onEdit={openEdit}
            onStatusChange={(homework, next) => void handleStatusChange(homework, next)}
          />
          <HomeworkGroup
            title="Completed"
            tone="bg-emerald-500"
            items={groups.done}
            onEdit={openEdit}
            onStatusChange={(homework, next) => void handleStatusChange(homework, next)}
          />
        </div>
      )}

      <HomeworkDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        homework={editing}
        lessons={lessons}
        subjects={subjects}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </div>
  );
}