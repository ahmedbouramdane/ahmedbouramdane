const ALLOWED_TAGS = new Set([
  "P",
  "DIV",
  "BR",
  "STRONG",
  "B",
  "EM",
  "I",
  "U",
  "S",
  "STRIKE",
  "H2",
  "H3",
  "H4",
  "UL",
  "OL",
  "LI",
  "BLOCKQUOTE",
  "CODE",
  "PRE",
  "SPAN",
  "FONT",
  "A",
]);

const COLOR_PATTERN =
  /^(#[0-9a-f]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\))$/i;

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeColor(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  return COLOR_PATTERN.test(trimmed) ? trimmed : null;
}

function sanitizeChildren(parent: Element | DocumentFragment) {
  for (const node of Array.from(parent.childNodes)) {
    if (node.nodeType === 3) continue;
    if (node.nodeType !== 1) {
      (node as ChildNode).remove();
      continue;
    }

    const element = node as HTMLElement;
    const tag = element.tagName.toUpperCase();

    if (
      tag === "SCRIPT" ||
      tag === "STYLE" ||
      tag === "IFRAME" ||
      tag === "OBJECT" ||
      tag === "EMBED" ||
      tag === "LINK" ||
      tag === "META"
    ) {
      element.remove();
      continue;
    }

    sanitizeChildren(element);

    if (!ALLOWED_TAGS.has(tag)) {
      element.replaceWith(...Array.from(element.childNodes));
      continue;
    }

    const href = tag === "A" ? element.getAttribute("href") : null;
    const fontColor = tag === "FONT" ? safeColor(element.getAttribute("color")) : null;
    const spanColor = tag === "SPAN" ? safeColor(element.style?.color) : null;

    for (const attribute of Array.from(element.attributes)) {
      element.removeAttribute(attribute.name);
    }

    if (tag === "A" && href && /^(https?:\/\/|mailto:)/i.test(href.trim())) {
      element.setAttribute("href", href.trim());
      element.setAttribute("target", "_blank");
      element.setAttribute("rel", "noopener noreferrer");
    }

    if (tag === "FONT") {
      if (fontColor) element.setAttribute("color", fontColor);
      else element.replaceWith(...Array.from(element.childNodes));
    }

    if (tag === "SPAN") {
      if (spanColor) element.setAttribute("style", `color: ${spanColor}`);
      else element.replaceWith(...Array.from(element.childNodes));
    }
  }
}

export function sanitizeNoteHtml(raw: string | null | undefined): string {
  const input = (raw ?? "").toString();
  if (!input.trim()) return "";
  if (typeof document === "undefined") return escapeHtml(input);

  const template = document.createElement("template");
  template.innerHTML = input;
  sanitizeChildren(template.content);
  const html = template.innerHTML.trim();
  return html === "<br>" ? "" : html;
}

export function noteHtmlToEditable(raw: string | null | undefined): string {
  const input = (raw ?? "").toString();
  if (!input) return "";
  return sanitizeNoteHtml(input).replace(/\r\n?/g, "\n").replace(/\n/g, "<br>");
}