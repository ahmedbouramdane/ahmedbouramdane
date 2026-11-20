"use client";

import {
  Bold,
  Eye,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Pencil,
  Quote,
  RemoveFormatting,
  Underline,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { noteHtmlToEditable, sanitizeNoteHtml } from "../lib/notes";
import { Button } from "./ui";

export const noteProse =
  "[&_p]:mb-2 [&_p:last-child]:mb-0 " +
  "[&_strong]:font-semibold [&_strong]:text-slate-900 [&_b]:font-semibold " +
  "[&_em]:italic [&_i]:italic [&_u]:underline " +
  "[&_s]:line-through [&_strike]:line-through " +
  "[&_h2]:mt-3 [&_h2]:mb-1 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-slate-900 " +
  "[&_h3]:mt-2.5 [&_h3]:mb-0.5 [&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:text-slate-800 " +
  "[&_h4]:mt-2 [&_h4]:mb-0.5 [&_h4]:text-xs [&_h4]:font-semibold [&_h4]:text-slate-700 " +
  "[&_ul]:mb-2 [&_ul]:list-disc [&_ul]:space-y-0.5 [&_ul]:pl-4 " +
  "[&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:space-y-0.5 [&_ol]:pl-4 " +
  "[&_li]:pl-0.5 [&_li>ul]:mt-0.5 [&_li>ol]:mt-0.5 " +
  "[&_blockquote]:my-1.5 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-2.5 [&_blockquote]:text-slate-600 " +
  "[&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:font-[var(--font-mono)] [&_code]:text-[0.9em] " +
  "[&_a]:font-medium [&_a]:text-indigo-600 [&_a]:underline [&_a]:underline-offset-2";

const NOTE_COLORS = [
  { label: "Rose", value: "#e11d48" },
  { label: "Orange", value: "#ea580c" },
  { label: "Amber", value: "#b45309" },
  { label: "Emerald", value: "#047857" },
  { label: "Sky", value: "#0369a1" },
  { label: "Violet", value: "#6d28d9" },
];

type Tool = {
  label: string;
  command: string;
  argument?: string;
  icon: ComponentType<{ className?: string }>;
  activeKey?: string;
};

const TOOLS: Tool[] = [
  { label: "Bold", command: "bold", icon: Bold, activeKey: "bold" },
  { label: "Italic", command: "italic", icon: Italic, activeKey: "italic" },
  { label: "Underline", command: "underline", icon: Underline, activeKey: "underline" },
  { label: "Heading", command: "formatBlock", argument: "h2", icon: Heading2 },
  { label: "Subheading", command: "formatBlock", argument: "h3", icon: Heading3 },
  {
    label: "Bullet list",
    command: "insertUnorderedList",
    icon: List,
    activeKey: "insertUnorderedList",
  },
  {
    label: "Numbered list",
    command: "insertOrderedList",
    icon: ListOrdered,
    activeKey: "insertOrderedList",
  },
  { label: "Quote", command: "formatBlock", argument: "blockquote", icon: Quote },
  { label: "Clear formatting", command: "removeFormat", icon: RemoveFormatting },
];

export function NotePreview({
  value,
  className = "",
  clamp = false,
}: {
  value: string | null | undefined;
  className?: string;
  clamp?: boolean;
}) {
  const html = useMemo(() => sanitizeNoteHtml(value), [value]);
  if (!html) return null;
  return (
    <div
      className={`${noteProse} ${clamp ? "line-clamp-3" : ""} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function NoteEditor({
  value,
  onSave,
  label,
  placeholder = "Add a note…",
  maxLength = 5000,
  compact = false,
  defaultEditing = false,
  onCancel,
}: {
  value: string;
  onSave: (value: string) => Promise<void>;
  label: string;
  placeholder?: string;
  maxLength?: number;
  compact?: boolean;
  defaultEditing?: boolean;
  onCancel?: () => void;
}) {
  const [editing, setEditing] = useState(defaultEditing);
  const [draft, setDraft] = useState(() => noteHtmlToEditable(value));
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState<Record<string, boolean>>({});
  const editorRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef(draft);

  useEffect(() => {
    if (!editing || preview) return;
    const editor = editorRef.current;
    if (!editor) return;
    editor.innerHTML = draftRef.current;
    editor.focus();
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [editing, preview]);

  function refreshActive() {
    if (typeof document === "undefined") return;
    setActive({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList: document.queryCommandState("insertOrderedList"),
    });
  }

  function syncFromEditor() {
    const html = editorRef.current?.innerHTML ?? draftRef.current;
    draftRef.current = html;
    setDraft(html);
    refreshActive();
  }

  function startEditing() {
    const html = noteHtmlToEditable(value);
    draftRef.current = html;
    setDraft(html);
    setPreview(false);
    setActive({});
    setEditing(true);
  }

  function exec(command: string, argument?: string) {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand(command, false, argument);
    syncFromEditor();
  }

  async function handleSave() {
    const cleaned = sanitizeNoteHtml(draftRef.current || draft);
    if (cleaned.length > maxLength) return;
    setSaving(true);
    try {
      await onSave(cleaned);
      setEditing(false);
      setPreview(false);
    } catch {
      // The parent reports the error; keep the draft open so it can be retried.
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    const hasNote = Boolean(value.trim());
    return (
      <div
        className={`rounded-xl border bg-white transition ${
          compact ? "px-3 py-2" : "px-3.5 py-3"
        } ${hasNote ? "border-slate-200" : "border-dashed border-slate-300"}`}
      >
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="font-[var(--font-mono)] text-[9px] uppercase tracking-[0.12em] text-slate-400">
            {hasNote ? "Preview" : "Note"}
          </span>
          <button
            type="button"
            onClick={startEditing}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            {hasNote ? "Edit" : "Write"}
          </button>
        </div>
        {hasNote ? (
          <NotePreview
            value={value}
            clamp={compact}
            className={`leading-6 text-slate-700 ${compact ? "text-[13px]" : "text-sm"}`}
          />
        ) : (
          <p className="text-xs text-slate-400">{placeholder}</p>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white transition focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-1.5 py-1">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = tool.activeKey ? Boolean(active[tool.activeKey]) : false;
          return (
            <button
              key={tool.label}
              type="button"
              title={tool.label}
              aria-label={tool.label}
              aria-pressed={tool.activeKey ? isActive : undefined}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => exec(tool.command, tool.argument)}
              disabled={preview}
              className={`grid place-items-center rounded-md transition disabled:cursor-not-allowed disabled:opacity-40 ${
                compact ? "size-7" : "size-8"
              } ${
                isActive
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"
              }`}
            >
              <Icon className={compact ? "size-3.5" : "size-4"} />
            </button>
          );
        })}

        <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />

        {NOTE_COLORS.map((color) => (
          <button
            key={color.value}
            type="button"
            title={`${color.label} text`}
            aria-label={`${color.label} text`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => exec("foreColor", color.value)}
            disabled={preview}
            className="grid size-7 place-items-center rounded-md transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span
              className="size-4 rounded-full border border-white shadow"
              style={{ backgroundColor: color.value }}
            />
          </button>
        ))}

        <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />

        <div className="ml-auto flex items-center gap-0.5 rounded-lg bg-slate-200/70 p-0.5">
          <button
            type="button"
            aria-pressed={!preview}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setPreview(false)}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition ${
              preview
                ? "text-slate-500 hover:text-slate-700"
                : "bg-white text-indigo-700 shadow-sm"
            }`}
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            Write
          </button>
          <button
            type="button"
            aria-pressed={preview}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (preview) return;
              const html = editorRef.current?.innerHTML ?? draftRef.current;
              draftRef.current = html;
              setDraft(html);
              setPreview(true);
            }}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition ${
              preview ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Eye className="size-3.5" aria-hidden="true" />
            Preview
          </button>
        </div>
      </div>

      {preview ? (
        <div className={`${compact ? "max-h-80" : "max-h-96"} overflow-y-auto px-3 py-2.5`}>
          {draft.trim() ? (
            <NotePreview value={draft} className="text-[13px] leading-6 text-slate-700" />
          ) : (
            <p className="text-xs text-slate-400">Nothing to preview yet.</p>
          )}
        </div>
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={label}
          onInput={syncFromEditor}
          onMouseUp={refreshActive}
          onKeyUp={refreshActive}
          onBlur={syncFromEditor}
          className={`${noteProse} ${
            compact ? "max-h-80 min-h-24" : "max-h-96 min-h-28"
          } overflow-y-auto px-3 py-2.5 text-[13px] leading-6 text-slate-700 outline-none`}
        />
      )}

      <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/70 px-2 py-1.5">
        <span
          className={`text-[10px] ${
            draft.length > maxLength ? "text-rose-600" : "text-slate-400"
          }`}
        >
          {draft.length}/{maxLength}
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditing(false);
              onCancel?.();
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => void handleSave()}
            loading={saving}
            disabled={draft.length > maxLength}
          >
            Save note
          </Button>
        </div>
      </div>
    </div>
  );
}