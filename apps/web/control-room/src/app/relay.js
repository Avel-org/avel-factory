/**
 * The relay line's preview: a quick local guess at what Canon will propose from what you typed,
 * shown while you type so you never send blind. It runs on your device in well under a frame, so
 * there's no round trip. Canon still decides after you send; the backend writes the facts
 * (CR-W19 §6).
 */

const SPEAKER = /^([A-Z][a-zA-Z'-]{1,20})(?:\s+said)?\s*:\s*(.*)$/;
const RISKY = /\b(risk|worried|worry|concern|careful|might break|afraid|unless|break)\b/i;
const CHATTER = /^(just got off|got off|just spoke|spoke to|hi|hey|thanks|thank you|ok|okay)\b.{0,48}$/i;

/** Split "you" text from what a client said: "Dale said: …", "Dale: …" or a quote in “marks”. */
export function parseRelay(text, asClient, clientName) {
  const t = (text || "").trim();
  if (!t) return [];
  const parts = t
    .split(/(?<=[.!?])\s+(?=[A-Z“"])/)
    .map((x) => x.trim())
    .filter(Boolean);
  const out = [];
  for (const p of parts) {
    let who = asClient ? clientName || "Client" : "You";
    let body = p;
    const m = p.match(SPEAKER);
    if (m && m[1] !== "You" && m[1] !== "I") {
      who = m[1];
      body = m[2];
    } else if (/^[“"].+[”"]$/.test(p)) {
      who = clientName || "Client";
    }
    body = body.replace(/^[“"]\s*|\s*[”"]$/g, "").trim();
    if (!body) continue;
    const words = body.split(/\s+/).length;
    const tone = /\?$/.test(body)
      ? "ask"
      : who === "You" && (CHATTER.test(body) || words < 3)
        ? "note"
        : RISKY.test(body)
          ? "risk"
          : "fact";
    out.push({ key: out.length + ":" + body.slice(0, 16), who, relayed: who !== "You", tone, text: body });
  }
  return out;
}

const LABEL = { fact: "Fact", risk: "Risk", ask: "Question for Canon", note: "Context", answer: "Answer" };

/** What the preview row shows: one chip per thing Canon is likely to propose. */
export function previewChips(text, opts) {
  const o = opts || {};
  const items = parseRelay(text, o.asClient, o.clientName);
  const chips = items
    .filter((x) => x.tone !== "note")
    .map((x) => ({
      key: x.key,
      tone: o.answerTo ? "answer" : x.tone,
      label: o.answerTo ? "Answers " + o.answerTo : LABEL[x.tone],
      src: x.relayed ? x.who + ", relayed" : "You said",
      relayed: x.relayed ? "true" : undefined,
      text: x.text.length > 64 ? x.text.slice(0, 61) + "…" : x.text,
      to: x.tone === "ask" ? null : x.tone === "risk" ? o.feeds + " risks" : o.feeds,
    }));
  return {
    chips: o.answerTo ? chips.slice(0, 1) : chips.slice(0, 3),
    more: !o.answerTo && chips.length > 3 ? chips.length - 3 : 0,
    relayed: items.some((x) => x.relayed),
    who: (items.find((x) => x.relayed) || {}).who || null,
    contextOnly: items.length > 0 && chips.length === 0,
  };
}

/** A sample call for hold to relay. The prototype has no microphone; the real one streams speech to text. */
export const SAMPLE_CALL =
  "Just got off the phone with Dale. Dale said: keep the old texts running for a week, dispatchers still rely on them.";
