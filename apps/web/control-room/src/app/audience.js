// A project's kind (contract 1.0.0, CR-W22): `client`, `internal` (AVEL's own software) or `template`
// (an internal template build). It's null until Canon's first question, Q-0.1a, is answered, must be
// set before the mission leaves onboarding, and freezes once the plan is approved. A "Client project"
// answer opens Q-0.1b, for which client. Until then the project belongs to nobody, and the screens say
// so. (The prototype called this field `audience` before 1.0.0; the contract named it `kind`.)

const TEMPLATE_WORDS = /\b(template|starter|boilerplate)\b/i;
const INTERNAL_WORDS = /\b(internal|template|starter|avel|ours|our own|in-house|tool)\b/i;

const doneOf = (dec, ref) => {
  const x = (dec || {})[ref] || {};
  return x.state === "decided" ? x : null;
};

/** A question gated on an earlier answer (`after: { ref, choice }`) shows only once that answer is in. */
export function gateOpen(d, dec) {
  if (!d || !d.after) return true;
  const x = doneOf(dec, d.after.ref);
  // an answer in your own words already says who (a client's name, or "internal"), so nothing follows it
  return !!x && x.choice === d.after.choice;
}

function answerOf(decs, code, dec) {
  const d = decs.find((y) => y.code === code);
  const x = d && doneOf(dec, d.ref);
  if (!x) return null;
  return { d, choice: x.choice, text: x.choice === "other" ? (x.answer || "").trim() : null };
}

export const KIND_WORD = { client: "Client project", internal: "Internal tool", template: "Internal template" };

/**
 * The mission as the screens should show it, with Canon's answers layered on.
 * kind: "client" | "internal" | "template" | null (not answered yet)
 * forLabel: "Internal template", "Internal tool", the client's name, or null
 */
export function withAudience(m, decs0, dec, clients) {
  // this project's own questions only (each project has its own Q-0.1a)
  const decs = (decs0 || []).filter((d) => !d.missionId || d.missionId === m.id);
  let kind = m.kind !== undefined ? m.kind : m.audience || null,
    clientName = m.clientName || null,
    clientId = m.clientId || null,
    fresh = false;
  if (!kind) {
    const a = answerOf(decs, "Q-0.1a", dec);
    if (a) {
      fresh = true;
      if (a.choice === "template" || a.choice === "internal" || a.choice === "client") kind = a.choice;
      else if (a.choice === "other" && TEMPLATE_WORDS.test(a.text)) kind = "template";
      else if (a.choice === "other" && INTERNAL_WORDS.test(a.text)) kind = "internal";
      else if (a.choice === "other" && a.text) {
        kind = "client";
        clientName = a.text;
      }
    }
    if (kind === "client" && !clientName) {
      const b = answerOf(decs, "Q-0.1b", dec);
      if (b)
        clientName = b.choice === "other" ? b.text : (b.d.options.find((o) => o.key === b.choice) || {}).label || null;
    }
    if (clientName && !clientId) {
      const hit = (clients || []).find((c) => c.name.toLowerCase() === clientName.toLowerCase());
      clientId = hit ? hit.id : null;
    }
  }
  const internal = kind === "internal" || kind === "template";
  const internalClient = (clients || []).find((c) => c.kind === "internal");
  return Object.assign({}, m, {
    kind,
    internal,
    template: kind === "template",
    clientName: internal ? (internalClient && internalClient.name) || "AVEL" : clientName,
    clientId: internal ? (internalClient && internalClient.id) || clientId : clientId,
    // what every screen prints where it used to print the client's name
    forLabel: internal ? KIND_WORD[kind] : clientName,
    audienceFresh: fresh || undefined,
    audienceOpen: !kind || (kind === "client" && !clientName) ? true : undefined,
  });
}

/** One line for the brief's "What it is" section. */
export function audienceLine(m) {
  if (m.kind === "template")
    return "Internal template: AVEL’s own starter, not client work. You own the acceptance examples, it ships to avel/templates, and once it’s delivered with a verified receipt you publish it to Templates for client projects to start from.";
  if (m.kind === "internal")
    return "Internal tool: AVEL’s own software, built like a client project with you as the client. It ships to an AVEL repo and stays out of Clients.";
  if (m.kind === "client" && m.clientName)
    return (
      "A client project for " +
      m.clientName +
      ". Their rules and knowledge apply, they own the acceptance examples, and it ships to their repo. It can start from a template."
    );
  if (m.kind === "client") return "A client project. Canon asks which client next.";
  return null;
}
