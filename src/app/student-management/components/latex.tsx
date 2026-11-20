"use client";

import katex from "katex";
import { useMemo } from "react";

type Segment = { kind: "text" | "math"; value: string; display: boolean };

export type MathSegment = Segment;

export function splitMath(input: string): MathSegment[] {
  const segments: Segment[] = [];
  let textStart = 0;
  let index = 0;

  const pushText = (end: number) => {
    if (end > textStart) {
      segments.push({ kind: "text", value: input.slice(textStart, end), display: false });
    }
  };

  while (index < input.length) {
    const char = input[index];

    if (char === "\\") {
      const next = input[index + 1];
      const closing = next === "(" ? "\\)" : next === "[" ? "\\]" : null;
      if (closing) {
        const end = input.indexOf(closing, index + 2);
        if (end !== -1) {
          pushText(index);
          segments.push({
            kind: "math",
            value: input.slice(index + 2, end),
            display: next === "[",
          });
          index = end + 2;
          textStart = index;
          continue;
        }
        index += 2;
        continue;
      }
      index += 2;
      continue;
    }

    if (char === "$") {
      if (input[index + 1] === "$") {
        const end = input.indexOf("$$", index + 2);
        if (end !== -1) {
          pushText(index);
          segments.push({ kind: "math", value: input.slice(index + 2, end), display: true });
          index = end + 2;
          textStart = index;
          continue;
        }
      } else {
        const end = input.indexOf("$", index + 1);
        if (end !== -1 && !input.slice(index + 1, end).includes("\n")) {
          pushText(index);
          segments.push({ kind: "math", value: input.slice(index + 1, end), display: false });
          index = end + 1;
          textStart = index;
          continue;
        }
      }
    }

    index += 1;
  }

  pushText(input.length);
  return segments;
}

export function renderMath(value: string, displayMode: boolean) {
  return katex.renderToString(value, {
    displayMode,
    throwOnError: false,
    strict: "ignore",
    output: "htmlAndMathml",
  });
}

export function Latex({
  children,
  className = "",
}: {
  children: string | null | undefined;
  className?: string;
}) {
  const segments = useMemo(() => splitMath(children ?? ""), [children]);

  if (!children || !children.trim()) return null;

  return (
    <div className={`whitespace-pre-wrap break-words ${className}`}>
      {segments.map((segment, index) => {
        if (segment.kind === "text") {
          return <span key={index}>{segment.value}</span>;
        }

        let html: string;
        try {
          html = renderMath(segment.value, segment.display);
        } catch {
          return (
            <span
              key={index}
              className="rounded bg-rose-50 px-1 font-[var(--font-mono)] text-[0.9em] text-rose-600"
            >
              {segment.value}
            </span>
          );
        }

        return segment.display ? (
          <span
            key={index}
            className="my-2 block overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <span key={index} dangerouslySetInnerHTML={{ __html: html }} />
        );
      })}
    </div>
  );
}