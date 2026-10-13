// A tiny, safe markdown-ish renderer (builds React nodes, never innerHTML).
// Supports: "- " bullets, "[ ] / [x]" todos, "# " headings, **bold**, `code`, links, #tags.
import { Fragment, type ReactNode } from "react";

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|https?:\/\/[^\s<>"]+|(?:^|(?<=\s))#[\p{L}\p{N}_-]{1,32})/gu;

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(INLINE)) {
    const tok = m[0];
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const key = `${keyBase}-${i++}`;
    if (tok.startsWith("**")) out.push(<strong key={key}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) out.push(<code key={key}>{tok.slice(1, -1)}</code>);
    else if (tok.startsWith("#")) out.push(<span key={key} className="tag">{tok}</span>);
    else {
      const url = tok.replace(/[).,;:!?]+$/, "");
      out.push(
        <a key={key} href={url} target="_blank" rel="noreferrer noopener">
          {url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 60)}
        </a>,
      );
      if (url.length < tok.length) out.push(tok.slice(url.length));
    }
    last = at + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Rich({ text, className = "" }: { text: string; className?: string }) {
  const blocks: ReactNode[] = [];
  let list: ReactNode[] = [];
  const flush = () => {
    if (list.length) blocks.push(<ul key={`ul-${blocks.length}`}>{list}</ul>);
    list = [];
  };

  text.split("\n").forEach((raw, n) => {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const todo = line.match(/^\s*(?:[-*]\s+)?\[( |x|X)\]\s+(.*)$/);
    if (todo) {
      flush();
      blocks.push(
        <p key={n}>
          <span className={`todo-box${todo[1].trim() ? " x" : ""}`} aria-label={todo[1].trim() ? "done" : "not done"} />
          {inline(todo[2], `l${n}`)}
        </p>,
      );
    } else if (bullet) {
      list.push(<li key={n}>{inline(bullet[1], `l${n}`)}</li>);
    } else if (/^#{1,3}\s/.test(line)) {
      flush();
      blocks.push(<h4 key={n}>{inline(line.replace(/^#{1,3}\s/, ""), `l${n}`)}</h4>);
    } else if (!line.trim()) {
      flush();
    } else {
      flush();
      blocks.push(<p key={n}>{inline(line, `l${n}`)}</p>);
    }
  });
  flush();

  return <div className={`rich ${className}`}>{blocks.length ? blocks : <Fragment />}</div>;
}
