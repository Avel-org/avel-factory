import { useEffect, useRef, useState } from "react";

/**
 * Docs-grade code: a header with the file name or language, a copy button, line numbers, and light
 * syntax colouring. Code is always rendered as text, never as HTML: entry content can come from
 * outside AVEL. The tokenizer is deliberately small: it colours what helps reading (comments,
 * strings, keywords, numbers, tags, keys) and leaves the rest alone.
 */

const EXT = {
  ts: "ts",
  tsx: "ts",
  js: "js",
  jsx: "js",
  mjs: "js",
  cjs: "js",
  astro: "astro",
  json: "json",
  yml: "yaml",
  yaml: "yaml",
  md: "md",
  sh: "sh",
  bash: "sh",
  css: "css",
  sql: "sql",
  diff: "diff",
};
const LABEL = {
  ts: "TypeScript",
  js: "JavaScript",
  astro: "Astro",
  json: "JSON",
  yaml: "YAML",
  md: "Markdown",
  sh: "Shell",
  css: "CSS",
  sql: "SQL",
  diff: "Diff",
  text: "Text",
};

/** "src/lib/auth.ts" → "ts"; "ts" → "ts". */
export function langOf(nameOrLang) {
  const s = String(nameOrLang || "").toLowerCase();
  if (EXT[s]) return EXT[s];
  const ext = s.split(".").pop();
  return EXT[ext] || (s.endsWith("skill.md") ? "md" : "text");
}

const KW =
  /^(?:import|export|from|default|const|let|var|function|return|async|await|if|else|for|while|of|in|new|class|extends|type|interface|throw|try|catch|finally|switch|case|break|continue|true|false|null|undefined|this|typeof|as|void)$/;
const SQLKW =
  /^(?:select|from|where|insert|into|update|set|delete|create|table|index|on|and|or|not|null|primary|key|references|join|left|order|by|group|limit|values)$/i;

/** One line → [{k, s}] where k is a token kind (or "" for plain text). */
export function tokens(line, lang) {
  const out = [];
  const push = (k, s) => s && out.push({ k, s });
  if (lang === "diff") return [{ k: line.startsWith("+") ? "add" : line.startsWith("-") ? "del" : "", s: line }];
  if (lang === "md") {
    if (/^#{1,6} /.test(line)) return [{ k: "kw", s: line }];
    if (/^\s*[-*] /.test(line)) {
      const m = line.match(/^(\s*[-*] )(.*)$/);
      return [{ k: "punct", s: m[1] }].concat(inlineMd(m[2]));
    }
    return inlineMd(line);
  }
  if (lang === "yaml") {
    const m = line.match(/^(\s*-?\s*)([A-Za-z0-9_.-]+)(:)(.*)$/);
    const hash = line.indexOf(" #");
    if (/^\s*#/.test(line)) return [{ k: "com", s: line }];
    if (m) {
      push("", m[1]);
      push("key", m[2]);
      push("punct", m[3]);
      const rest = hash > -1 && hash > line.indexOf(":") ? m[4].slice(0, m[4].indexOf(" #")) : m[4];
      const com = rest !== m[4] ? m[4].slice(rest.length) : "";
      push(
        /^\s*["']/.test(rest)
          ? "str"
          : /^\s*-?\d/.test(rest)
            ? "num"
            : /^\s*(true|false|null)\s*$/.test(rest)
              ? "kw"
              : "",
        rest,
      );
      push("com", com);
      return out;
    }
    return [{ k: /^\s*-\s/.test(line) ? "" : "", s: line }];
  }
  if (lang === "sh") {
    if (/^\s*#/.test(line)) return [{ k: "com", s: line }];
    return line.split(/(\s+)/).map((w, i) => ({
      k: i === 0 && /^\$/.test(w) ? "punct" : /^--?[a-z]/.test(w) ? "key" : /^["'].*["']$/.test(w) ? "str" : "",
      s: w,
    }));
  }
  // ts, js, astro, json, css, sql: a single pass over the line
  const re =
    /(\/\/.*$|\/\*.*?\*\/|<!--.*?-->)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(<\/?[A-Za-z][\w.:-]*|\/?>)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(---)|([{}()[\];,.:=+\-*/<>!?&|%]+)/g;
  let last = 0;
  let m;
  while ((m = re.exec(line))) {
    push("", line.slice(last, m.index));
    const [all, com, str, tag, num, word, fence, punct] = m;
    if (com) push("com", com);
    else if (str) push(lang === "json" && /^\s*:/.test(line.slice(m.index + all.length)) ? "key" : "str", str);
    else if (tag && (lang === "astro" || lang === "ts" || lang === "js")) push("tag", tag);
    else if (num) push("num", num);
    else if (word)
      push(
        (lang === "sql" ? SQLKW : KW).test(word)
          ? "kw"
          : /^[A-Z]/.test(word) && lang !== "sql"
            ? "type"
            : line.slice(m.index + word.length).startsWith("(")
              ? "fn"
              : "",
        word,
      );
    else if (fence) push("punct", fence);
    else push(punct ? "punct" : "", all);
    last = m.index + all.length;
  }
  push("", line.slice(last));
  return out;
}

function inlineMd(s) {
  return s
    .split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
    .map((p) => ({ k: p.startsWith("`") ? "str" : p.startsWith("**") ? "kw" : "", s: p }));
}

/** The copy button: copies the text, says so for a moment, and never moves the layout. */
export function CopyButton({ text, label }) {
  const [done, setDone] = useState(false);
  const t = useRef(null);
  useEffect(() => () => clearTimeout(t.current), []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      // the preview may block the clipboard; fall back to a hidden field
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch (e2) {
        /* nothing else to try */
      }
      ta.remove();
    }
    setDone(true);
    clearTimeout(t.current);
    t.current = setTimeout(() => setDone(false), 1600);
  };
  return (
    <button
      type="button"
      className="cb-copy"
      data-done={done ? "true" : undefined}
      onClick={copy}
      aria-label={done ? "Copied" : "Copy " + (label || "code")}
    >
      <span className="cb-swap" aria-hidden="true">
        <svg
          className="cb-i-a"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="8" y="8" width="13" height="13" rx="2" />
          <path d="M4 16V5a2 2 0 0 1 2-2h11" />
        </svg>
        <svg
          className="cb-i-b"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <span className="cb-copy-l" aria-hidden="true">
        {done ? "Copied" : "Copy"}
      </span>
    </button>
  );
}

/**
 * A code block. `title` is a file path or a short caption; `lang` is inferred from the title when not given.
 * `numbered` shows line numbers (on by default for files, off for short snippets).
 */
export function CodeBlock({ code, lang, title, numbered, caption, wrap, maxHeight }) {
  const text = String(code || "").replace(/\n$/, "");
  const lg = langOf(lang || title);
  const lines = text.split("\n");
  const num = numbered != null ? numbered : lines.length > 4;
  const isFile = !!title && /[./]/.test(title);
  return (
    <figure className="cb" data-lang={lg}>
      <figcaption className="cb-head">
        <span className="cb-title">
          {isFile ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
              <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            </svg>
          ) : null}
          <span className={isFile ? "kb-mono" : undefined}>{title || LABEL[lg] || lg}</span>
        </span>
        {title ? <span className="cb-lang">{LABEL[lg] || lg}</span> : null}
        <CopyButton text={text} label={title || LABEL[lg]} />
      </figcaption>
      <pre
        className="cb-pre"
        data-numbered={num ? "true" : undefined}
        data-wrap={wrap ? "true" : undefined}
        style={maxHeight ? { maxHeight } : undefined}
        tabIndex={0}
        aria-label={(title || LABEL[lg] || "Code") + ", " + lines.length + (lines.length === 1 ? " line" : " lines")}
      >
        <code>
          {lines.map((l, i) => {
            const tk = tokens(l, lg);
            const kind = lg === "diff" && tk[0] ? tk[0].k : undefined;
            return (
              <span key={i} className="cb-line" data-diff={kind || undefined}>
                {num ? (
                  <span className="cb-n" aria-hidden="true">
                    {i + 1}
                  </span>
                ) : null}
                <span className="cb-src">
                  {l
                    ? tk.map((x, j) =>
                        x.k ? (
                          <span key={j} className={"tk-" + x.k}>
                            {x.s}
                          </span>
                        ) : (
                          x.s
                        ),
                      )
                    : " "}
                </span>
              </span>
            );
          })}
        </code>
      </pre>
      {caption ? <p className="cb-cap">{caption}</p> : null}
    </figure>
  );
}
