"use client";

import { useMemo, type ReactNode } from "react";
import ReactMarkdown, { type Components, type Options } from "react-markdown";
import remarkGfm from "remark-gfm";
import { renderMath, splitMath } from "./latex";

export const markdownProse =
  "[&_h1]:mt-3 [&_h1]:mb-1.5 [&_h1]:text-[1.15em] [&_h1]:font-semibold [&_h1]:text-slate-900 [&_h1:first-child]:mt-0 " +
  "[&_h2]:mt-3 [&_h2]:mb-1 [&_h2]:text-[1.05em] [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h2:first-child]:mt-0 " +
  "[&_h3]:mt-2.5 [&_h3]:mb-0.5 [&_h3]:text-[1em] [&_h3]:font-semibold [&_h3]:text-slate-800 " +
  "[&_h4]:mt-2 [&_h4]:mb-0.5 [&_h4]:text-[0.95em] [&_h4]:font-semibold [&_h4]:text-slate-700 " +
  "[&_h5]:mt-2 [&_h5]:mb-0.5 [&_h5]:text-[0.9em] [&_h5]:font-semibold [&_h5]:text-slate-700 " +
  "[&_h6]:mt-2 [&_h6]:mb-0.5 [&_h6]:text-[0.85em] [&_h6]:font-semibold [&_h6]:text-slate-600 " +
  "[&_p]:mb-2 [&_p:last-child]:mb-0 " +
  "[&_ul]:mb-2 [&_ul]:list-disc [&_ul]:space-y-0.5 [&_ul]:pl-4 " +
  "[&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:space-y-0.5 [&_ol]:pl-4 " +
  "[&_li]:pl-0.5 [&_li>ul]:mt-0.5 [&_li>ol]:mt-0.5 " +
  "[&_blockquote]:my-1.5 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-2.5 [&_blockquote]:text-slate-600 " +
  "[&_strong]:font-semibold [&_strong]:text-slate-900 " +
  "[&_em]:italic " +
  "[&_del]:text-slate-500 [&_del]:line-through " +
  "[&_hr]:my-3 [&_hr]:border-slate-200 " +
  "[&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold [&_th]:text-slate-700 " +
  "[&_td]:border [&_td]:border-slate-200 [&_td]:px-2 [&_td]:py-1 [&_td]:align-top";

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

function mathElement(source: string, display: boolean): HastNode {
  return {
    type: "element",
    tagName: "code",
    properties: { className: [display ? "math-display" : "math-inline"] },
    children: [{ type: "text", value: source }],
  };
}

function transform(node: HastNode): HastNode[] {
  if (node.type === "element" && (node.tagName === "code" || node.tagName === "pre")) {
    return [node];
  }

  if (node.type === "text") {
    if (!node.value) return [node];
    const segments = splitMath(node.value);
    if (!segments.some((segment) => segment.kind === "math")) return [node];
    return segments.flatMap((segment) => {
      if (segment.kind === "math") return [mathElement(segment.value, segment.display)];
      return segment.value ? [{ type: "text", value: segment.value }] : [];
    });
  }

  if (node.children) node.children = node.children.flatMap(transform);
  return [node];
}

function rehypeMath() {
  return (tree: HastNode) => {
    tree.children = (tree.children ?? []).flatMap(transform);
  };
}

const remarkPlugins = [remarkGfm] as NonNullable<Options["remarkPlugins"]>;
const rehypePlugins = [rehypeMath] as NonNullable<Options["rehypePlugins"]>;

function textOf(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(textOf).join("");
  return "";
}

function domProps<T extends object>(props: T): Omit<T, "node"> {
  const rest = { ...props } as Record<string, unknown>;
  delete rest.node;
  return rest as Omit<T, "node">;
}

function MathHtml({ source, display }: { source: string; display: boolean }) {
  const html = useMemo(() => renderMath(source, display), [source, display]);
  return (
    <span
      className={display ? "my-2 block overflow-x-auto" : undefined}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

const components: Components = {
  a: ({ href, children, ...rest }) => (
    <a
      {...domProps(rest)}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-700"
    >
      {children}
    </a>
  ),
  img: ({ src, alt, ...rest }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...domProps(rest)}
      src={src}
      alt={alt ?? ""}
      loading="lazy"
      className="my-1.5 max-h-64 rounded-lg"
    />
  ),
  code: ({ className, children, ...rest }) => {
    const classes = className ?? "";
    if (classes.includes("math-inline") || classes.includes("math-display")) {
      return <MathHtml source={textOf(children)} display={classes.includes("math-display")} />;
    }
    return (
      <code
        {...domProps(rest)}
        className={
          classes
            ? "font-mono text-[0.9em]"
            : "rounded bg-slate-100 px-1 py-0.5 font-[var(--font-mono)] text-[0.9em] text-slate-800"
        }
      >
        {children}
      </code>
    );
  },
  pre: ({ children, ...rest }) => (
    <pre
      {...domProps(rest)}
      className="my-2 overflow-x-auto rounded-lg bg-slate-900 p-2.5 text-slate-100"
    >
      {children}
    </pre>
  ),
  table: ({ children, ...rest }) => (
    <div className="my-2 overflow-x-auto">
      <table {...domProps(rest)} className="w-full border-collapse text-xs">
        {children}
      </table>
    </div>
  ),
  input: (props) => <input {...domProps(props)} className="mr-1.5 align-middle accent-indigo-600" />,
};

export function Markdown({
  children,
  className = "",
}: {
  children: string | null | undefined;
  className?: string;
}) {
  const value = children ?? "";
  if (!value.trim()) return null;
  return (
    <div className={`${markdownProse} ${className}`}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
        skipHtml
      >
        {value}
      </ReactMarkdown>
    </div>
  );
}