// CR-34, "One upload inbox" (proposed, revision 2): the upload tray, the drop target, Drive, the filing
// sheet, the file page, and what every other screen shows about files. Sample data only (src/mock/uploads.json):
// CR-34's routes aren't in contract-mock yet. Field names follow CR-34 (StatusDto.inboxCount, uploads.state,
// scanStatus, link state waiting | active | refused | removed) so the frontend can wire them without renaming.
//
// Files are untrusted. The web never reads a dropped file's bytes, never renders a file inline, and shows names
// as text. Previews are a type icon (the server's bitmap thumbnail when it exists). "Open" means download.
import UP from "../mock/uploads.json";
import { fmtDate, fmtTime } from "../lib/format";

const NOW = Date.parse(UP.asOf);
const DAY = 86400000;
const LIMIT = { video: 2 * 1024 ** 3, other: 200 * 1024 ** 2 };
const KEEP_DAYS = 14;
const SOON_DAYS = 10;
const SENDER = { you: "You", osa: "OSA", avel_os: "Avel OS" };
// CR-29: with OSA's flag off nothing names it, so what it sent for you shows as yours
const who = (logic, k) => (k === "osa" && !logic.state.osa ? "you" : k);
const KIND = {
  image: ["image", "Image"],
  pdf: ["file-text", "PDF"],
  doc: ["file-text", "Document"],
  text: ["file-text", "Text"],
  data: ["file-spreadsheet", "Data"],
  json: ["file-json", "Data"],
  archive: ["file-archive", "Archive"],
  video: ["film", "Video"],
  audio: ["music", "Audio"],
  folder: ["folder", "Folder"],
  other: ["file", "File"],
};
const DEST_KINDS = [
  ["client", "Client", "A brand kit or client file every project of theirs can use"],
  ["mission", "Project", "A source for planning"],
  ["module", "Module", "On its agents’ reading list"],
  ["library", "Library", "A change for review"],
  ["repo", "Repo", "Committed and tested"],
];
const LIB_KINDS = [
  ["skill", "Skill"],
  ["template", "Template"],
  ["knowledge", "Knowledge entry"],
  ["rule", "Rule"],
];
const TAKEN = ["public/brand/logo.svg", "public/img/hero.jpg", "public/fonts/inter"];
const clone = (x) => JSON.parse(JSON.stringify(x));

/** The state slice. Copies the sample data so the session can change it. */
export function initUploads() {
  return {
    items: clone(UP.items),
    files: clone(UP.files),
    tray: clone(UP.tray).map((t) => Object.assign(t, { hold: 14, state: "reconnecting" })),
    trayOpen: false,
    drag: null,
    sheet: null,
    sel: {},
    fsel: {},
    discard: null,
    purge: null,
    offered: {},
    publicReceipt: false,
    seq: 10,
  };
}

/* ------------------------------------------------------------------ small formatters */
export function fmtBytes(n) {
  if (n == null) return "";
  if (n < 1024) return n + " B";
  if (n < 1024 ** 2) return Math.round(n / 1024) + " KB";
  if (n < 1024 ** 3) return (n / 1024 ** 2 < 10 ? (n / 1024 ** 2).toFixed(1) : Math.round(n / 1024 ** 2)) + " MB";
  return (n / 1024 ** 3).toFixed(1).replace(/\.0$/, "") + " GB";
}
const ago = (iso) => {
  const m = Math.max(1, Math.round((NOW - Date.parse(iso)) / 60000));
  if (m < 60) return m + "m ago";
  const h = Math.round(m / 60);
  if (h < 24) return h + "h ago";
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : d + " days ago";
};
const when = (iso) => {
  const d = Date.parse(iso);
  return (NOW - d < DAY && new Date(d).getUTCDate() === new Date(NOW).getUTCDate() ? "Today" : fmtDate(iso)) + ", " + fmtTime(iso);
};
const daysLeft = (iso) => Math.max(0, Math.ceil((Date.parse(iso) - NOW) / DAY));
const shortHash = (h) => (h ? h.slice(0, 8) + "…" + h.slice(-4) : "");
const kindOf = (name, type) => {
  const n = (name || "").toLowerCase();
  if (/\.(png|jpe?g|gif|webp|svg|avif|heic)$/.test(n) || /^image\//.test(type || "")) return "image";
  if (/\.pdf$/.test(n)) return "pdf";
  if (/\.(docx?|pages|rtf)$/.test(n)) return "doc";
  if (/\.(md|txt)$/.test(n)) return "text";
  if (/\.(csv|xlsx?|tsv)$/.test(n)) return "data";
  if (/\.json$/.test(n)) return "json";
  if (/\.(zip|tar|gz|7z)$/.test(n)) return "archive";
  if (/\.(mp4|mov|webm|m4v)$/.test(n) || /^video\//.test(type || "")) return "video";
  if (/\.(mp3|wav|m4a|aac)$/.test(n) || /^audio\//.test(type || "")) return "audio";
  return "other";
};
const sniffed = (k, name) =>
  ({
    image: /\.svg$/i.test(name) ? "SVG image" : /\.png$/i.test(name) ? "PNG image" : "JPEG photo",
    pdf: "PDF document",
    doc: "Word document",
    text: "Text",
    data: "Table",
    json: "JSON data",
    archive: "Archive",
    video: "Video",
    audio: "Audio",
    other: "File",
  })[k];
const needsLicence = (k, sn) => k === "video" || k === "audio" || /Font archive/.test(sn || "") || /photo/i.test(sn || "");
/** Rough reading-list cost of a file, in tokens: what the agent would read. Media is never read. */
const tokensOf = (k, pages) =>
  ({ pdf: (pages || 10) * 560, doc: (pages || 6) * 520, text: 3000, data: 4000, json: 2500, image: 1500 })[k] || 0;

/* ------------------------------------------------------------------ the world, as uploads needs it */
function worldBits(logic) {
  const w = logic.state.world;
  const clients = (w && w.clients.items) || [];
  const missions = (w && w.missions.items) || [];
  const mods = (w && w.modules) || { items: [] };
  return {
    client: (id) => clients.find((x) => x.id === id) || null,
    mission: (id) => missions.find((x) => x.id === id) || null,
    clients,
    missions,
    modules: (mid) => (mods.missionId === mid ? mods.items : []),
  };
}
const MSTATE = {
  landed: "landed",
  running: "running",
  parked: "parked",
  waiting_dependency: "not started",
  pending: "not started",
};
/** What filing a file to a module does, by the module's state (CR-34 "What filing will do"). */
function effectLine(m) {
  const st = m.state;
  if (st === "running") return "This attempt keeps what it has; the next attempt gets it.";
  if (st === "landed") return "No change unless you start rework.";
  if (st === "parked") return "It gets it when you restart it.";
  return "In its next instructions.";
}
/** A link's waiting reason, by where it points. */
function waitWhy(dest, mod, batchAt) {
  if (dest.kind === "repo") return "Waiting for scan: location and camera data removed, malware check";
  if (dest.kind === "library") return "Waiting for review: a factory change is open";
  if (dest.kind === "module" && mod) {
    if (mod.state === "running") return batchAt ? "Goes out at " + fmtTime(batchAt) : "The next attempt gets it; this one keeps what it has";
    if (mod.state === "landed") return null;
    return "In its next instructions";
  }
  return null;
}

/* ------------------------------------------------------------------ where a drop goes, from the page you're on */
export function dropTarget(logic, c) {
  const W = worldBits(logic);
  if (c.id === "module" && c.mission && c.r.moduleRef) {
    const m = W.modules(c.mission.id).find((x) => x.ref === c.r.moduleRef);
    if (m)
      return {
        kind: "module",
        id: c.mission.id + ":" + m.ref,
        ref: m.ref,
        missionId: c.mission.id,
        short: m.ref,
        label: m.ref + " · " + c.mission.name,
        line: "Drop to add to " + m.ref + " · " + c.mission.name,
      };
  }
  if (c.id === "clients" && c.r.clientId) {
    const cl = W.client(c.r.clientId);
    if (cl) return { kind: "client", id: cl.id, short: cl.name, label: cl.name + "’s files", line: "Drop to add to " + cl.name + "’s files" };
  }
  const viewing = c.mission ? { kind: "mission", id: c.mission.id, label: c.mission.name } : null;
  return { kind: "inbox", viewing, short: "Drive", label: "Drive", line: "Drop to put in Drive" };
}

/* ------------------------------------------------------------------ actions */
function put(logic, patch) {
  logic.setState((s) => ({ up: Object.assign({}, s.up, typeof patch === "function" ? patch(s.up) : patch) }));
}

/** Files picked or dropped: one tray row each (a folder is one row with its count). Bytes are never read. */
export function addUploads(logic, list, target) {
  const base = logic.state.up.seq;
  const rows = list.map((f, i) => {
    const k = f.folder ? "folder" : kindOf(f.name, f.type);
    const big = k === "video" ? LIMIT.video : LIMIT.other;
    const known = Object.values(logic.state.up.files).find((x) => x.name === f.name && !x.purged);
    const row = {
      id: "t-" + (base + i + 1),
      name: f.name,
      kind: k,
      sizeBytes: f.size || 0,
      count: f.count || null,
      sentBy: "you",
      progress: 0,
      reconnects: 0,
      dest: target.kind === "inbox" ? { kind: "inbox", viewing: target.viewing } : target,
      state: f.size > big ? "error" : "uploading",
      error: f.size > big ? { code: "UPLOAD_LIMIT", text: "Too big: " + (k === "video" ? "video" : "this kind of file") + " is limited to " + fmtBytes(big) } : null,
      // the mock decides outcomes from the name only: the real server hashes and scans the bytes
      fate: /damaged/i.test(f.name)
        ? "mismatch"
        : /(\.env$|secret|api[-_]?key|config-export)/i.test(f.name)
          ? "flagged"
          : known
            ? "duplicate"
            : "ok",
      dupOf: known ? known.id : null,
    };
    return row;
  });
  put(logic, (u) => ({ tray: rows.concat(u.tray), trayOpen: true, seq: base + list.length }));
  tick(logic);
}

/** The mock replays the upload's progress events. not a fetch: uploads.state and scanStatus arrive on the stream */
function tick(logic) {
  if (logic.upTimer) return;
  const step = () => {
    const u = logic.state.up;
    const live = u.tray.filter((t) => !["done", "error", "duplicate", "held"].includes(t.state));
    if (!live.length) {
      logic.upTimer = null;
      return;
    }
    const tray = u.tray.map((t) => advance(logic, t));
    put(logic, { tray });
    // not a fetch: the mock's stand-in for upload progress events on the stream
    logic.upTimer = setTimeout(step, 400);
  };
  // not a fetch: the mock's stand-in for upload progress events on the stream
  logic.upTimer = setTimeout(step, 400);
}
export function startTray(logic) {
  tick(logic);
}

function advance(logic, t) {
  const x = Object.assign({}, t);
  if (x.hold > 0) {
    x.hold -= 1;
    if (x.hold === 0) x.state = "uploading";
    else if (x.state === "uploading" && x.reconnects) x.state = "reconnecting";
    return x;
  }
  if (x.state === "uploading") {
    const rate = x.sizeBytes > 500 * 1024 ** 2 ? 0.035 : 0.18;
    x.progress = Math.min(1, x.progress + rate);
    if (x.sizeBytes > 500 * 1024 ** 2 && !x.reconnects && x.progress > 0.4) {
      x.state = "reconnecting";
      x.reconnects = 1;
      x.hold = 4;
      return x;
    }
    if (x.progress >= 1) {
      x.state = "hashing";
      x.wait = 2;
    }
  } else if (x.state === "reconnecting") {
    x.state = "uploading";
  } else if (x.state === "hashing") {
    if (--x.wait > 0) return x;
    if (x.fate === "mismatch") {
      x.state = "error";
      x.error = { code: "UPLOAD_HASH_MISMATCH", text: "Upload damaged, retry" };
    } else if (x.fate === "duplicate") {
      x.state = "duplicate";
    } else {
      x.state = "scanning";
      x.wait = 3;
      land(logic, x, "pending");
    }
  } else if (x.state === "scanning") {
    if (--x.wait > 0) return x;
    if (x.fate === "flagged") {
      x.state = "held";
      x.error = { code: "UPLOAD_FLAGGED", text: "Held: looks like it contains a key. Use Secrets instead.", secrets: true };
      land(logic, x, "flagged");
    } else {
      x.state = "done";
      land(logic, x, "clean");
    }
  }
  return x;
}

/** Where a finished upload lands: Drive (live), or straight onto the page's client or module. */
function land(logic, x, scan) {
  const u = logic.state.up;
  if (x.itemId) {
    // a sample upload already listed in Drive: its row follows the stream
    const items = u.items.map((it) =>
      it.id === x.itemId
        ? Object.assign({}, it, { state: scan === "clean" ? "stored" : "uploading", scanStatus: scan === "clean" ? "clean" : "scanning", progress: 1 })
        : it,
    );
    put(logic, { items });
    return;
  }
  if (scan === "flagged" && x.dest.kind !== "inbox") {
    // held files are never linked: a drop on a module or client page that turns out to hold a key
    // comes out of that place and waits in Drive, held, with nothing using it
    const was = x.landed;
    x.landed = null;
    if (was && u.files[was]) {
      put(logic, (s) => {
        const files = Object.assign({}, s.files);
        delete files[was];
        return { files };
      });
    }
  }
  if (x.dest.kind === "inbox" || scan === "flagged") {
    const at = new Date(NOW).toISOString();
    const id = x.landed || "u-" + x.id;
    const it = {
      id,
      name: x.name,
      kind: x.kind,
      sniffed: x.kind === "folder" ? "Folder · " + (x.count || 0) + " files" : sniffed(x.kind, x.name),
      sizeBytes: x.sizeBytes,
      sentBy: "you",
      createdAt: at,
      expiresAt: new Date(NOW + KEEP_DAYS * DAY).toISOString(),
      state: scan === "flagged" ? "held" : "stored",
      scanStatus: scan === "pending" ? "scanning" : scan,
      flag: scan === "flagged" ? { code: "key", reason: "Looks like it contains an API key" } : null,
      suggestion:
        scan === "flagged"
          ? null
          : x.dest.kind === "inbox" && x.dest.viewing
            ? { dests: [{ kind: "mission", id: x.dest.viewing.id, label: x.dest.viewing.label }], why: "you were viewing it", by: "rules" }
            : { dests: [], why: null, by: "rules" },
      fresh: true,
    };
    x.landed = id;
    put(logic, (s) => ({ items: [it].concat(s.items.filter((y) => y.id !== id)) }));
    return;
  }
  // filed straight to the page's client or module
  const fid = x.landed || "f-" + x.id;
  x.landed = fid;
  const waiting = scan !== "clean";
  const W = worldBits(logic);
  const mod = x.dest.kind === "module" ? W.modules(x.dest.missionId).find((m) => m.ref === x.dest.ref) : null;
  const rec = {
    id: fid,
    name: x.name,
    kind: x.kind,
    sniffed: sniffed(x.kind, x.name),
    owner: x.dest.kind === "client" ? { clientId: x.dest.id } : { missionId: x.dest.missionId },
    versions: [{ v: 1, at: new Date(NOW).toISOString(), by: "you", sizeBytes: x.sizeBytes, sha256: fakeHash(x.name), current: true }],
    facts: {},
    links: [
      {
        key: "l1",
        dest: { kind: x.dest.kind, id: x.dest.id, label: x.dest.kind === "client" ? x.dest.short + " · files" : x.dest.label },
        state: waiting ? "waiting" : mod && mod.state !== "landed" ? "waiting" : "active",
        why: waiting ? "Waiting for scan" : (mod && waitWhy({ kind: "module" }, mod, null)) || (x.dest.kind === "client" ? "Client file" : "Available to its agents"),
        version: 1,
        listed: false,
        reason: x.reason || "",
      },
    ],
    readBy: [],
    receipts: [],
  };
  put(logic, (s) => ({ files: Object.assign({}, s.files, { [fid]: rec }) }));
}
function fakeHash(s) {
  let h = 2166136261;
  let out = "";
  for (let i = 0; i < 64; i++) {
    h ^= (s.charCodeAt(i % s.length) || 7) + i;
    h = Math.imul(h, 16777619) >>> 0;
    out += (h & 15).toString(16);
  }
  return out;
}

/* ------------------------------------------------------------------ filing */
function blankSheet(items, logic, fileId) {
  const it = items[0];
  const W = worldBits(logic);
  const sug = (it && it.suggestion && it.suggestion.dests) || [];
  const d = {
    client: { on: false, id: null, kb: false },
    mission: { on: false, id: null },
    module: { on: false, refs: [], q: "", reason: "", listed: true, range: "" },
    library: { on: false, kind: "knowledge" },
    repo: { on: false, path: "", replace: false, licence: "" },
  };
  sug.forEach((s) => {
    if (s.kind === "client") Object.assign(d.client, { on: true, id: s.id });
    if (s.kind === "mission") Object.assign(d.mission, { on: true, id: s.id });
  });
  // the project's real folders give the repo path
  const name = it ? it.name : "";
  const k = it ? it.kind : "other";
  d.repo.path =
    k === "image" ? "public/brand/" + (/logo/i.test(name) ? "logo." + name.split(".").pop() : name) : k === "archive" ? "public/fonts/" + name.replace(/\.zip$/i, "").toLowerCase() : "docs/" + name;
  if (!d.client.on && !d.mission.on) {
    const m = W.missions.find((x) => x.state === "running");
    if (m) Object.assign(d.mission, { id: m.id });
    const c = W.clients[0];
    if (c) d.client.id = c.id;
  }
  if (!d.mission.id) d.mission.id = (W.missions.find((x) => x.state === "running") || {}).id || null;
  if (!d.client.id) d.client.id = (W.clients[0] || {}).id || null;
  return { itemIds: items.map((x) => x.id), fileId: fileId || null, dests: d, scope: "no", step: "pick", tried: false };
}
export function openSheet(logic, ids, fileId) {
  const u = logic.state.up;
  const items = ids.map((id) => u.items.find((x) => x.id === id)).filter(Boolean);
  if (!items.length && fileId) {
    const f = u.files[fileId];
    if (!f) return;
    items.push({ id: "file:" + fileId, name: f.name, kind: f.kind, sniffed: f.sniffed, scanStatus: "clean", sizeBytes: f.versions[f.versions.length - 1].sizeBytes });
  }
  if (!items.length) return;
  put(logic, { sheet: Object.assign(blankSheet(items, logic, fileId), { items }) });
}
const setD = (logic, key, patch) =>
  put(logic, (u) =>
    u.sheet
      ? { sheet: Object.assign({}, u.sheet, { dests: Object.assign({}, u.sheet.dests, { [key]: Object.assign({}, u.sheet.dests[key], patch) }) }) }
      : {},
  );

/** File one or more Drive items to their suggested places, or to what the sheet picked. */
function fileTo(logic, items, dests, opts = {}) {
  const u = logic.state.up;
  const W = worldBits(logic);
  const batch = UP.batch || {};
  const files = Object.assign({}, u.files);
  const names = [];
  items.forEach((it) => {
    const fid = it.fileId || (it.id.startsWith("file:") ? it.id.slice(5) : "f-" + it.id);
    const prev = files[fid];
    const version = it.version || (prev ? prev.versions.length : 1);
    const scanning = it.scanStatus !== "clean";
    // a new version takes over its older version's links to the same places
    const same = (l) => dests.some((d) => d.kind === l.dest.kind && d.id === l.dest.id);
    const links = (prev ? prev.links.filter((l) => l.version !== version && !same(l)) : []).slice();
    dests.forEach((d, i) => {
      const mid = d.kind === "module" ? d.id.split(":")[0] : d.kind === "mission" || d.kind === "repo" ? d.id : null;
      const mod = d.kind === "module" ? W.modules(mid).find((m) => m.ref === d.id.split(":")[1]) : null;
      const wait = scanning ? "Waiting for scan" : waitWhy(d, mod, batch[mid] && batch[mid].at);
      links.push({
        key: "n" + version + "-" + i + "-" + d.kind,
        dest: { kind: d.kind, id: d.id, label: d.label },
        state: wait ? "waiting" : "active",
        why: wait || d.why || (d.kind === "client" ? "In the brand kit" : d.kind === "mission" ? "Kept on the project; link it to a module to use it" : "Active"),
        version,
        listed: d.listed,
        reason: d.reason,
        path: d.path,
        licence: d.licence,
      });
    });
    const versions = prev
      ? prev.versions
      : [{ v: 1, at: it.createdAt, by: it.sentBy, sizeBytes: it.sizeBytes, sha256: fakeHash(it.name), current: true }];
    files[fid] = Object.assign({}, prev || { id: fid, name: it.name, kind: it.kind, sniffed: it.sniffed, facts: {}, readBy: [], receipts: [], owner: {} }, {
      versions,
      links,
    });
    names.push(it.name);
  });
  const left = u.items.filter((x) => !items.some((y) => y.id === x.id));
  const sel = Object.assign({}, u.sel);
  items.forEach((x) => delete sel[x.id]);
  put(logic, { files, items: left, sheet: null, sel });
  const where = dests.length === 1 ? dests[0].label : dests.length + " places";
  logic.toast((names.length === 1 ? "Filed " + names[0] : "Filed " + names.length + " files") + " to " + where + (opts.reentry ? ". Re-entry proposal opened in Decisions" : ""));
}

function sheetDests(logic, sh) {
  const W = worldBits(logic);
  const d = sh.dests;
  const out = [];
  if (d.client.on && d.client.id) {
    const c = W.client(d.client.id);
    out.push({ kind: "client", id: d.client.id, label: (c ? c.name : "Client") + " · brand kit", kb: d.client.kb });
  }
  if (d.mission.on && d.mission.id) {
    const m = W.mission(d.mission.id);
    out.push({ kind: "mission", id: d.mission.id, label: m ? m.name : "Project" });
  }
  if (d.module.on)
    d.module.refs.forEach((id) => {
      const [mid, ref] = id.split(":");
      const m = W.modules(mid).find((x) => x.ref === ref);
      out.push({ kind: "module", id, label: ref + " · " + (m ? m.title : ""), listed: d.module.listed, reason: d.module.reason.trim(), range: d.module.range });
    });
  if (d.library.on) out.push({ kind: "library", id: d.library.kind, label: "Library · " + (LIB_KINDS.find((x) => x[0] === d.library.kind) || [, ""])[1] });
  if (d.repo.on) {
    const m = W.missions.find((x) => x.id === (d.mission.id || "")) || W.missions.find((x) => x.state === "running");
    out.push({ kind: "repo", id: m ? m.id : "", label: "Repo · " + d.repo.path.trim(), path: d.repo.path.trim(), licence: d.repo.licence.trim() });
  }
  return out;
}

/* ------------------------------------------------------------------ the view model */
export function uploadsVals(logic, c) {
  const s = logic.state;
  const u = s.up;
  if (!u || !s.world) return null;
  const I = (n, z) => logic.icon(n, z || 16);
  const W = worldBits(logic);
  const thumb = (k) => ({ icon: I((KIND[k] || KIND.other)[0], 20), kind: k, word: (KIND[k] || KIND.other)[1] });
  const go = (h) => logic.go(h);

  /* ---------- the tray */
  const trayRow = (t) => {
    const dest = t.dest.kind === "inbox" ? "Drive" : t.dest.short || t.dest.label;
    const filed = t.dest.kind !== "inbox";
    const pct = Math.round(t.progress * 100);
    const line =
      t.state === "uploading"
        ? "Uploading " + pct + "% · " + fmtBytes(t.sizeBytes * t.progress) + " of " + fmtBytes(t.sizeBytes)
        : t.state === "reconnecting"
          ? "Reconnecting… resumes where it stopped"
          : t.state === "hashing"
            ? "Checking hash"
            : t.state === "scanning"
              ? filed
                ? "Filed to " + dest + " · waiting for scan"
                : "Scanning"
              : t.state === "done"
                ? filed
                  ? "Filed to " + dest + (t.dest.kind === "module" && !t.reason ? " · add its reading-list line" : "")
                  : "In Drive"
                : t.state === "duplicate"
                  ? "Already filed to " + dupPlaces(u.files[t.dupOf])
                  : t.error
                    ? t.error.text
                    : "";
    const tone = t.state === "error" || t.state === "held" ? "bad" : t.state === "done" ? "ok" : t.state === "duplicate" ? "warn" : "live";
    return {
      key: t.id,
      name: t.name,
      size: t.count ? t.count + " files · " + fmtBytes(t.sizeBytes) : fmtBytes(t.sizeBytes),
      from: who(logic, t.sentBy) !== "you" ? "From " + SENDER[t.sentBy] : null,
      thumb: thumb(t.kind),
      line,
      tone,
      state: t.state,
      pct: t.state === "uploading" || t.state === "reconnecting" ? pct : t.state === "done" ? 100 : t.state === "hashing" || t.state === "scanning" ? 100 : null,
      indeterminate: t.state === "hashing" || t.state === "scanning" ? "true" : undefined,
      href: t.landed && t.landed.startsWith("f-") ? "#/files/" + t.landed : t.landed ? "#/drive" : t.itemId ? "#/drive" : null,
      retry:
        t.state === "error" && t.error && t.error.code === "UPLOAD_HASH_MISMATCH"
          ? () => {
              put(logic, (x) => ({ tray: x.tray.map((y) => (y.id === t.id ? Object.assign({}, y, { state: "uploading", progress: 0, error: null, fate: "ok" }) : y)) }));
              tick(logic);
            }
          : null,
      // dropped on a module's page: one line for its reading list, asked right in the row
      ask:
        t.dest.kind === "module" && !t.reason && ["scanning", "done"].includes(t.state)
          ? {
              value: t.draft || "",
              on: (e) => put(logic, (x) => ({ tray: x.tray.map((y) => (y.id === t.id ? Object.assign({}, y, { draft: e.target.value }) : y)) })),
              save: () => {
                const r = (t.draft || "").trim();
                if (!r) return;
                put(logic, (x) => {
                  const f = t.landed && x.files[t.landed];
                  const files = f
                    ? Object.assign({}, x.files, { [t.landed]: Object.assign({}, f, { links: f.links.map((l) => Object.assign({}, l, { reason: r, listed: true, why: l.state === "active" ? "On the reading list: " + r : l.why })) }) })
                    : x.files;
                  return { files, tray: x.tray.map((y) => (y.id === t.id ? Object.assign({}, y, { reason: r }) : y)) };
                });
              },
              label: "Why " + t.dest.short + " needs it",
            }
          : null,
      secrets: t.error && t.error.secrets ? "#/settings" : null,
      dup:
        t.state === "duplicate"
          ? {
              same: () => {
                put(logic, (x) => ({ tray: x.tray.map((y) => (y.id === t.id ? Object.assign({}, y, { state: "done", dest: { kind: "same", short: "the same places", label: "the same places" } }) : y)) }));
              },
              separate: () => {
                put(logic, (x) => ({ tray: x.tray.map((y) => (y.id === t.id ? Object.assign({}, y, { state: "scanning", wait: 3, fate: "ok" }) : y)) }));
                tick(logic);
              },
            }
          : null,
      dismiss: ["done", "error", "held", "duplicate"].includes(t.state) ? () => put(logic, (x) => ({ tray: x.tray.filter((y) => y.id !== t.id) })) : null,
    };
  };
  const active = u.tray.filter((t) => !["done", "error", "held", "duplicate"].includes(t.state)).length;
  const trouble = u.tray.filter((t) => ["error", "held", "duplicate"].includes(t.state)).length;
  const tray = u.tray.length
    ? {
        open: u.trayOpen ? "true" : undefined,
        rows: u.tray.map(trayRow),
        pill: active ? active + " uploading" : trouble ? trouble + " need" + (trouble === 1 ? "s" : "") + " you" : u.tray.length + " done",
        pillTone: trouble ? "bad" : active ? "live" : "ok",
        toggle: () => put(logic, (x) => ({ trayOpen: !x.trayOpen })),
        clear: u.tray.some((t) => ["done"].includes(t.state)) ? () => put(logic, (x) => ({ tray: x.tray.filter((t) => t.state !== "done") })) : null,
        title: active ? "Uploading " + active + (active === 1 ? " file" : " files") : "Uploads",
      }
    : null;

  /* ---------- the drop target */
  const target = dropTarget(logic, c);
  const drop = u.drag
    ? {
        line: u.drag.folder ? target.line.replace(/^Drop/, "Drop folder" + (u.drag.count ? " (" + u.drag.count + " files)" : "")) : target.line,
        sub:
          target.kind === "module"
            ? "You’ll add a line for its reading list. Nothing uses the file until its scan is clean."
            : target.kind === "client"
              ? "Every " + target.short + " project can use it once its scan is clean."
              : target.viewing
                ? "It waits there with a suggestion: " + target.viewing.label + ", because you’re viewing it."
                : "It waits there with a suggested place. You confirm with one tap.",
        kind: target.kind,
        icon: I("upload", 28),
      }
    : null;
  const pick = (files) =>
    addUploads(
      logic,
      [...files].map((f) => ({ name: f.name, size: f.size, type: f.type })),
      target,
    );

  /* ---------- Drive */
  const items = u.items;
  const flagged = items.filter((x) => x.scanStatus === "flagged");
  const rest = items.filter((x) => x.scanStatus !== "flagged");
  const dlabel = (dests) => dests.map((d) => d.label).join(" + ");
  const itemRow = (it) => {
    const left = daysLeft(it.expiresAt);
    const sug = it.suggestion && it.suggestion.dests.length ? it.suggestion : null;
    const uploading = it.state === "uploading";
    const trayT = uploading && u.tray.find((t) => t.itemId === it.id);
    const scan =
      it.scanStatus === "flagged"
        ? ["bad", "Held"]
        : uploading
          ? ["live", trayT && trayT.state === "reconnecting" ? "Reconnecting… resumes where it stopped" : "Arriving · " + Math.round(((trayT && trayT.progress) || it.progress || 0) * 100) + "%"]
          : it.scanStatus === "clean"
            ? ["ok", "Scan clean"]
            : ["live", "Scanning"];
    return {
      key: it.id,
      id: it.id,
      name: it.name,
      href: "#/files/" + (it.fileId || it.id),
      thumb: thumb(it.kind),
      type: it.sniffed,
      size: fmtBytes(it.sizeBytes),
      from: SENDER[who(logic, it.sentBy)],
      age: ago(it.createdAt),
      expires: "expires in " + left + (left === 1 ? " day" : " days"),
      soon: left <= SOON_DAYS ? "true" : undefined,
      scanTone: scan[0],
      scan: scan[1],
      version: it.newVersionOf ? "New version of " + it.newVersionOf : null,
      flag: it.flag ? it.flag.reason : null,
      flagged: it.scanStatus === "flagged" ? "true" : undefined,
      secrets: it.flag && it.flag.code === "key" ? "#/settings" : null,
      fresh: it.fresh ? "true" : undefined,
      sug: sug
        ? {
            label: dlabel(sug.dests),
            why: sug.why ? "because " + sug.why : null,
            canon: sug.by === "canon" ? "true" : undefined,
          }
        : null,
      noSug: !sug && it.scanStatus !== "flagged" ? "true" : undefined,
      checked: !!u.sel[it.id],
      toggle: () => put(logic, (x) => ({ sel: Object.assign({}, x.sel, { [it.id]: !x.sel[it.id] }) })),
      file: sug && it.scanStatus !== "flagged" ? () => fileTo(logic, [it], sug.dests) : null,
      change: it.scanStatus !== "flagged" ? () => openSheet(logic, [it.id]) : null,
      discarding: u.discard === it.id ? "true" : undefined,
      askDiscard: () => put(logic, { discard: it.id }),
      keep: () => put(logic, { discard: null }),
      discard: () => {
        put(logic, (x) => ({ items: x.items.filter((y) => y.id !== it.id), discard: null }));
        logic.toast("Discarded " + it.name);
      },
    };
  };
  const SENT = ["you", "osa", "avel_os"];
  const fx = logic.state.up.fsel;
  const KINDW = (k) => (KIND[k] || KIND.other)[1];
  const facetDefs = [
    { key: "from", name: "Sent by", get: (i) => [who(logic, i.sentBy)], label: (v) => SENDER[v], order: SENT },
    { key: "type", name: "Type", get: (i) => [KINDW(i.kind)], label: (v) => v },
    { key: "flag", name: "Flagged", get: (i) => [i.scanStatus === "flagged" ? "Flagged" : "Not flagged"], label: (v) => v, order: ["Flagged", "Not flagged"] },
    { key: "soon", name: "Expiring", get: (i) => [daysLeft(i.expiresAt) <= SOON_DAYS ? "Expiring soon" : "Not soon"], label: (v) => v, order: ["Expiring soon", "Not soon"] },
  ];
  const visible = items;
  const selIds = items.filter((x) => u.sel[x.id] && x.scanStatus !== "flagged").map((x) => x.id);
  const toFile = {
    count: items.length,
    none: items.length ? undefined : "true",
    flaggedIds: visible.filter((x) => x.scanStatus === "flagged").map((x) => x.id),
    rowsById: Object.fromEntries(items.map((x) => [x.id, itemRow(x)])),
    defs: facetDefs,
    pool: items,
    fsel: fx,
    onFsel: (v) => put(logic, { fsel: v }),
    clearF: () => put(logic, { fsel: {} }),
    selCount: selIds.length,
    bulk: selIds.length ? () => openSheet(logic, selIds) : null,
    clearSel: () => put(logic, { sel: {} }),
    allSel: rest.length && rest.every((x) => u.sel[x.id]),
    toggleAll: () =>
      put(logic, (x) => {
        const on = !rest.every((y) => x.sel[y.id]);
        const sel = {};
        if (on) rest.forEach((y) => (sel[y.id] = true));
        return { sel };
      }),
    flaggedCount: flagged.length,
    pick,
  };

  /* ---------- the filing sheet */
  let sheet = null;
  if (u.sheet) {
    const sh = u.sheet;
    const d = sh.dests;
    const it0 = sh.items[0];
    const many = sh.items.length > 1;
    const spring = W.missions.find((m) => m.id === d.mission.id) || W.missions.find((m) => m.state === "running");
    const mid = (spring || {}).id;
    const mods = [];
    W.missions.forEach((m) =>
      W.modules(m.id).forEach((x) => mods.push({ id: m.id + ":" + x.ref, ref: x.ref, title: x.title, state: x.state, mission: m.name, mid: m.id, x })),
    );
    const q = d.module.q.trim().toLowerCase();
    const pages = it0.pages || (/(\d+) pages/.exec(it0.sniffed || "") || [])[1];
    const range = /(\d+)\s*[–-]\s*(\d+)/.exec(d.module.range || "");
    const est = d.module.listed ? tokensOf(it0.kind, range ? Math.max(1, +range[2] - +range[1] + 1) : +pages || null) * sh.items.length : 0;
    const docLike = ["pdf", "doc", "text"].includes(it0.kind);
    const meterFor = (id) => {
      const rl = (UP.readingList || {})[id] || { used: 20000, cap: 60000 };
      const used = rl.used + est;
      const p = Math.round((used / rl.cap) * 100);
      return {
        text: Math.round(used / 1000) + "k of " + Math.round(rl.cap / 1000) + "k tokens",
        add: est ? "+" + Math.round(est / 1000) + "k from this file" : "Not read, so it adds nothing",
        pct: p,
        warn: p > 100 ? "over" : p > 80 ? "amber" : undefined,
        note: p > 100 ? "Over budget: Gate 1 will flag it" : p > 80 ? "Close to the budget" : null,
      };
    };
    const repoTaken = TAKEN.includes(d.repo.path.trim());
    const licenceNeed = d.repo.on && needsLicence(it0.kind, it0.sniffed);
    const dests = sheetDests(logic, sh);
    const errs = {
      module: d.module.on && (!d.module.refs.length ? "Pick at least one module" : !d.module.reason.trim() ? "Say what it’s for: it becomes the agents’ reading-list line" : null),
      repo: d.repo.on && (!d.repo.path.trim() ? "Give the path" : repoTaken && !d.repo.replace ? "Confirm you’re replacing the existing file" : licenceNeed && !d.repo.licence.trim() ? "Add the licence: it’s printed on the receipt" : null),
      client: d.client.on && !d.client.id ? "Pick a client" : null,
      mission: d.mission.on && !d.mission.id ? "Pick a project" : null,
      none: !dests.length ? "Pick at least one place" : null,
    };
    const blocked = Object.values(errs).some(Boolean);
    const afterGate0 = spring && !["onboarding", "draft"].includes(spring.state);
    const touchesBuild = d.module.on || d.repo.on || d.mission.on;
    const askScope = afterGate0 && touchesBuild;
    const reentry = askScope && sh.scope === "yes";
    const effects = d.module.on
      ? d.module.refs.map((id) => {
          const m = mods.find((x) => x.id === id);
          return m ? { key: id, ref: m.ref, state: MSTATE[m.state] || m.state, text: effectLine(m) } : null;
        }).filter(Boolean)
      : [];
    const b = UP.batch && UP.batch[mid];
    const lateToRunning = d.module.on && d.module.refs.some((id) => (mods.find((x) => x.id === id) || {}).state !== "landed");
    sheet = {
      title: many ? "File " + sh.items.length + " files" : "File " + it0.name,
      names: sh.items.map((x) => ({ key: x.id, name: x.name, thumb: thumb(x.kind), type: x.sniffed, size: fmtBytes(x.sizeBytes) })),
      many: many ? "true" : undefined,
      scanNote: sh.items.some((x) => x.scanStatus !== "clean") ? "Its scan isn’t done. Filing now is fine: nothing uses it until the scan is clean." : null,
      close: () => put(logic, { sheet: null }),
      kinds: DEST_KINDS.map(([k, label, hint]) => ({
        key: k,
        label,
        hint,
        on: d[k].on,
        toggle: () => setD(logic, k, { on: !d[k].on }),
        err: sh.tried ? errs[k] || null : null,
      })),
      client: d.client.on
        ? {
            value: d.client.id || "",
            opts: W.clients.filter((x) => x.name !== "AVEL").map((x) => ({ key: x.id, v: x.id, label: x.name })),
            onPick: (e) => setD(logic, "client", { id: e.target.value }),
            kb: d.client.kb,
            onKb: () => setD(logic, "client", { kb: !d.client.kb }),
          }
        : null,
      mission: d.mission.on
        ? {
            value: d.mission.id || "",
            opts: W.missions.filter((m) => !["closed", "delivered"].includes(m.state)).map((m) => ({ key: m.id, v: m.id, label: m.name })),
            onPick: (e) => setD(logic, "mission", { id: e.target.value }),
            note: (() => {
              const m = W.mission(d.mission.id);
              return m && ["onboarding", "draft"].includes(m.state) ? "Canon will read it." : "Kept on the project; link it to a module to use it.";
            })(),
          }
        : null,
      module: d.module.on
        ? {
            q: d.module.q,
            onQ: (e) => setD(logic, "module", { q: e.target.value }),
            list: mods
              .filter((m) => !q || (m.ref + " " + m.title + " " + m.mission).toLowerCase().includes(q))
              .map((m) => ({
                key: m.id,
                ref: m.ref,
                title: m.title,
                sub: m.mission + " · " + (MSTATE[m.state] || m.state),
                on: d.module.refs.includes(m.id),
                toggle: () => setD(logic, "module", { refs: d.module.refs.includes(m.id) ? d.module.refs.filter((x) => x !== m.id) : d.module.refs.concat([m.id]) }),
              })),
            none: mods.length && q && !mods.some((m) => (m.ref + " " + m.title + " " + m.mission).toLowerCase().includes(q)) ? "No module matches “" + d.module.q + "”" : null,
            reason: d.module.reason,
            onReason: (e) => setD(logic, "module", { reason: e.target.value }),
            reasonErr: sh.tried && d.module.on && d.module.refs.length && !d.module.reason.trim() ? errs.module : null,
            listed: d.module.listed,
            setListed: (v) => () => setD(logic, "module", { listed: v }),
            docLike: docLike ? "true" : undefined,
            range: d.module.range,
            onRange: (e) => setD(logic, "module", { range: e.target.value }),
            pagesHint: pages ? "All " + pages + " pages if you leave it empty" : "The whole file if you leave it empty",
            meters: d.module.refs.map((id) => Object.assign({ key: id, ref: id.split(":")[1] }, meterFor(id))),
          }
        : null,
      library: d.library.on
        ? {
            kinds: LIB_KINDS.map(([k, label]) => ({ key: k, label, on: d.library.kind === k, pick: () => setD(logic, "library", { kind: k }) })),
          }
        : null,
      repo: d.repo.on
        ? {
            path: d.repo.path,
            onPath: (e) => setD(logic, "repo", { path: e.target.value, replace: false }),
            taken: repoTaken ? "true" : undefined,
            replace: d.repo.replace,
            onReplace: () => setD(logic, "repo", { replace: !d.repo.replace }),
            licence: licenceNeed ? { value: d.repo.licence, on: (e) => setD(logic, "repo", { licence: e.target.value }), err: sh.tried && !d.repo.licence.trim() ? "Required for fonts, stock photos, audio and video" : null } : null,
            folders: ["public/brand/", "public/img/", "public/fonts/", "docs/"].map((p) => ({ key: p, label: p, pick: () => setD(logic, "repo", { path: p + d.repo.path.split("/").pop(), replace: false }) })),
          }
        : null,
      effects,
      batch: lateToRunning && b ? "Goes out with " + b.pending + " other files at " + fmtTime(b.at) + ". You’ll confirm the package once." : null,
      scope: askScope
        ? {
            yes: sh.scope === "yes",
            no: sh.scope !== "yes",
            setYes: () => put(logic, (x) => ({ sheet: Object.assign({}, x.sheet, { scope: "yes" }) })),
            setNo: () => put(logic, (x) => ({ sheet: Object.assign({}, x.sheet, { scope: "no" }) })),
            note: "Only the affected modules are re-planned. The rest keep running.",
          }
        : null,
      summary: dests.length ? dests.map((x) => ({ key: x.kind + x.id, label: x.label })) : [],
      problems: sh.tried ? Object.values(errs).filter(Boolean) : [],
      confirmLabel: reentry ? "Open a re-entry proposal" : dests.length > 1 ? "File to " + dests.length + " places" : dests.length ? "File" : "File",
      blocked: blocked ? "true" : undefined,
      confirm: () => {
        if (blocked) {
          put(logic, (x) => ({ sheet: Object.assign({}, x.sheet, { tried: true }) }));
          return;
        }
        fileTo(logic, sh.items, dests, { reentry });
      },
    };
  }

  /* ---------- the file page */
  let file = null;
  if (c.id === "file" && c.r.fileId) file = fileVals(logic, c.r.fileId, { I, thumb, W });

  /* ---------- the badge */
  const badge = { count: items.length, label: "Drive " + items.length + ", " + (items.length === 1 ? "1 file waits" : items.length + " files wait") + " for a place", href: "#/drive", current: c.id === "toFile" ? "page" : undefined };

  return { tray, drop, toFile, sheet, file, badge, pick, target, I, go };
}

function dupPlaces(f) {
  if (!f) return "another place";
  const ls = f.links.filter((l) => l.state !== "removed").map((l) => l.dest.label);
  return ls.length ? ls.slice(0, 2).join(" and ") : "Drive";
}

/* ------------------------------------------------------------------ one file's page */
function fileVals(logic, id, { I, thumb, W }) {
  const u = logic.state.up;
  let f = u.files[id];
  let inbox = null;
  if (!f) {
    const it = u.items.find((x) => x.id === id);
    if (!it) return { missing: id };
    inbox = it;
    f = {
      id: it.id,
      name: it.name,
      kind: it.kind,
      sniffed: it.sniffed,
      versions: [{ v: 1, at: it.createdAt, by: it.sentBy, sizeBytes: it.sizeBytes, sha256: fakeHash(it.name), current: true }],
      facts: {},
      links: [],
      readBy: [],
      receipts: [],
    };
  }
  const waitingInbox = u.items.find((x) => x.fileId === id) || inbox;
  const cur = f.versions[f.versions.length - 1];
  const shown = waitingInbox && waitingInbox.version ? f.versions.find((v) => v.v === waitingInbox.version) || cur : cur;
  const facts = [];
  facts.push({ key: "sha", k: "SHA-256", v: shortHash(shown.sha256), full: shown.sha256, copy: true });
  facts.push({ key: "type", k: "Type", v: f.sniffed + " (from its content)" });
  facts.push({ key: "size", k: "Size", v: fmtBytes(shown.sizeBytes) });
  if (f.facts.dimensions) facts.push({ key: "dim", k: "Resolution", v: f.facts.dimensions });
  if (f.facts.pages) facts.push({ key: "pages", k: "Pages", v: String(f.facts.pages) });
  if (f.facts.rows) facts.push({ key: "rows", k: "Rows", v: f.facts.rows });
  if (f.facts.length) facts.push({ key: "len", k: "Length", v: f.facts.length });
  if (f.facts.licence) facts.push({ key: "lic", k: "Licence", v: f.facts.licence });
  const approvedFact = (l) => l.dest.kind === "mission" && /Gate 0 source/.test(l.dest.label) && /Spring launch site/.test(l.dest.label);
  const LBL = { waiting: "Waiting", active: "Active", refused: "Refused", removed: "Removed" };
  const linkHref = (l) =>
    l.dest.kind === "client"
      ? "#/clients/" + l.dest.id + "/files"
      : l.dest.kind === "mission"
        ? "#/missions/" + l.dest.id + "/files"
        : l.dest.kind === "module"
          ? "#/missions/" + l.dest.id.split(":")[0] + "/modules/" + l.dest.id.split(":")[1]
          : l.dest.kind === "repo"
            ? "#/missions/" + l.dest.id + "/plan"
            : "#/library";
  const links = f.links.map((l) => {
    const locked = f.receipts.length ? "Listed on receipt " + f.receipts[0] : approvedFact(l) ? "An approved fact in 0.2 cites it" : null;
    return {
      key: l.key,
      kind: l.dest.kind,
      kindWord: { client: "Client", mission: "Project", module: "Module", library: "Library", repo: "Repo" }[l.dest.kind],
      label: l.dest.label,
      href: linkHref(l),
      state: l.state,
      stateLabel: LBL[l.state],
      why: l.why,
      version: "v" + l.version,
      listed: l.dest.kind === "module" ? (l.listed ? "On the reading list" : "Available only") : null,
      reason: l.reason || null,
      refused:
        l.state === "refused"
          ? {
              instead: () => openSheet(logic, [], f.id),
              fixed: () => logic.toast("Pick the fixed file: it becomes v" + (f.versions.length + 1) + " and the repo link retries"),
            }
          : null,
      unlink:
        l.state === "removed"
          ? null
          : {
              off: locked ? "true" : undefined,
              why: locked,
              go: locked
                ? null
                : () => {
                    put(logic, (x) => ({
                      files: Object.assign({}, x.files, {
                        [f.id]: Object.assign({}, x.files[f.id], {
                          links: x.files[f.id].links.map((y) => (y.key === l.key ? Object.assign({}, y, { state: "removed", why: "Unlinked by you" }) : y)),
                        }),
                      }),
                    }));
                    logic.toast("Unlinked from " + l.dest.label);
                  },
            },
    };
  });
  const purge = u.purge && u.purge.fileId === f.id ? u.purge : null;
  return {
    id: f.id,
    name: f.name,
    thumb: thumb(f.kind),
    type: f.sniffed,
    size: fmtBytes(shown.sizeBytes),
    from: (SENDER[who(logic, shown.by)] || "You") + " · " + when(shown.at),
    scan: f.purged ? null : waitingInbox && waitingInbox.scanStatus !== "clean" ? (waitingInbox.scanStatus === "flagged" ? ["bad", "Held: " + ((waitingInbox.flag || {}).reason || "flagged")] : ["live", "Scanning"]) : ["ok", "Scan clean"],
    purged: f.purged
      ? { at: when(f.purged.at), reason: f.purged.reason, hash: shown.sha256, by: SENDER[who(logic, f.purged.by)] || "You" }
      : null,
    inbox: waitingInbox
      ? {
          text: (waitingInbox.version ? "v" + waitingInbox.version + " is waiting in Drive" : "Waiting in Drive") + (waitingInbox.suggestion && waitingInbox.suggestion.dests.length ? ", suggested: " + waitingInbox.suggestion.dests.map((x) => x.label).join(" + ") : ""),
          file: () => openSheet(logic, [waitingInbox.id]),
          flagged: waitingInbox.scanStatus === "flagged" ? "true" : undefined,
        }
      : null,
    download: () => logic.toast("Downloads " + f.name + " (sample data: there’s nothing to download)"),
    copy: () => {
      try {
        navigator.clipboard && navigator.clipboard.writeText(shown.sha256);
      } catch (e) {
        void e;
      }
      logic.toast("Copied the SHA-256");
    },
    facts,
    contents: f.facts.contents || null,
    versions: f.versions
      .slice()
      .reverse()
      .map((v) => ({
        key: "v" + v.v,
        label: "v" + v.v,
        when: when(v.at),
        by: SENDER[who(logic, v.by)] || "You",
        size: fmtBytes(v.sizeBytes),
        hash: shortHash(v.sha256),
        current: v.current ? "true" : undefined,
        waiting: waitingInbox && waitingInbox.version === v.v ? "In Drive" : null,
      })),
    newVersion: () => {
      const inp = document.createElement("input");
      inp.type = "file";
      inp.onchange = () => {
        const x = inp.files && inp.files[0];
        if (!x) return;
        addUploads(logic, [{ name: x.name, size: x.size, type: x.type }], { kind: "inbox", viewing: null, short: "Drive", label: "Drive" });
        logic.toast("v" + (f.versions.length + 1) + " is uploading. It waits in Drive until you confirm where it goes");
      };
      inp.click();
    },
    links,
    noLinks: links.length ? undefined : "true",
    readBy: f.readBy.map((r) => ({ key: r.key, label: r.label, version: "v" + r.version, href: "#/missions/" + r.missionId + "/modules/" + r.moduleRef, when: when(r.at) })),
    receipts: f.receipts.map((r) => ({ key: r, id: r, href: "#/missions/01a17770-2280-7db5-9be9-18411454e558/receipt" })),
    purge: f.purged
      ? null
      : {
          open: purge ? "true" : undefined,
          start: () => put(logic, { purge: { fileId: f.id, reason: "", tried: false } }),
          cancel: () => put(logic, { purge: null }),
          reason: purge ? purge.reason : "",
          onReason: (e) => put(logic, (x) => ({ purge: Object.assign({}, x.purge, { reason: e.target.value }) })),
          err: purge && purge.tried && !purge.reason.trim() ? "Say why: the reason stays on the file’s page" : null,
          go: () => {
            const p = logic.state.up.purge;
            if (!p || !p.reason.trim()) return put(logic, (x) => ({ purge: Object.assign({}, x.purge, { tried: true }) }));
            put(logic, (x) => ({
              purge: null,
              files: Object.assign({}, x.files, {
                [f.id]: Object.assign({}, x.files[f.id] || f, {
                  purged: { at: new Date(NOW).toISOString(), by: "you", reason: p.reason.trim() },
                  links: (x.files[f.id] || f).links.map((y) => Object.assign({}, y, { state: "removed", why: "Removed when the file was purged" })),
                }),
              }),
            }));
            logic.toast("Purged " + f.name + ". Its name and hash stay");
          },
        },
  };
}

/* ------------------------------------------------------------------ what other screens show */
export function fileRow(logic, fid) {
  const f = logic.state.up.files[fid];
  if (!f) return null;
  const cur = f.versions[f.versions.length - 1];
  const live = f.links.filter((l) => l.state !== "removed");
  return {
    key: fid,
    name: f.name,
    href: "#/files/" + fid,
    kind: f.kind,
    icon: logic.icon((KIND[f.kind] || KIND.other)[0], 20),
    type: f.sniffed,
    meta: "v" + cur.v + " · " + fmtBytes(cur.sizeBytes) + " · " + (SENDER[who(logic, cur.by)] || "You") + ", " + fmtDate(cur.at),
    purged: f.purged ? "Purged at the client’s request" : null,
    uses: live.map((l) => ({ key: l.key, label: l.dest.label.replace(/^.*? · /, (m) => (l.dest.kind === "module" ? m : "")) || l.dest.label, state: l.state, why: l.why })),
    useCount: live.length,
  };
}
export function clientFiles(logic, clientId) {
  const cf = (UP.clientFiles || {})[clientId];
  const extra = Object.values(logic.state.up.files).filter((f) => f.owner && f.owner.clientId === clientId && !(cf && (cf.kit.includes(f.id) || cf.other.includes(f.id))));
  if (!cf && !extra.length) return { kit: [], other: [], none: "true" };
  return {
    kit: ((cf && cf.kit) || []).map((x) => fileRow(logic, x)).filter(Boolean),
    other: ((cf && cf.other) || []).concat(extra.map((f) => f.id)).map((x) => fileRow(logic, x)).filter(Boolean),
  };
}
export function missionFiles(logic, missionId) {
  const mf = (UP.missionFiles || {})[missionId] || { gate0: [], unlinked: [] };
  const extra = Object.values(logic.state.up.files).filter(
    (f) => f.owner && f.owner.missionId === missionId && !mf.gate0.includes(f.id) && !mf.unlinked.includes(f.id) && f.links.some((l) => l.dest.kind === "mission"),
  );
  return {
    gate0: mf.gate0.map((x) => fileRow(logic, x)).filter(Boolean),
    unlinked: mf.unlinked.concat(extra.map((f) => f.id)).map((x) => fileRow(logic, x)).filter(Boolean),
  };
}
/** A module's inputs: every file linked to it, with its state, reason line, listed or available, and first reads. */
export function moduleInputs(logic, missionId, ref) {
  const id = missionId + ":" + ref;
  const files = logic.state.up.files;
  const rows = [];
  Object.values(files).forEach((f) =>
    f.links
      .filter((l) => l.dest.kind === "module" && l.dest.id === id)
      .forEach((l) => {
        const reads = f.readBy.filter((r) => r.missionId === missionId && r.moduleRef === ref);
        const first = reads[0];
        rows.push({
          key: f.id + l.key,
          name: f.name,
          href: "#/files/" + f.id,
          icon: logic.icon((KIND[f.kind] || KIND.other)[0], 20),
          version: "v" + l.version,
          state: l.state,
          stateLabel: { waiting: "Waiting", active: "Active", refused: "Refused", removed: "Removed" }[l.state],
          why: l.why,
          reason: l.reason || null,
          listed: l.listed ? "On the reading list" : "Available only",
          isListed: l.listed ? "true" : undefined,
          range: l.range || null,
          firstRead: first ? first.label.replace(/^.*· /, "") + " first read v" + first.version : "Not read yet",
        });
      }),
  );
  const rl = (UP.readingList || {})[id];
  const used = rl ? rl.used : 0;
  const p = rl ? Math.round((used / rl.cap) * 100) : 0;
  return {
    rows,
    none: rows.length ? undefined : "true",
    meter: rl ? { text: Math.round(used / 1000) + "k of " + Math.round(rl.cap / 1000) + "k tokens", pct: p, warn: p > 100 ? "over" : p > 80 ? "amber" : undefined } : null,
    add: () => openSheetForModule(logic, id),
  };
}
function openSheetForModule(logic, id) {
  const inp = document.createElement("input");
  inp.type = "file";
  inp.multiple = true;
  inp.onchange = () => {
    const [mid, ref] = id.split(":");
    const W = worldBits(logic);
    const m = W.mission(mid);
    addUploads(
      logic,
      [...inp.files].map((f) => ({ name: f.name, size: f.size, type: f.type })),
      { kind: "module", id, ref, missionId: mid, short: ref, label: ref + " · " + (m ? m.name : "") },
    );
  };
  inp.click();
}
/** Canon at 0.1: the client's files, offered. Canon reads the ones you keep. */
export function offeredFiles(logic, clientId, missionId) {
  const ids = (UP.offered || {})[clientId];
  if (!ids) return null;
  const u = logic.state.up;
  const key = (fid) => missionId + ":" + fid;
  return {
    rows: ids.map((fid) => {
      const r = fileRow(logic, fid);
      const kept = u.offered[key(fid)] !== false;
      return r && Object.assign({}, r, { kept, toggle: () => put(logic, (x) => ({ offered: Object.assign({}, x.offered, { [key(fid)]: !kept }) })) });
    }).filter(Boolean),
    keptCount: ids.filter((fid) => u.offered[key(fid)] !== false).length,
  };
}
/** The package confirmation card: re-rendered because late files came in. */
export function rerenderLine(logic, missionId) {
  const r = (UP.rerender || {})[missionId];
  if (!r) return null;
  const rows = r.files.map((fid) => fileRow(logic, fid)).filter(Boolean);
  return { text: "Re-rendered for " + rows.length + " new files", at: fmtTime(r.at), files: rows.map((x) => ({ key: x.key, name: x.name, href: x.href })) };
}
/** The receipt's Inputs: name, version, short hash and destination. The public view shows count and hashes only. */
export function receiptInputs(logic, missionId) {
  const ins = (UP.receiptInputs || {})[missionId];
  if (!ins) return null;
  const u = logic.state.up;
  return {
    pub: u.publicReceipt ? "true" : undefined,
    setPub: (v) => () => put(logic, { publicReceipt: v }),
    count: ins.length + " files",
    rows: ins.map((x) => {
      const f = u.files[x.fileId];
      const v = f && (f.versions.find((y) => y.v === x.version) || f.versions[0]);
      return {
        key: x.fileId,
        name: f ? f.name : x.fileId,
        href: "#/files/" + x.fileId,
        version: "v" + x.version,
        hash: v ? shortHash(v.sha256) : "",
        dest: x.dest,
      };
    }),
  };
}
