import { useRef } from "react";
import { Bold, Italic, List, Heading2 } from "lucide-react";
import styles from "./ArticleRichTextEditor.module.css";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

interface EditResult {
  next: string;
  cursor: number;
}

function wrapSelection(el: HTMLTextAreaElement, marker: string): EditResult {
  const { selectionStart, selectionEnd, value } = el;
  const selected = value.slice(selectionStart, selectionEnd) || "text";
  const next = value.slice(0, selectionStart) + marker + selected + marker + value.slice(selectionEnd);
  return { next, cursor: selectionStart + marker.length + selected.length + marker.length };
}

function prefixLines(el: HTMLTextAreaElement, prefix: string): EditResult {
  const { selectionStart, selectionEnd, value } = el;
  const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const nextBreak = value.indexOf("\n", selectionEnd);
  const lineEnd = nextBreak === -1 ? value.length : nextBreak;
  const block = value.slice(lineStart, lineEnd);
  const lines = block.split("\n").map((line) => (line.startsWith(prefix) ? line : prefix + line));
  const rebuilt = lines.join("\n");
  const next = value.slice(0, lineStart) + rebuilt + value.slice(lineEnd);
  return { next, cursor: lineStart + rebuilt.length };
}

function escapeHtml(input: string): string {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inlineMarkdown(text: string): string {
  // Bold is matched first so its ** markers are consumed before the italic pass runs,
  // avoiding any need for lookaround assertions to disambiguate ** from *.
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

/**
 * Minimal, dependency-free Markdown subset renderer: headings (#, ##, ###), bold, italic,
 * and bullet lists. Intentionally small — this is a live-preview aid for the editor, not a
 * general-purpose Markdown engine.
 */
export function renderMarkdown(markdown: string): string {
  const lines = escapeHtml(markdown).split("\n");
  const html: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  for (const line of lines) {
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    const bullet = /^[-*]\s+(.*)$/.exec(line);

    if (bullet) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inlineMarkdown(bullet[1])}</li>`);
      continue;
    }

    closeList();

    if (heading) {
      const level = heading[1].length + 1; // h2 through h4
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
    } else if (line.trim() === "") {
      // skip blank lines between paragraphs
    } else {
      html.push(`<p>${inlineMarkdown(line)}</p>`);
    }
  }
  closeList();

  return html.join("\n") || "<p class=\"muted\">Nothing to preview yet.</p>";
}

/**
 * Lightweight rich-text editor: a Markdown-subset toolbar (Bold / Italic / Bullet list / Heading)
 * over a plain textarea, paired with a live-rendered preview pane. Chosen over a contentEditable +
 * document.execCommand approach because execCommand is deprecated, behaves inconsistently across
 * browsers, and produces HTML that's awkward to store/round-trip in the mock repository — a
 * Markdown string is simple to persist, diff, and re-render deterministically.
 */
export function ArticleRichTextEditor({ value, onChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function apply(fn: (el: HTMLTextAreaElement) => EditResult) {
    const el = textareaRef.current;
    if (!el) return;
    const { next, cursor } = fn(el);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <button type="button" className={styles.toolBtn} title="Bold" onClick={() => apply((el) => wrapSelection(el, "**"))}>
          <Bold size={15} />
        </button>
        <button type="button" className={styles.toolBtn} title="Italic" onClick={() => apply((el) => wrapSelection(el, "*"))}>
          <Italic size={15} />
        </button>
        <button type="button" className={styles.toolBtn} title="Bullet list" onClick={() => apply((el) => prefixLines(el, "- "))}>
          <List size={15} />
        </button>
        <button type="button" className={styles.toolBtn} title="Heading" onClick={() => apply((el) => prefixLines(el, "## "))}>
          <Heading2 size={15} />
        </button>
        <span className={styles.hint}>Markdown supported — formatting updates the preview live</span>
      </div>
      <div className={styles.split}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your article content in Markdown... e.g. ## Heading, **bold**, - bullet point"
        />
        <div className={styles.preview} dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }} />
      </div>
    </div>
  );
}
