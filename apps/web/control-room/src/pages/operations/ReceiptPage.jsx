import { useEffect, useRef, useState } from "react";
import { CodeBlock } from "../../kit/Code.jsx";
import { sha256Hex } from "../../kit/sha256.js";
import { receiptDigestInput } from "../../kit/receipt-digest";
import { EmptyState } from "../../kit/EmptyState";

/**
 * The receipt: Gate 5's signed record of exactly what ships, printed like a receipt, with a proof check
 * beside it. The check recomputes every digest on this device: each proof file, then the receipt's own
 * digest over all of them, then that the commit it covers is the one that ships. Nothing is trusted
 * from the page itself. A tampered copy is one tap away, so you can see the check fail too.
 */
export function ReceiptPage({ v }) {
  const I = v.I;
  if (!v.ready)
    return (
      <div className="rcp-empty lib-card">
        <EmptyState
          scene="emptyList"
          heading="h2"
          title="No receipt yet"
          action={
            <a className="av-btn" data-variant="secondary" href={v.releaseHref}>
              Back to Release
            </a>
          }
        >
          Gate 5 issues the receipt when every module has landed and every check has passed.
        </EmptyState>
      </div>
    );
  return <Receipt v={v} I={I} />;
}

const short = (h) => (h ? h.slice(0, 8) + "…" + h.slice(-4) : "");

function Receipt({ v, I }) {
  const [run, setRun] = useState(null); // { tampered, steps: [{key, state, got, ms}], done, ok, ms }
  const [open, setOpen] = useState(v.artifacts[0].key);
  const busy = run && !run.done;
  const live = useRef(0);

  const steps = [
    { key: "sig", label: "Signed by " + v.signature.by, sub: v.signature.alg + " key " + v.signature.key, kind: "sig" },
    ...v.artifacts.map((a) => ({ key: a.key, label: a.label, sub: a.file, kind: "file", want: a.sha })),
    {
      key: "digest",
      label: "Receipt digest",
      sub: "Covers the commit, the verdict and every file above",
      kind: "digest",
      want: v.hex,
    },
    {
      key: "ships",
      label: "Ships the commit that was checked",
      sub: v.target.repo + " · " + v.target.branch,
      kind: "ships",
    },
  ];

  const check = async (tampered) => {
    const id = ++live.current;
    const state = steps.map((s) => ({ key: s.key, state: "wait" }));
    const put = (i, patch) => {
      if (id !== live.current) return;
      state[i] = Object.assign({}, state[i], patch);
      setRun({ tampered, steps: state.slice(), done: false });
    };
    setRun({ tampered, steps: state.slice(), done: false });
    const pause = () =>
      new Promise((r) => setTimeout(r, matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 90));
    const hashes = [];
    let ok = true,
      work = 0;
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      put(i, { state: "run" });
      const a0 = performance.now();
      let pass = true,
        got = null;
      if (s.kind === "sig") {
        // the server checks the signature (GET /api/receipts/{id}?verify=1); the prototype trusts it
        pass = true;
      } else if (s.kind === "file") {
        const a = v.artifacts.find((x) => x.key === s.key);
        const text =
          tampered && a.key === "tests" ? a.content.replace("214 passed (214)", "213 passed (214)") : a.content;
        got = await sha256Hex(text);
        hashes.push(got);
        pass = got === s.want;
      } else if (s.kind === "digest") {
        got = await sha256Hex(receiptDigestInput(Object.assign({}, v.canon, { artifacts: hashes.map((sha256) => ({ sha256 })) })));
        pass = got === s.want;
      } else if (s.kind === "ships") {
        pass = v.target.commit === v.commit;
        got = v.target.commit;
      }
      ok = ok && pass;
      // the work itself takes a millisecond or two; the short pause is only so you can watch each line pass
      const ms = Math.max(1, Math.round(performance.now() - a0));
      work += ms;
      await pause();
      put(i, { state: pass ? "pass" : "fail", got, ms });
    }
    if (id !== live.current) return;
    setRun({ tampered, steps: state.slice(), done: true, ok, ms: work });
    if (!tampered) v.onChecked(ok);
  };

  // the receipt's line that a step is about lights up while it's checked
  const runningKey = run && !run.done ? (run.steps.find((s) => s.state === "run") || {}).key : null;
  const failed = run && run.done && !run.ok;
  const sealed = run && run.done && run.ok;
  const bars = barcode(v.hex);

  return (
    <div className="rcp" data-checked={sealed ? "true" : failed ? "fail" : undefined}>
      <div className="rcp-grid">
        {/* ------------------------------------------------ the receipt itself */}
        <div className="rcp-paper-wrap">
          <article
            className="rcp-paper"
            aria-labelledby="rcp-title"
            data-tampered={run && run.tampered ? "true" : undefined}
          >
            <header className="rcp-top">
              <span className="rcp-mark" aria-hidden="true">
                A
              </span>
              <span className="rcp-brand">AVEL · avelco.dev</span>
              <h2 id="rcp-title" className="rcp-title">
                Receipt <span className="kb-mono">{v.id}</span>
              </h2>
              <p className="rcp-for">
                {v.mission} · {v.client}
              </p>
              <p className="rcp-when">Issued {v.issued}</p>
            </header>

            <Section title="What ships" hot={runningKey === "ships"}>
              <Row k="Commit" v={<b className="kb-mono rcp-commit">{v.commit}</b>} />
              <Row k="To" v={<span className="kb-mono">{v.target.repo}</span>} />
              <Row k="Branch" v={<span className="kb-mono">{v.target.branch}</span>} />
              <Row k="Plan" v={v.plan} hot={runningKey === "plan"} />
            </Section>

            <Section title="Modules">
              {v.modules.map((m) => (
                <Row
                  key={m.key}
                  k={
                    <>
                      <span className="kb-mono rcp-ref">{m.ref}</span> {m.name}
                    </>
                  }
                  v={
                    <span className="rcp-ok">
                      {m.tests} {I("check", 12)}
                    </span>
                  }
                  dots
                />
              ))}
            </Section>

            {v.inputs ? (
              <Section
                title={"Inputs" + (v.inputs.pub ? " · public view" : "")}
                after={
                  <div className="lib-seg rcp-view" role="radiogroup" aria-label="Who the receipt is for">
                    <button type="button" className="lib-seg-btn" role="radio" aria-checked={!v.inputs.pub} onClick={v.inputs.setPub(false)}>
                      Your view
                    </button>
                    <button type="button" className="lib-seg-btn" role="radio" aria-checked={!!v.inputs.pub} onClick={v.inputs.setPub(true)}>
                      Public view
                    </button>
                  </div>
                }
              >
                {v.inputs.pub ? (
                  <>
                    <Row k="Files" v={v.inputs.count} dots />
                    {v.inputs.rows.map((x, i) => (
                      <Row key={x.key} k={"File " + (i + 1)} v={<span className="kb-mono">{x.hash}</span>} dots />
                    ))}
                  </>
                ) : (
                  v.inputs.rows.map((x) => (
                    <Row
                      key={x.key}
                      k={
                        <span className="rcp-in-k">
                          <a href={x.href}>{x.name}</a> <span className="kb-mono rcp-ref">{x.version}</span>
                          <small>{x.dest}</small>
                        </span>
                      }
                      v={<span className="kb-mono">{x.hash}</span>}
                      dots
                    />
                  ))
                )}
              </Section>
            ) : null}

            <Section title="Gates">
              {v.gates.map((g) => (
                <Row
                  key={g.key}
                  k={
                    <>
                      <span className="kb-mono rcp-ref">{g.n}</span> {g.name}
                    </>
                  }
                  v={
                    <span className="rcp-ok">
                      {g.at} {I("check", 12)}
                    </span>
                  }
                  dots
                />
              ))}
            </Section>

            <Section
              title="Proof"
              after={
                <>
                  {v.accepted.map((a) => (
                    <div key={a.key} className="rcp-accepted">
                      <span>
                        Accepted, not fixed:{" "}
                        <a href={a.href} className="kb-mono">
                          {a.ref}
                        </a>{" "}
                        {a.title}
                      </span>
                      <span className="rcp-reason">“{a.reason}”</span>
                    </div>
                  ))}
                </>
              }
            >
              <Row k="Tests" v={v.tests} hot={runningKey === "tests"} fail={failed && run.tampered} dots />
              <Row k="Acceptance examples" v={v.acceptance} hot={runningKey === "accept"} dots />
              <Row k="Security review" v="0 open" hot={runningKey === "security"} dots />
              <Row k="Accessibility" v="0 open" hot={runningKey === "a11y"} dots />
            </Section>

            <Section title="The split">
              {v.split.map((x) => (
                <Row key={x.key} k={x.k} v={x.v} dots />
              ))}
            </Section>

            <div
              className="rcp-total"
              data-tone={v.verdictTone}
              data-hot={runningKey === "digest" ? "true" : undefined}
            >
              <span>Verdict</span>
              <b>{v.verdict}</b>
              {sealed || failed ? (
                <div className="rcp-stamp" data-fail={failed ? "true" : undefined} aria-hidden="true">
                  <svg viewBox="0 0 200 200">
                    <defs>
                      <path id="rcp-ring" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
                    </defs>
                    <circle cx="100" cy="100" r="92" />
                    <circle cx="100" cy="100" r="62" />
                    <text className="rcp-stamp-ring">
                      <textPath href="#rcp-ring" startOffset="0">
                        {failed
                          ? "DOES NOT MATCH · CHECKED ON THIS DEVICE · "
                          : "CHECKED ON THIS DEVICE · " + v.id + " · "}
                      </textPath>
                    </text>
                    <text x="100" y="96" className="rcp-stamp-big">
                      {failed ? "STOP" : "PROVEN"}
                    </text>
                    <text x="100" y="122" className="rcp-stamp-small">
                      {failed ? "digests differ" : v.issuedDay}
                    </text>
                  </svg>
                </div>
              ) : null}
            </div>
            <p className="rcp-verdict-note">{v.verdictNote}</p>

            <figure className="rcp-code" aria-label={"Receipt digest sha256 " + v.hex}>
              <svg viewBox={"0 0 " + bars.w + " 40"} preserveAspectRatio="none" aria-hidden="true">
                {bars.rects.map((r, i) => (
                  <rect key={i} x={r.x} y="0" width={r.w} height="40" />
                ))}
              </svg>
              <figcaption className="kb-mono">sha256 {short(v.hex)}</figcaption>
            </figure>
            <p className="rcp-sig">
              Signed by {v.signature.by} · <span className="kb-mono">{v.signature.key}</span> · {v.signature.alg}
            </p>
          </article>
        </div>

        {/* ------------------------------------------------ the proof check */}
        <aside className="rcp-check lib-card" aria-labelledby="rcp-check-h">
          <div className="rcp-check-head">
            <span className="rcp-check-icon" aria-hidden="true">
              {I("shield-check", 20)}
            </span>
            <div>
              <h2 id="rcp-check-h">Check the proof yourself</h2>
              <p>
                This recomputes every digest here, on your device. If one byte of a proof file changed, the receipt
                stops matching.
              </p>
            </div>
          </div>

          <ol className="rcp-steps" aria-live="polite">
            {steps.map((s, i) => {
              const st = run ? run.steps[i] : { state: "idle" };
              return (
                <li key={s.key} data-state={st.state}>
                  <span className="rcp-step-i" aria-hidden="true">
                    {st.state === "pass" ? I("check", 14) : st.state === "fail" ? I("x", 14) : <i />}
                  </span>
                  <span className="rcp-step-main">
                    <span className="rcp-step-l">{s.label}</span>
                    <span className="rcp-step-sub">{s.sub}</span>
                    {s.want && st.got ? (
                      <span className="rcp-step-hash kb-mono">
                        {st.state === "fail" ? (
                          <>
                            got {short(st.got)} · receipt says {short(s.want)}
                          </>
                        ) : (
                          <>{short(st.got)} matches</>
                        )}
                      </span>
                    ) : null}
                  </span>
                  <span className="rcp-step-ms kb-mono">
                    {st.state === "pass" || st.state === "fail"
                      ? s.kind === "sig"
                        ? "server"
                        : st.ms + " ms"
                      : st.state === "run"
                        ? "…"
                        : ""}
                  </span>
                  <span className="sr-only">
                    {st.state === "pass"
                      ? "passed"
                      : st.state === "fail"
                        ? "failed"
                        : st.state === "run"
                          ? "checking"
                          : ""}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="rcp-result" role="status">
            {sealed ? (
              <p data-tone="ok">
                {I("check", 16)}
                All {steps.length} checks passed in {run.ms} ms. This is exactly what {v.client} gets.
              </p>
            ) : failed ? (
              <p data-tone="fail">
                {I("x", 16)}
                {run.tampered
                  ? "The tampered copy fails, as it should: the test report changed, so its digest and the receipt's digest no longer match."
                  : "The proof doesn't match the receipt. Don't release; open a finding."}
              </p>
            ) : v.checked && !run ? (
              <p>Last checked here {v.checked.at}.</p>
            ) : (
              <p>Takes about a second. Nothing is sent anywhere.</p>
            )}
          </div>

          <div className="rcp-actions">
            <button
              type="button"
              className="av-btn"
              data-variant="primary"
              onClick={() => check(false)}
              disabled={busy || undefined}
            >
              {I(sealed && !run.tampered ? "refresh-cw" : "shield-check", 16)}
              {busy ? "Checking…" : sealed && !run.tampered ? "Check again" : "Check the proof"}
            </button>
            {v.pass ? (
              <a className="av-btn" data-variant="secondary" href={v.pass.href}>
                Approve the pass
              </a>
            ) : (
              <a className="av-btn" data-variant="secondary" href={v.releaseHref}>
                {v.released ? "See the release" : "Go to Release"}
              </a>
            )}
          </div>
          <button type="button" className="rcp-tamper" onClick={() => check(true)} disabled={busy || undefined}>
            Try it on a tampered copy
          </button>
          <p className="rcp-proto">
            Prototype: the digests are real SHA-256 over the sample proof files. The signature check is the server's
            job.
          </p>
        </aside>
      </div>

      {/* ------------------------------------------------ the proof files */}
      <section className="rcp-files" aria-labelledby="rcp-files-h">
        <div className="tpd-h-row">
          <h2 className="tpd-h" id="rcp-files-h">
            The proof files
          </h2>
          <span className="tpd-h-note">What each line of the receipt rests on</span>
        </div>
        <div className="rcp-files-grid">
          <div className="rcp-file-list" role="tablist" aria-label="Proof files" aria-orientation="vertical">
            {v.artifacts.map((a) => (
              <button
                key={a.key}
                type="button"
                role="tab"
                aria-selected={String(open === a.key)}
                aria-controls="rcp-file"
                className="rcp-file"
                onClick={() => setOpen(a.key)}
              >
                <span className="rcp-file-l">{a.label}</span>
                <span className="rcp-file-p">{a.proves}</span>
                <span className="rcp-file-h kb-mono">{a.short}</span>
              </button>
            ))}
          </div>
          <div id="rcp-file" role="tabpanel" className="rcp-file-view">
            {v.artifacts
              .filter((a) => a.key === open)
              .map((a) => (
                <CodeBlock
                  key={a.key}
                  code={a.content}
                  title={a.file}
                  lang={a.lang}
                  numbered
                  caption={"sha256 " + a.sha}
                />
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Section({ title, children, hot, after }) {
  return (
    <section className="rcp-sec" data-hot={hot ? "true" : undefined}>
      <h3>{title}</h3>
      <dl>{children}</dl>
      {after || null}
    </section>
  );
}

function Row({ k, v, dots, hot, fail }) {
  return (
    <div
      className="rcp-row"
      data-dots={dots ? "true" : undefined}
      data-hot={hot ? "true" : undefined}
      data-fail={fail ? "true" : undefined}
    >
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

/** A barcode drawn from the digest: each hex digit sets a bar's width, so two receipts never look alike. */
function barcode(hex) {
  const rects = [];
  let x = 0;
  for (const ch of hex) {
    const n = parseInt(ch, 16);
    const w = 1 + (n % 4);
    rects.push({ x, w });
    x += w + 1 + ((n >> 2) % 3);
  }
  return { rects, w: x };
}
