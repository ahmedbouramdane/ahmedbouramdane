"use client";

import { CheckCircle2, ChevronRight } from "lucide-react";
import type { Question } from "../lib/api";
import { formatDate, stripMarkdown } from "../lib/format";
import { PRIORITY_META, QuestionStatusPill } from "./status";

export function QuestionRow({
  question,
  onOpen,
}: {
  question: Question;
  onOpen: (question: Question) => void;
}) {
  const meta = PRIORITY_META[question.priority];
  const answered = question.status === "answered";

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(question)}
        className="group flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:px-5"
      >
        <span
          className={`mt-1.5 size-2 shrink-0 rounded-full ${meta.dot}`}
          title={`${meta.label} priority`}
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="min-w-0 truncate text-sm font-medium text-slate-900">
              {question.title}
            </span>
            <QuestionStatusPill status={question.status} />
            {answered ? (
              <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" aria-label="Answered" />
            ) : null}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-slate-500">
            <span className="font-medium text-slate-600">{question.subject_name}</span>
            {question.lesson_title ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="max-w-48 truncate">{question.lesson_title}</span>
              </>
            ) : null}
            <span aria-hidden="true">·</span>
            <span>{formatDate(question.created_at)}</span>
            {question.teacher ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate">{question.teacher}</span>
              </>
            ) : null}
          </span>
          <span className="mt-1 line-clamp-1 block text-xs text-slate-400">
            {stripMarkdown(question.body) || "No description"}
          </span>
        </span>
        <ChevronRight
          className="mt-1 size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500"
          aria-hidden="true"
        />
      </button>
    </li>
  );
}