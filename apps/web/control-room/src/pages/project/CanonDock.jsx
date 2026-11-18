import { useEffect, useMemo, useRef, useState } from "react";
import { previewChips, SAMPLE_CALL } from "../../app/relay.js";

/**
 * How you talk to Canon. One dock with three ways in:
 *   - the deck: Canon's open questions, one card at a time, answered in one tap (or 1, 2, 3)
 *   - the relay line: your words, or the client's through you, with a preview of the facts
 *     Canon will likely propose before you send
 *   - hold to relay: talk straight after a client call, then review what was heard before sending
 * What you type stays in this component, so typing never re-renders the control room.
 */
// noClient: an internal project has no client to quote, so the source toggle and hold to relay are hidden
export function CanonDock({ ch, I, clientName, noClient }) {
  const deck = ch.deck || [];
  const busy = ch.status !== "ready";
  const [mode, setMode] = useState(deck.length ? "card" : "line");
  const [folded, setFolded] = useState(false);
  const [text, setText] = useState("");
  const [asClient, setAsClient] = useState(false);
  const [answerTo, setAnswerTo] = useState(null);
  const [voice, setVoice] = useState(null);
  const root = useRef(null);
  const ta = useRef(null);
  const hadFocus = useRef(false);
  const card = mode === "card" && deck.length ? deck[0] : null;
  const showLine = !card;

  // the field grows with what you write, one line up to six
  useEffect(() => {
    const t = ta.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = Math.min(t.scrollHeight, 6 * 24 + 16) + "px";
  }, [text, showLine]);

  // the deck emptied while you were on it: go to the line, keep focus with you
  useEffect(() => {
    if (!deck.length && mode === "card") setMode("line");
  }, [deck.length, mode]);

  // after an answer the next card arrives; if you were in the dock, focus comes with it
  const front = card ? card.ref : null;
  useEffect(() => {
    if (!hadFocus.current || !root.current) return;
    const el = root.current.querySelector(card ? ".cd-opt" : "textarea");
    if (!el) return;
    el.focus({ preventScroll: true });
    // a first letter typed on the card is already in the field: keep the caret after it
    if (el.tagName === "TEXTAREA") el.setSelectionRange(el.value.length, el.value.length);
  }, [front, mode]);
  const noteFocus = () => {
    hadFocus.current = !!(root.current && root.current.contains(document.activeElement));
  };

  const preview = useMemo(
    () => previewChips(text, { asClient, clientName, answerTo, feeds: ch.feeds }),
    [text, asClient, clientName, answerTo, ch.feeds],
  );

  const openLine = (ref, first) => {
    hadFocus.current = true;
    setAnswerTo(ref || null);
    if (first != null) setText(first);
    setMode("line");
    setFolded(false);
  };
  // "In your words" from a margin note opens the line here, answering that question
  const ask = ch.compose;
  useEffect(() => {
    // B5: "Rewrite a section" opens the line with a starter, so a rewrite is one sentence to Canon
    if (!(ask && (ask.ref || ask.first) && Date.now() - ask.at < 4000)) return;
    openLine(ask.ref || null, ask.first);
    // the line may already be open (no questions waiting), so the mode change won't move focus: do it here
    requestAnimationFrame(() => {
      const el = root.current && root.current.querySelector("textarea");
      if (!el) return;
      el.focus({ preventScroll: true });
      el.setSelectionRange(el.value.length, el.value.length);
    });
  }, [ask && ask.at]);
  const backToDeck = () => {
    hadFocus.current = true;
    setAnswerTo(null);
    if (deck.length) setMode("card");
  };
  const send = (e) => {
    if (e) e.preventDefault();
    if (busy) return;
    const ok = ch.send({
      text,
      relayed: asClient || preview.relayed,
      who: asClient ? clientName : preview.who,
      answerTo,
    });
    if (!ok) return;
    noteFocus();
    setText("");
    setAsClient(false);
    setAnswerTo(null);
    // after an answer, the next question comes up; after a remark, you stay on the line to keep talking
    if (answerTo && deck.filter((d) => d.ref !== answerTo).length) setMode("card");
  };

  const onCardKey = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || !card) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= card.options.length) {
      e.preventDefault();
      noteFocus();
      card.options[n - 1].pick();
    } else if (n === card.options.length + 1) {
      e.preventDefault();
      openLine(card.ref);
    } else if (e.key.length === 1 && /\S/.test(e.key) && !/[0-9]/.test(e.key)) {
      // just start typing: the card becomes your answer in your own words
      e.preventDefault();
      openLine(card.ref, e.key);
    }
  };
  const onLineKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) return send(e);
    if (e.key === "Escape") {
      e.preventDefault();
      if (answerTo || deck.length) backToDeck();
      else e.currentTarget.blur();
    }
    if (e.key === "Backspace" && !text && asClient) {
      e.preventDefault();
      setAsClient(false);
    }
  };
  const onLineChange = (e) => {
    const v = e.target.value;
    // a quote mark first means "the client said"; it switches the source and isn't kept
    if (!noClient && !text && !asClient && (v === '"' || v === "“")) {
      setAsClient(true);
      return;
    }
    setText(v);
  };

  // ------------------------------------------------------------ hold to relay
  const vt = useRef({});
  const stopVoice = (keep) => {
    offWin();
    const v = vt.current;
    clearInterval(v.words);
    clearInterval(v.clock);
    const heard = v.heard || "";
    vt.current = {};
    setVoice(null);
    if (keep && heard.trim()) {
      hadFocus.current = true;
      setText((t) => (t ? t + " " : "") + heard.trim());
      setAsClient(false);
      setMode("line");
    }
  };
  const startVoice = (how) => {
    if (vt.current.on) return;
    const words = SAMPLE_CALL.split(" ");
    let i = 0;
    vt.current = { on: true, how, heard: "", t0: Date.now(), x0: null };
    try {
      if (navigator.vibrate) navigator.vibrate(8);
    } catch (e) {
      /* no haptics here */
    }
    setVoice({ how, heard: "", secs: 0, cancel: false });
    // not a fetch: the mock's stand-in for route 106's streamed transcript
    vt.current.words = setInterval(() => {
      i = Math.min(words.length, i + 1);
      vt.current.heard = words.slice(0, i).join(" ");
      setVoice((v) => (v ? Object.assign({}, v, { heard: vt.current.heard }) : v));
      if (i >= words.length) clearInterval(vt.current.words);
    }, 110);
    // not a fetch: the recording clock
    vt.current.clock = setInterval(() => {
      setVoice((v) => (v ? Object.assign({}, v, { secs: Math.round((Date.now() - vt.current.t0) / 1000) }) : v));
    }, 500);
  };
  // holding: listen on the window, so the press survives the dock swapping to the voice view
  function offWin() {
    const v = vt.current;
    if (v.mv) window.removeEventListener("pointermove", v.mv);
    if (v.up) window.removeEventListener("pointerup", v.up);
    if (v.cx) window.removeEventListener("pointercancel", v.cx);
  }
  const micDown = (e) => {
    if (e.button !== 0 || busy) return;
    e.preventDefault();
    if (vt.current.on) {
      if (vt.current.how === "tap") stopVoice(true);
      return;
    }
    startVoice("hold");
    const x0 = e.clientX,
      down = Date.now();
    const mv = (ev) => {
      const cancel = ev.clientX - x0 < -72;
      setVoice((s0) => (s0 && s0.cancel !== cancel ? Object.assign({}, s0, { cancel }) : s0));
    };
    const up = (ev) => {
      offWin();
      if (Date.now() - down < 280) {
        // a quick tap: keep listening until the next tap (works without holding: a mouse, a switch)
        vt.current.how = "tap";
        setVoice((s0) => (s0 ? Object.assign({}, s0, { how: "tap", cancel: false }) : s0));
        return;
      }
      stopVoice(!(ev.clientX - x0 < -72));
    };
    const cx = () => {
      offWin();
      stopVoice(false);
    };
    Object.assign(vt.current, { mv, up, cx });
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cx);
  };
  const micKey = (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    if (vt.current.on) stopVoice(true);
    else startVoice("tap");
  };
  useEffect(() => {
    if (!voice) return;
    const k = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        stopVoice(false);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [!!voice]);
  useEffect(() => () => stopVoice(false), []);

  const mic = (big) =>
    noClient && !big ? null : (
      <button
        type="button"
        className="cd-mic"
        data-big={big ? "true" : undefined}
        data-on={voice ? "true" : undefined}
        aria-label={voice ? "Stop and review" : "Hold to relay a call, or press to start"}
        aria-pressed={voice ? "true" : "false"}
        disabled={busy || undefined}
        onPointerDown={micDown}
        onKeyDown={micKey}
        onClick={(e) => e.preventDefault()}
      >
        {I("mic", big ? 20 : 16)}
      </button>
    );

  const sendBtn = () => (
    <button
      type={busy ? "button" : "submit"}
      className="cd-send"
      data-mode={busy ? "stop" : "send"}
      aria-label={busy ? "Stop Canon" : "Send to Canon"}
      onClick={busy ? ch.stop : undefined}
      disabled={!busy && !text.trim() ? true : undefined}
    >
      <span className="cd-swap" aria-hidden="true">
        <span className="cd-swap-a">{I("arrow-up", 16)}</span>
        <span className="cd-swap-b">
          <i></i>
        </span>
      </span>
    </button>
  );

  return (
    <div
      className="cd"
      ref={root}
      data-mode={voice ? "voice" : card ? "card" : "line"}
      data-busy={busy ? "true" : undefined}
      onFocus={() => (hadFocus.current = true)}
      onBlur={(e) => {
        if (e.relatedTarget && !root.current.contains(e.relatedTarget)) hadFocus.current = false;
      }}
    >
      {ch.undo ? (
        <div className="cd-undo" role="status" key={ch.undo.key}>
          {I("check", 14)}
          <span className="cd-undo-t">{ch.undo.text}</span>
          <button type="button" className="cd-link" onClick={ch.undo.undo}>
            Undo · {ch.undo.left}s
          </button>
        </div>
      ) : null}
      {busy && card ? (
        <div className="cd-strip" role="status">
          <span className="cd-strip-dot" aria-hidden="true"></span>
          Canon is writing
          <button type="button" className="cd-link" onClick={ch.stop}>
            Stop
          </button>
        </div>
      ) : null}

      {voice ? (
        <div className="cd-voice" data-cancel={voice.cancel ? "true" : undefined} role="status" aria-live="polite">
          <div className="cd-voice-top">
            <span className="cd-rec" aria-hidden="true"></span>
            <span className="kb-mono">0:{String(voice.secs).padStart(2, "0")}</span>
            <span className="cd-wave" aria-hidden="true">
              {Array.from({ length: 14 }, (_, i) => (
                <i key={i} style={{ "--i": i }}></i>
              ))}
            </span>
            <span className="cd-voice-hint">
              {voice.cancel
                ? "Let go to cancel"
                : voice.how === "hold"
                  ? "Release to review · slide left to cancel"
                  : "Tap the mic to stop · Esc cancels"}
            </span>
          </div>
          <p className="cd-heard">{voice.heard || "Listening…"}</p>
          <p className="cd-proto">Prototype: plays a sample call. Nothing is sent until you review it.</p>
          <div className="cd-voice-mic">{mic(true)}</div>
        </div>
      ) : card ? (
        <div className="cd-deck" data-n={Math.min(deck.length - 1, 2)} data-folded={folded ? "true" : undefined}>
          {folded ? (
            <div className="cd-bar">
              <span className="cd-bar-dot" data-blocking={card.blocking} aria-hidden="true"></span>
              <span className="cd-bar-text">
                {deck.length === 1 ? "1 question" : deck.length + " questions"} from Canon
                <span className="cd-bar-next">
                  {" · "}
                  {card.ref} {card.blocking ? "blocks " + ch.feeds : ""}
                </span>
              </span>
              <button type="button" className="cd-link" onClick={() => setFolded(false)}>
                Show
              </button>
              {mic(false)}
            </div>
          ) : (
            <section
              className="cd-card"
              key={card.ref}
              data-blocking={card.blocking}
              aria-labelledby={"cd-q-" + card.ref}
              onKeyDown={onCardKey}
            >
              <div className="cd-card-top">
                <span className="kb-mono cd-ref">{card.ref}</span>
                <span className="cd-subj" data-blocking={card.blocking}>
                  {card.blocks}
                </span>
                <span className="cd-pos">{card.pos}</span>
                <button
                  type="button"
                  className="cd-icon"
                  aria-label="Fold the questions away"
                  aria-expanded="true"
                  onClick={() => setFolded(true)}
                >
                  {I("chevron-down", 16)}
                </button>
              </div>
              <p className="cd-q" id={"cd-q-" + card.ref}>
                {card.title}
              </p>
              {card.why ? <p className="cd-why">{card.why}</p> : null}
              <div className="cd-opts" role="group" aria-label={"Answers to " + card.ref}>
                {card.options.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    className="cd-opt"
                    data-rec={o.rec}
                    onClick={() => {
                      noteFocus();
                      o.pick();
                    }}
                  >
                    <kbd className="cd-n" aria-hidden="true">
                      {o.n}
                    </kbd>
                    <span className="cd-opt-main">
                      <span className="cd-opt-l">
                        {o.label}
                        {o.rec ? <span className="cd-rec-tag">Recommended</span> : null}
                      </span>
                      <span className="cd-then">{o.then}</span>
                    </span>
                  </button>
                ))}
                <button type="button" className="cd-opt cd-own" onClick={() => openLine(card.ref)}>
                  <kbd className="cd-n" aria-hidden="true">
                    {card.options.length + 1}
                  </kbd>
                  <span className="cd-opt-main">
                    <span className="cd-opt-l">Answer in your words</span>
                  </span>
                  <span className="cd-hint" aria-hidden="true">
                    or just start typing
                  </span>
                </button>
              </div>
              <div className="cd-card-foot">
                {card.skip ? (
                  <button
                    type="button"
                    className="cd-link"
                    onClick={() => {
                      noteFocus();
                      card.skip();
                    }}
                  >
                    Skip for now
                  </button>
                ) : null}
                <button type="button" className="cd-link" onClick={() => openLine(null)}>
                  Tell Canon something else
                </button>
                {mic(false)}
              </div>
            </section>
          )}
        </div>
      ) : (
        <form className="cd-line" onSubmit={send} data-client={asClient ? "true" : undefined}>
          <div className="cd-ctx">
            {noClient ? null : (
              <button
                type="button"
                className="cd-who"
                aria-pressed={asClient ? "true" : "false"}
                aria-label={
                  asClient
                    ? (clientName || "Client") + ", through you. Switch to your words"
                    : "You. Switch to the client's words"
                }
                onClick={() => {
                  setAsClient(!asClient);
                  if (ta.current) ta.current.focus();
                }}
              >
                <span className="cd-swap" aria-hidden="true">
                  <span className="cd-who-a">{I("user", 14)}</span>
                  <span className="cd-who-b">{I("quote", 14)}</span>
                </span>
                <span>{asClient ? clientName || "Client" : "You"}</span>
              </button>
            )}
            {answerTo ? (
              <>
                <span className="cd-ctx-t">
                  Answering <span className="kb-mono">{answerTo}</span>
                </span>
                <button type="button" className="cd-link" onClick={backToDeck}>
                  Back to the question
                </button>
              </>
            ) : deck.length ? (
              <>
                <span className="cd-ctx-t">
                  {deck.length === 1 ? "1 question" : deck.length + " questions"} waiting
                </span>
                <button type="button" className="cd-link" onClick={backToDeck}>
                  Show
                </button>
              </>
            ) : (
              <span className="cd-ctx-t">Feeds {ch.feeds}</span>
            )}
          </div>
          <div className="cd-row">
            <textarea
              ref={ta}
              rows={1}
              value={text}
              onChange={onLineChange}
              onKeyDown={onLineKey}
              aria-label={answerTo ? "Answer " + answerTo + " in your words" : "Message to Canon"}
              aria-describedby="cd-preview"
              placeholder={
                answerTo
                  ? "Answer in your words"
                  : asClient
                    ? "What did " + (clientName || "the client") + " say?"
                    : noClient
                      ? "Tell Canon"
                      : "Tell Canon, or type “ to quote"
              }
              enterKeyHint="send"
            />
            {mic(false)}
            {sendBtn()}
          </div>
          <div className="cd-preview" id="cd-preview" aria-live="polite">
            {preview.chips.length ? (
              <>
                <span className="cd-pv-k">Canon will likely propose</span>
                <ul className="cd-chips">
                  {preview.chips.map((c) => (
                    <li key={c.key} className="cd-chip" data-tone={c.tone} data-relayed={c.relayed}>
                      <span className="cd-chip-k">{c.label}</span>
                      <span className="cd-chip-t">{c.text}</span>
                      <span className="cd-chip-s">
                        {c.src}
                        {c.to ? " · to " + c.to : ""}
                      </span>
                    </li>
                  ))}
                  {preview.more ? <li className="cd-chip-more">+{preview.more} more</li> : null}
                </ul>
              </>
            ) : preview.contextOnly ? (
              <span className="cd-pv-k">Context for Canon. Nothing new to propose yet.</span>
            ) : (
              <span className="cd-pv-k">What Canon will likely propose shows here as you type.</span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
