"use client";

import {
  Archive,
  CheckCircle2,
  MessageSquarePlus,
  Pencil,
  RotateCcw,
  Send,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type { Question, QuestionStatus } from "../lib/api";
import { formatDateTime } from "../lib/format";
import { Markdown } from "./markdown";
import { NotePreview } from "./note-editor";
import { PRIORITY_META, QUESTION_STATUS_META } from "./status";
import { Button, StudyDialog } from "./ui";

function MetaItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0 rounded-md border border-slate-200/70 bg-slate-50/60 px-2 py-1.5">
      <dt className="font-[var(--font-mono)] text-[8px] uppercase tracking-[0.12em] text-slate-400">
        {label}
      </dt>
      <dd
        className="mt-0.5 truncate text-[10.5px] font-medium text-slate-600"
        title={value ?? ""}
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}

export function QuestionDetailDialog({
  question,
  onClose,
  onEdit,
  onStatusChange,
  onDelete,
}: {
  question: Question;
  onClose: () => void;
  onEdit: (question: Question, status?: QuestionStatus) => void;
  onStatusChange: (question: Question, status: QuestionStatus) => void;
  onDelete: (question: Question) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <StudyDialog
        open
        wide
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        title={question.title}
        description={`${question.subject_name}${
          question.lesson_title ? ` · ${question.lesson_title}` : ""
        }`}
        footer={
          <div className="flex flex-wrap items-center gap-1.5">
            <Button size="sm" variant="secondary" onClick={() => onEdit(question)}>
              <Pencil className="size-3.5" aria-hidden="true" />
              Edit
            </Button>

            {question.status === "pending" ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onStatusChange(question, "asked")}
              >
                <Send className="size-3.5" aria-hidden="true" />
                Mark asked
              </Button>
            ) : null}

            {question.status === "asked" ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onEdit(question, "answered")}
              >
                <MessageSquarePlus className="size-3.5" aria-hidden="true" />
                Add response
              </Button>
            ) : null}

            {question.status === "answered" ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onStatusChange(question, "archived")}
              >
                <Archive className="size-3.5" aria-hidden="true" />
                Archive
              </Button>
            ) : null}

            {question.status === "archived" ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onStatusChange(question, "pending")}
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Restore
              </Button>
            ) : null}

            <Button
              size="sm"
              variant="ghost"
              className="ml-auto text-rose-600 hover:bg-rose-50"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Delete
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <section>
            <p className="font-[var(--font-mono)] text-[9px] uppercase tracking-[0.14em] text-slate-400">
              Question
            </p>
            <div className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
              <Markdown className="text-[15px] leading-relaxed text-slate-800">
                {question.body}
              </Markdown>
            </div>
          </section>

          <section>
            <p className="font-[var(--font-mono)] text-[9px] uppercase tracking-[0.14em] text-slate-400">
              Teacher response
            </p>
            {question.response ? (
              <div className="mt-2 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3.5">
                <div className="mb-1.5 flex items-center gap-1.5 font-[var(--font-mono)] text-[9px] uppercase tracking-[0.14em] text-emerald-700">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  Answered
                </div>
                <Markdown className="text-[15px] leading-relaxed text-emerald-950">
                  {question.response}
                </Markdown>
              </div>
            ) : (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3.5">
                <div>
                  <p className="text-sm font-medium text-slate-600">Awaiting response</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Add your teacher&apos;s answer when it arrives.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onEdit(question, "answered")}
                >
                  <MessageSquarePlus className="size-3.5" aria-hidden="true" />
                  Add response
                </Button>
              </div>
            )}
          </section>

          {question.personal_note ? (
            <section>
              <p className="font-[var(--font-mono)] text-[9px] uppercase tracking-[0.14em] text-slate-400">
                Personal note
              </p>
              <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5">
                <NotePreview
                  value={question.personal_note}
                  className="text-xs leading-relaxed text-slate-700"
                />
              </div>
            </section>
          ) : null}

          <section className="border-t border-slate-100 pt-3">
            <p className="font-[var(--font-mono)] text-[9px] uppercase tracking-[0.14em] text-slate-400">
              Details
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <MetaItem label="Status" value={QUESTION_STATUS_META[question.status].label} />
              <MetaItem label="Priority" value={PRIORITY_META[question.priority].label} />
              <MetaItem label="Subject" value={question.subject_name} />
              <MetaItem label="Lesson" value={question.lesson_title} />
              <MetaItem label="Subtitle" value={question.subtitle_title} />
              <MetaItem label="Teacher" value={question.teacher || null} />
              <MetaItem label="Created" value={formatDateTime(question.created_at)} />
              <MetaItem label="Updated" value={formatDateTime(question.updated_at)} />
            </dl>
            {question.asked_at || question.answered_at ? (
              <p className="mt-2 text-[10px] text-slate-400">
                {question.asked_at ? `Asked ${formatDateTime(question.asked_at)}. ` : ""}
                {question.answered_at ? `Answered ${formatDateTime(question.answered_at)}.` : ""}
              </p>
            ) : null}
          </section>
        </div>
      </StudyDialog>

      <StudyDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete question"
        description="This cannot be undone."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirmDelete(false);
                onDelete(question);
              }}
            >
              Delete question
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          Delete <span className="font-semibold text-slate-900">“{question.title}”</span>? The
          question, its response, and your notes will be removed.
        </p>
      </StudyDialog>
    </>
  );
}