// Fails the build when the prototype names a route, a procedure, a query key or an event that
// isn't in the contract. The contract's index is contract/contract-index.json (built by
// tools/contract-index.py from @avel/contract's source). CR-29's routes and cli.* events are
// allowed only from contract/cr-29-assumed.json, because contract 1.1.0 doesn't exist yet.
//
//   node tools/check-contract.mjs          checks src/
//   node tools/check-contract.mjs --list   also prints every route and event it found
//   node tools/check-contract.mjs --dir X  checks folder X instead (the e2e self-test uses it)

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const index = JSON.parse(readFileSync(join(root, "contract/contract-index.json"), "utf8"));
const cr29 = JSON.parse(readFileSync(join(root, "contract/cr-29-assumed.json"), "utf8"));
const list = process.argv.includes("--list");
const dirArg = process.argv.indexOf("--dir");
const scanDir = dirArg > 0 ? process.argv[dirArg + 1] : join(root, "src");

const norm = (p) =>
  p
    .replace(/\/+$/, "")
    .replace(/\{[^}]+\}|:[A-Za-z]\w*|\$[A-Za-z]\w*/g, "{}");
// routes the contract's own route list names as proposed (API routes.md, "Proposed, not counted"):
// a gap may cite one, but no screen calls it
const proposed = JSON.parse(readFileSync(join(root, "contract/proposed-routes.json"), "utf8")).routes;
const routes = index.routes
  .concat(cr29.routes.map((r) => Object.assign({ cr29: true }, r)))
  .concat(proposed.map((r) => Object.assign({ proposed: true, procedure: "proposed." + r.path }, r)));
const byPath = new Map();
for (const r of routes) {
  const k = norm(r.path);
  if (!byPath.has(k)) byPath.set(k, []);
  byPath.get(k).push(r);
}
const namespaces = new Map();
for (const r of routes) {
  const [ns, proc] = r.procedure.split(".");
  if (!namespaces.has(ns)) namespaces.set(ns, new Set());
  namespaces.get(ns).add(proc);
}
const events = new Set(index.events.concat(cr29.events));
const prefixes = new Set(index.eventPrefixes.concat(["cli"]));
// names the contract renamed or never had, which the design used to cite
const retired = Object.keys(index.renamedEventKinds).concat([
  "agent.step",
  "fact.proposed",
  "canon.message.updated",
  "module.updated",
  "decision.opened",
  "decision.resolved",
]);
const retiredPrefix = /(?<![\w.])(dispatch|attempt|integration|check|decision|receipt|mission|task_doc)\.\*/;
const FILE_EXT = /^(json|md|ts|tsx|js|jsx|mjs|yaml|yml|txt|html|css|png|svg|zip|sh|py|toml|lock)$/;

function* files(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) yield* files(p);
    else if (/\.(js|jsx|json)$/.test(f)) yield p;
  }
}

// every string literal (double, single, template) in a file, with its line
function* strings(text) {
  const re = /"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g;
  let m;
  while ((m = re.exec(text))) {
    const s = m[1] ?? m[2] ?? m[3] ?? "";
    yield { s, line: text.slice(0, m.index).split("\n").length };
  }
}

// sample code inside Library entries and template docs is a client's code, not a contract call
const ignore = JSON.parse(readFileSync(join(root, "contract/check-ignore.json"), "utf8")).ignore;
const ignored = (file, msg) =>
  ignore.some((x) => relative(root, file) === x.file && msg.includes(x.match));

const problems = [];
const found = { routes: new Set(), events: new Set() };
const say = (file, line, msg) => {
  if (!ignored(file, msg)) problems.push(relative(root, file) + ":" + line + "  " + msg);
};

for (const file of files(scanDir)) {
  const text = readFileSync(file, "utf8");
  for (const { s, line } of strings(text)) {
    // routes: "GET /api/x/{id}?a=&b=", or a bare "/api/x"
    for (const m of s.matchAll(/(?:\b(GET|POST|PUT|PATCH|DELETE) )?(\/api\/[A-Za-z0-9_\-/{}$:.]*)(\?[A-Za-z0-9_=&]*)?/g)) {
      const method = m[1],
        path = m[2].replace(/[.:]+$/, ""),
        query = m[3];
      const hits = (byPath.get(norm(path)) || []).filter((r) => !method || r.method === method);
      found.routes.add((method ? method + " " : "") + path);
      if (!hits.length) {
        say(file, line, "unknown route: " + (method ? method + " " : "") + path);
        continue;
      }
      if (query) {
        const keys = query.slice(1).split("&").filter(Boolean).map((kv) => kv.split("=")[0]);
        const allowed = new Set(hits.flatMap((r) => r.inputKeys || []));
        for (const k of keys) if (!allowed.has(k)) say(file, line, "unknown query key '" + k + "' on " + path);
      }
    }
    // procedures: "missions.postMessage", "gate0.answerQuestion"
    for (const m of s.matchAll(/(?<![\w.$/-])([a-z][A-Za-z0-9]*)\.([a-z][A-Za-z0-9]*)\b(?![.(\w-])/g)) {
      const [, ns, proc] = m;
      if (!namespaces.has(ns) || FILE_EXT.test(proc)) continue;
      if (!namespaces.get(ns).has(proc)) say(file, line, "unknown procedure: " + ns + "." + proc);
    }
    // events: "<prefix>.<object>.<verb>", with * allowed in the last two parts
    for (const m of s.matchAll(/(?<![\w./-])([a-z_]+)\.([a-z_*]+)\.([a-z_*]+)\b(?![.\w-])/g)) {
      const [name, pre] = [m[0], m[1]];
      if (!prefixes.has(pre)) continue;
      found.events.add(name);
      const re = new RegExp("^" + name.replace(/\./g, "\\.").replace(/\*/g, "[a-z_]+") + "$");
      if (![...events].some((e) => re.test(e))) say(file, line, "unknown event: " + name);
    }
    for (const r of retired) {
      const at = s.indexOf(r);
      if (at >= 0 && !/[\w.]/.test(s[at - 1] || "") && !/[\w]/.test(s[at + r.length] || ""))
        say(file, line, "retired event name: " + r);
    }
    const rp = s.match(retiredPrefix);
    if (rp) say(file, line, "retired event family: " + rp[0]);
  }
}

if (list) {
  console.log("Routes:\n  " + [...found.routes].sort().join("\n  "));
  console.log("Events:\n  " + [...found.events].sort().join("\n  "));
}
if (problems.length) {
  console.error("check-contract: " + problems.length + " problem(s) against contract " + index.version + "\n" + problems.join("\n"));
  process.exit(1);
}
console.log("check-contract: every route, procedure and event is in contract " + index.version + " (or CR-29, flagged).");
