import { Fragment } from "react";
import { CodeBlock } from "./Code.jsx";

/**
 * Renders the small Markdown subset knowledge entries use: ## headings, paragraphs, - and 1. lists,
 * - [ ] checklists, ``` code fences (```ts src/lib/auth.ts gives the block a language and a file name),
 * > [!NOTE] / [!TIP] / [!WARNING] callouts, | tables |, **bold** and `code`. Text is rendered as text,
 * never as HTML, because entry content can come from outside AVEL.
 */
/** The id a heading gets, so "On this page" can scroll to it. */
export const headingId = (t) =>
  "kb-h-" +
  String(t)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function Markdown({ text }) {
  const blocks = [];
  const lines = String(text || "").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.startsWith("```")) {
      const [lang, ...rest] = l.slice(3).trim().split(/\s+/);
      const code = [];
      while (++i < lines.length && !lines[i].startsWith("```")) code.push(lines[i]);
      blocks.push({ t: "code", code, lang: lang || null, title: rest.join(" ") || null });
    } else if (/^> /.test(l)) {
      const body = [l.slice(2)];
      while (i + 1 < lines.length && /^> ?/.test(lines[i + 1])) body.push(lines[++i].replace(/^> ?/, ""));
      const m = body[0].match(/^\[!(NOTE|TIP|WARNING)\]\s*(.*)$/i);
      blocks.push({
        t: "callout",
        tone: m ? m[1].toLowerCase() : "note",
        lines: (m ? [m[2]].concat(body.slice(1)) : body).filter(Boolean),
      });
    } else if (/^\|.*\|\s*$/.test(l)) {
      const rows = [l];
      while (i + 1 < lines.length && /^\|.*\|\s*$/.test(lines[i + 1])) rows.push(lines[++i]);
      const cells = (r) =>
        r
          .trim()
          .slice(1, -1)
          .split("|")
          .map((c) => c.trim());
      const body = rows.filter((r) => !/^\|[\s:|-]+\|\s*$/.test(r)).map(cells);
      blocks.push({ t: "table", head: body[0], rows: body.slice(1) });
    } else if (/^#{1,3} /.test(l)) blocks.push({ t: l.startsWith("### ") ? "h3" : "h", text: l.replace(/^#+ /, "") });
    else if (/^- \[[ x]\] /.test(l)) push(blocks, "check", l.slice(6), l[3] === "x");
    else if (/^- /.test(l)) push(blocks, "ul", l.slice(2));
    else if (/^\d+\. /.test(l)) push(blocks, "ol", l.replace(/^\d+\. /, ""));
    else if (l.trim()) blocks.push({ t: "p", text: l });
  }
  return (
    <div className="kb-md">
      {blocks.map((b, i) =>
        b.t === "h" ? (
          <h2 key={i} id={headingId(b.text)} tabIndex={-1}>
            {inline(b.text)}
          </h2>
        ) : b.t === "h3" ? (
          <h3 key={i}>{inline(b.text)}</h3>
        ) : b.t === "p" ? (
          <p key={i}>{inline(b.text)}</p>
        ) : b.t === "code" ? (
          <CodeBlock key={i} code={b.code.join("\n")} lang={b.lang} title={b.title} />
        ) : b.t === "callout" ? (
          <aside key={i} className="kb-callout" data-tone={b.tone} aria-label={CALLOUT[b.tone]}>
            <span className="kb-callout-k">{CALLOUT[b.tone]}</span>
            {b.lines.map((x, j) => (
              <p key={j}>{inline(x)}</p>
            ))}
          </aside>
        ) : b.t === "table" ? (
          <div key={i} className="kb-table-wrap" tabIndex={0} role="region" aria-label="Table">
            <table className="kb-table">
              <thead>
                <tr>
                  {b.head.map((h, j) => (
                    <th key={j} scope="col">
                      {inline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((r, j) => (
                  <tr key={j}>
                    {r.map((c, k) => (
                      <td key={k}>{inline(c)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : b.t === "check" ? (
          <ul key={i} className="kb-checks">
            {b.items.map((it, j) => (
              <li key={j} data-done={it.done ? "true" : undefined}>
                <span className="kb-box" aria-hidden="true"></span>
                <span>{inline(it.text)}</span>
              </li>
            ))}
          </ul>
        ) : b.t === "ol" ? (
          <ol key={i}>
            {b.items.map((it, j) => (
              <li key={j}>{inline(it.text)}</li>
            ))}
          </ol>
        ) : (
          <ul key={i}>
            {b.items.map((it, j) => (
              <li key={j}>{inline(it.text)}</li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}

const CALLOUT = { note: "Note", tip: "Tip", warning: "Watch out" };

function push(blocks, t, text, done) {
  const last = blocks[blocks.length - 1];
  if (last && last.t === t) last.items.push({ text, done });
  else blocks.push({ t, items: [{ text, done }] });
}

/** **bold** and `code` inside a line. */
function inline(s) {
  return s
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    .map((part, i) =>
      part.startsWith("**") ? (
        <b key={i}>{part.slice(2, -2)}</b>
      ) : part.startsWith("`") ? (
        <code key={i}>{part.slice(1, -1)}</code>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      ),
    );
}

/** Code or config with line numbers: skills' SKILL.md, rules, scaffold files. */
export function CodeView({ text, label, wrap }) {
  return <CodeBlock code={text} title={label} numbered wrap={wrap} />;
}
