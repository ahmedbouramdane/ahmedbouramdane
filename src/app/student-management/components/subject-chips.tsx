"use client";

import type { SubjectSummary } from "../lib/api";

export function subjectShortName(subject: Pick<SubjectSummary, "name">) {
  const parts = subject.name.split(" — ");
  return parts.length > 1 ? parts[1] : subject.name;
}

export function SubjectChips({
  subjects,
  activeSubjectId,
  onSelect,
}: {
  subjects: SubjectSummary[];
  activeSubjectId: number | null;
  onSelect: (subjectId: number | null) => void;
}) {
  const chipBase =
    "inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";

  return (
    <div
      role="group"
      aria-label="Filter by subject"
      className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <button
        type="button"
        aria-pressed={activeSubjectId === null}
        onClick={() => onSelect(null)}
        className={`${chipBase} ${
          activeSubjectId === null
            ? "border-indigo-600 bg-indigo-600 text-white"
            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
        }`}
      >
        All
      </button>
      {subjects.map((subject) => {
        const active = activeSubjectId === subject.id;
        return (
          <button
            key={subject.id}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(subject.id)}
            className={`${chipBase} ${
              active
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
            }`}
          >
            {subjectShortName(subject)}
            <span className={active ? "text-[10px] text-indigo-100" : "text-[10px] text-slate-400"}>
              {subject.lessons}
            </span>
          </button>
        );
      })}
    </div>
  );
}