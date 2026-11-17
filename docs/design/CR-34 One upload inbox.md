# CR-34: One upload inbox that files everything where it belongs (proposed, revision 2)

Nov 15, 2026 · @javaris · revision 2 the same day, after a gap review against contract 1.0.0

Proposed, not yet accepted. When accepted, it moves into `Change requests.md` with your decisions in its log. The study guide for this design is `docs/study/Upload system.md`.

- **What:** one way to get any file into the factory, from any screen, your phone, the CLI or OSA. Each file goes to the right place: a client, a mission, a module, the Library, or the mission repo itself. The factory keeps each file by its hash, so a receipt can name it.
- **Why:**
  - **Uploads exist only inside Gate 0.** A file belongs to one mission, and Canon tags it to modules through `context_refs`. You can't upload for a whole client (a brand kit every project uses) or for the factory (a template, a knowledge doc).
  - **There's no path after the plan is approved.** A file that arrives mid-build can't reach module M3.
  - **No file ships in the repo.** Logos, fonts and media have no way into the mission branch.
  - **Types are narrow.** Only PDF, DOCX, Markdown, text and images are accepted, up to 50 MB. Video from Avel OS, audio, fonts, archives and design exports are refused.
  - **There's no content hash** (`uploads` has no hash column), so a receipt can't prove which file a client's software was built from.
- **Touches:**
  - Design doc Main: modules (a new `files` module), data flow, cost control (a `files` budget scope), API routes.
  - Canon Onboarding doc: the sources table, allowed types and limits, client files at 0.1.
  - DATABASE.md:
    - `uploads` (generalized);
    - a new `upload_links` table;
    - `integration_commits.kind`;
    - `missions` (one unique index);
    - `budget_reservations.scope`;
    - two new cross-table rules.
  - `Backend modules and build plan.md`: `files` as the 21st module, owning `uploads` and `upload_links`.
  - `Port inventory.md`: the Drive storage port (blob gateway, document parsing, orphan sweeps, upload locks) moves from `onboarding` to `files`.
  - Sandbox doc: the sandboxed parser also sniffs types, reads media metadata, unpacks archives, scans for malware and makes thumbnails.
  - `API routes.md`: 9 new routes. Routes 35 to 37 stay.
  - CR-10 (the task doc's reading list), CR-16 and CR-W11 (the dispatch package and its confirmation), CR-17 and CR-29 (who may call what), CR-25 (the public receipt).
  - The receipt body: an `inputs` list.
  - Frontend: a CR-W once this is accepted, for the drop target, the "To file" list and the file page.
  - Contract: additive only (the next minor version).
- **Build order:** nothing in Step 1. The parts land in Steps 2, 5, 7, 8, 9a, 10 and 11 and the skills step (table at the end).

## Revision 2: the gaps found, and how each is fixed

| # | Gap in revision 1 | Fix (section) |
| --- | --- | --- |
| 1 | A "clear" upload was filed and used at once, before anyone had checked it | Filing records the destination, but nothing reaches a room, a task doc, Canon or the repo until the scan passes (8) |
| 2 | No upload state machine: a resumable upload had nowhere to live while chunks arrived, and abandoned uploads were never cleaned up | States `receiving`, `active`, `failed`, `removed`, `purged`; jobs for scan, parse and cleanup (7) |
| 3 | No way to download or view a file, or to see where it's used | A file page and a download route with safe headers and range requests (9) |
| 4 | A late file re-renders a task doc, which changes the dispatch package's hash, and that hash is something you approve (CR-W11). Revision 1 ignored it. | Late files are batched into one re-render. The package-commit confirmation comes back once for the batch, and Gate 1's section check runs on the changed task docs (5) |
| 5 | No replacing a file: "logo v2" made a second, unrelated file | Versions: a new version supersedes the old and moves its links in one transaction (6) |
| 6 | Archives and folders had no defined behaviour | Unpacked in the sandbox into child files, filed together, with skill folders kept whole (6) |
| 7 | "Mission" as a destination only worked during Gate 0 | After Gate 0, a mission file is kept on the mission and reaches modules only when you link it (4) |
| 8 | "Shared with every mission for that client" didn't say how a client file reaches anyone | Client files are offered to Canon at 0.1 of each new mission for that client, and linked to modules by hand in running ones (4) |
| 9 | Big files on a reading list could blow the $4 attempt cap | Documents are read from their parsed text; media and binaries are files, not context; each module's reading list has a token budget checked at Gate 1 (5) |
| 10 | Canon's suggestions are model calls, but files outside a mission had no budget to charge | A small `files` budget scope, metered by the model proxy like everything else (3) |
| 11 | No rate limit or quota: a runaway OSA loop or Avel OS sync could fill the store | A rate limit and a daily byte quota per non-operator caller, a total quota per scope, and an alert at 80% (7) |
| 12 | The file type came from the name or the browser | The type is sniffed from the bytes; a mismatch flags the file (8) |
| 13 | Files shipped in the client's repo were never scanned for malware | A malware scan and metadata strip for every file bound for the repo or a delivery (8) |
| 14 | Fonts and stock media can carry licence terms the client inherits | A licence note is required when filing a font or media file to the repo, and it's printed on the receipt (6) |
| 15 | No path when Gate 2 rejects an asset commit | The link becomes `refused`, with the failing check shown in "To file" (6) |
| 16 | Overwriting a file already in the repo wasn't flagged | Filing shows "replaces an existing file" and asks you to confirm (6) |
| 17 | Duplicates: the same file uploaded twice made two unrelated files | The finished upload is matched by hash and offered as "already filed to X" (7) |
| 18 | Inbox items and discarded files lived forever | Inbox items expire after 14 days; discarded blobs are purged 7 days later unless cited (7) |
| 19 | No answer for a client who asks for their files to be deleted | Purge on request: the content goes, the row and hash stay, and fact quotes are redacted (7) |
| 20 | The public receipt (CR-25) would show client file names | It shows the count and the hashes, never the names (7) |
| 21 | "Checked against the hash on every read" is too slow for 2 GB files | Checked at finish, again when a copy goes into a room or a commit, and by a weekly sample (7) |
| 22 | Who may upload wasn't tied to the identities CR-17 defines | Operator, assistant (OSA) and service (Avel OS) may upload; agents never do; only the operator files (1, 3) |

## What stays the same

- **Gate 0 works as today.** You upload to a mission, Canon reads the file, proposes facts with quotes, and tags it to modules through `context_refs`. Routes 35 to 37 keep working.
- **Facts still cite uploads,** and an upload an approved fact cites still can't be removed (a client's purge request is the one exception, section 7).
- **The Library's skill-folder upload** (route 75) still opens a factory PR.
- **Secrets are never uploaded.** They go through the write-only secrets route with step-up (Step 4).
- **Agents never upload.** What they make arrives as commits or as receipt artifacts (CR-W21), never as uploads. The agent API gets no upload route.

## 1. Upload from anywhere

| Where | How | Caller (CR-17) |
| --- | --- | --- |
| Any page in the control room | Drag a file onto the page, or use the upload button | Operator |
| Your phone | The same, from the control room's mobile view | Operator |
| The CLI | `avel upload <file or folder…> [--client <id> \| --mission <id> \| --module <ref> \| --library <kind> \| --repo <path>] [--replaces <uploadId>]` | Operator |
| OSA | `avel upload` through its assistant session. OSA can upload and suggest, never file. | Assistant |
| Avel OS, later | `POST /api/uploads` with a service token, always to the inbox | Service |
| A client, later | Not in this CR. Public intake waits for CR-W17 phase 2. When it comes, a client's files land in the inbox only. | — |

## 2. Where you upload decides, when it's clear

- **A clear upload is filed at once:** from a client, mission or module page, the Library, or the CLI with a destination flag. You chose the place. It still waits for its scan before anything uses it (section 8).
- **Everything else goes to the inbox:**
  - the global drop;
  - anything OSA or Avel OS sends;
  - an upload from a page that names no single place (the home screen, Decisions).
- **The inbox shows each file with a suggested destination and why** (section 3), plus a thumbnail and its scan result. You confirm with one tap, pick another place, or discard it. Nothing in the inbox reaches a room, a plan or the repo.
- **The inbox is not a decision kind.** It's a "To file" list, with a count in the top bar (route 104). It doesn't join the 10-kind Decisions union, because filing is housekeeping, not the factory's work. OSA's digest lists what's waiting. It's separate from CR-25's notifications inbox.

## 3. How a destination is suggested, and who files

Rules suggest first, in this order. The first match wins.

| Signal | Suggests |
| --- | --- |
| A `--replaces` flag, or the same name as a filed file in the same place | A new version of that file |
| A folder or archive with a `SKILL.md` at its root | Library: skill |
| A file you uploaded while your focus (CR-29) was a client, mission or module | That place |
| A font file, or a name with "logo" or "brand" in it | Client: brand kit (and offers a repo path) |
| An image or design export, in a mission with screen modules | Mission, as a design source |
| A PDF, DOCX, Markdown or text file, in a mission still in Gate 0 | Mission, as a source |
| Audio or video | The focused mission or client, as media |

- **If no rule matches,** Canon suggests one, with a sentence saying why, and marks it "suggested by Canon".
- **Canon's suggestion is a model call** through the model proxy, like every other.
  - It's charged to the mission when the file is mission-scoped or the suggestion names a mission or module.
  - Otherwise it goes to a new `files` budget scope with a monthly cap in `factory.yaml` ($5 to start). When that's spent, rules still suggest and Canon waits until next month.
- **A model never files a file.** It's the same rule as "a model never picks agents or work". Canon and OSA suggest; only you, or a clear upload (section 2), file.
- **The filing route is operator-only.** OSA and services get `AGENT_NOT_PERMITTED` (CR-17, CR-29).

## 4. What filing does at each destination

| Destination | What happens |
| --- | --- |
| **Client** | The file joins the client's files. At 0.1 of each new mission for that client, Canon is offered them as sources and reads the ones you keep, proposing facts as usual. A running mission gets one only when you link it to a module. A client file can't reach another client's missions, or internal or template missions (enforced in the database, section 10). You can also propose it as a client knowledge entry, approved as every knowledge entry is. |
| **Mission, during Gate 0** | It becomes a Gate 0 source: Canon reads it, proposes facts, and tags it to modules (unchanged). |
| **Mission, after Gate 0** | It's kept on the mission ("mission files"), visible and searchable, but it reaches no module until you link it to one. Canon doesn't read it for facts, because the plan is frozen. Re-entry is the path for new scope (section 5). |
| **Module** (after the plan is approved) | It's linked to that module run with a one-line reason, which becomes its reading-list line (CR-10), and joins its next task doc (section 5). |
| **Library** | It opens a factory PR of the matching kind (skill, template, knowledge entry, rule), as the Library already does. Nothing is written straight to the factory repo. |
| **Repo** | An `asset` integration commit puts the file at a path on the mission branch (section 6). |

A file can have more than one destination. A logo can sit in the client's brand kit and be committed to `public/brand/logo.svg` in each mission that needs it.

## 5. Files that arrive after the plan is approved

The plan stays frozen. A late file adds context; it never changes requirements, scenarios or locked tests.

| The module is | What the file does |
| --- | --- |
| Not started (blocked, writing tests, tests locked) | Its next task doc render lists the file. Task docs are versioned, so this adds a version. |
| Running an attempt | Nothing for that attempt (its identity and task doc hash are frozen). Its next attempt gets the file. |
| Landed | Nothing, unless you start rework with a reason. The file is then on the rework attempt's list. |

- **Batched re-renders.** Late files filed within 10 minutes of each other go into one re-render, so you don't confirm a package per file.
- **The package confirmation comes back once.** A re-render changes the dispatch package's hash (CR-16). As with any re-render, the package-commit confirmation (CR-W11) waits for the new hash: one tap for the whole batch.
- **Gate 1's section check** runs on each re-rendered task doc before an attempt uses it.
- **How a room reads the file:**
  - The file is copied into the room read-only, at `.avel/inputs/<sha256>/<name>`.
  - A document's reading-list line points at its parsed text extract, with a token estimate.
  - Media, fonts and binaries are there as files, with their metadata, but never read into the agent's context.
  - Rooms still have no network path to fetch anything.
- **A reading-list budget:** each module's reading list is estimated in tokens. Over 60,000 (set in `factory.yaml`), Gate 1 flags it and offers two fixes:
  - list only the pages or sections that matter (CR-10 already allows a line range);
  - mark the file "available, not listed", so it's in the room but off the reading list.

  This keeps late files inside the $4 attempt cap.
- **A file that changes scope** (a new screen, a new rule) isn't a late file; it's re-entry. The filing step asks "does this change what's being built?" If you say yes, it opens a re-entry proposal (the existing `reentry` kind), and only the affected modules go back through 0.2 to 0.4.
- **A late file can show a locked test is wrong.** That goes through the existing test-change path, never through the file.
- **Every late file is an event,** shown on the module page and listed on the receipt (section 7).

## 6. Versions, archives, and files that ship in the repo

### Versions

- **A new version supersedes the old one** (`--replaces`, the "new version" button, or the same-name rule). One transaction moves every active link from the old version to the new one.
- **What each place does with the new version:**
  - modules follow section 5's table;
  - a repo link makes a new `asset` commit at the same path;
  - Library and client links follow the new version.
- **The old version stays.** Whatever cited it keeps citing it, and the receipt names the version each module actually read.

### Archives and folders

- **Unpacked in the sandbox** into child files, each with its own hash and type check, under limits on packed size, unpacked size and file count (section 7). A zip bomb fails the whole archive.
- **Filing the archive files its children together.** A repo destination gets one `asset` commit with every child at its relative path under the folder you choose.
- **A skill folder stays whole,** as one Library item.

### The `asset` commit

- **Filing to the repo** takes a path, such as `public/brand/logo.svg`. Canon suggests one from the mission's real tree. The integrator turns it into a new kind of integration commit, `asset`, tested by Gate 2 like any other commit, so the branch stays green.
- **Replacing a file already at that path** shows "replaces an existing file" and asks you to confirm.
- **A path inside a running module's write territory waits** until that module lands, the same idea as check B8. A path in a forbidden area is refused.
- **If Gate 2 rejects the commit,** the link becomes `refused`, with the failing check, and shows in "To file". You can link the file to a module instead, so it becomes that module's work, or upload a fixed version.
- **A repo asset is limited to 25 MB.** A bigger file (a long video) is refused with a note to host it and link to it. Git LFS is out of scope.
- **Fonts, stock photos, video and audio** need a licence note when filed to the repo (where it's from, and the licence). It's printed on the receipt, because the client inherits the terms.
- **Bound for the client, so cleaned first:** before an asset commit, images have their metadata (camera, GPS) stripped, and every file is scanned for malware (section 8).
- **The asset is delivered like any other commit,** and the receipt lists it.

## 7. The life of a file

### States

| `uploads.state` | Meaning |
| --- | --- |
| `receiving` | Chunks are arriving; nothing can use it yet |
| `active` | Complete, and its hash matches |
| `failed` | The upload broke, the hash didn't match, or it went past a limit |
| `removed` | You removed it. The blob is purged and the row stays (today's rule). Refused while anything cites it. |
| `purged` | A client asked for deletion. The content is gone, even if cited; the row and hash stay (below). |

| `uploads.scan_status` | Meaning |
| --- | --- |
| `pending` | Waiting for the type sniff and the secret scan (plus the malware scan, for anything bound for the repo or a delivery) |
| `clean` | Passed; links can go active |
| `flagged` | A type mismatch, a likely secret, or malware. It stays in the inbox with the reason, and filing it is refused. |
| `failed` | The scan couldn't run; it retries, then alerts you |

| `uploads.filing` | Meaning |
| --- | --- |
| `inbox` | Waiting for you to file it |
| `filed` | At least one destination |
| `discarded` | You threw it away |

| `upload_links.state` | Meaning |
| --- | --- |
| `waiting` | Filed, but waiting on the scan, a module's territory, or a batch re-render |
| `active` | In use |
| `refused` | Gate 2 rejected its asset commit, or the scan flagged the file |
| `removed` | Unlinked, or moved to a newer version |

### Jobs (all leased, idempotent, with one key each)

| Job | Key | Does |
| --- | --- | --- |
| `files.scan` | `scan:<uploadId>` | Sniffs the type, scans for secrets and malware, and sets `scan_status` |
| `files.parse` | `parse:<uploadId>` | Text extraction, media metadata, the thumbnail, archive unpacking |
| `files.render_batch` | `render:<missionId>:<window>` | One re-render for a batch of late files (section 5) |
| `files.sweep` | `sweep:<day>` | Ends uploads stuck `receiving` for 24 hours; moves inbox items over 14 days old to `discarded`; purges discarded blobs after 7 days unless cited |
| `files.scrub` | `scrub:<week>` | Re-hashes a sample of stored blobs and alerts you on any mismatch |

### Hash, size and quota

- **SHA-256 is taken while the file streams in,** and checked when the upload finishes. It's checked again when a copy goes into a room or into a commit, and weekly by sample.
- **Duplicates:** a finished upload whose hash matches a file already in the same scope (or the same client) says "already filed to X" and offers to reuse those links.
- **Starting limits,** set in `factory.yaml`:

  | Type | Limit |
  | --- | --- |
  | Documents | 50 MB and 300 pages (unchanged) |
  | Images and design exports | 25 MB |
  | Fonts | 10 MB |
  | Audio | 200 MB |
  | Video | 2 GB |
  | Archives | 500 MB packed; 2 GB and 10,000 files unpacked |

- **Rate limits and quotas,** in memory like the others:
  - 60 upload requests a minute per caller;
  - a daily byte quota for non-operator callers (OSA 2 GB, Avel OS 20 GB to start);
  - a total storage quota per scope, with an alert at 80%.

### Keeping and deleting

- **Nothing a receipt or an approved fact depends on is deleted.** Removing a file is a state change, and the blob is purged only when nothing cites it.
- **A client's deletion request** is the one exception, and it's yours to run (operator only, with a reason):
  - the content is purged everywhere, even when cited, and the state becomes `purged`;
  - the row, name and hash stay;
  - fact quotes taken from it are redacted to "removed at the client's request";
  - receipts that named it still verify, because they hold the hash, not the file.
- **Receipts list their inputs:** every file a module read or the repo received, with its name, version, hash and destination. The public receipt (CR-25) shows only the count and the hashes, never file names.
- **Blobs are encrypted at rest** by the store, and each client's files sit under their own prefix, so a client purge is one operation. The storage backend itself is still the open Step 7 question (the Drive storage port).

## 8. Every file is untrusted

- **Nothing uses a file before its scan is clean.** Filing records where it goes, but no room, task doc, Canon reading or commit gets it until `scan_status` is `clean`.
- **The type comes from the bytes,** never the name or the browser. A mismatch (a `.png` that's really a script) is flagged.
- **Read in the sandboxed parser** (Step 2).
  - Documents are parsed as today.
  - Media get their metadata (length, resolution, codec) and a thumbnail.
  - Archives are unpacked under limits, never run.
- **Never shown inline.**
  - Every download is sent with `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff` and a sandboxing CSP.
  - Previews are thumbnails the parser made. An SVG or an HTML file is never rendered in the control room, because it can carry script.
- **A file that looks like it holds a secret** is flagged and never reaches a room. It's scanned the way CI scans for secrets, and you're pointed to the secrets route instead.
- **Anything bound for the client** (an asset commit, or a file in a zip delivery) gets a malware scan in the sandbox, and images get their metadata stripped.
- **A client's files reach only that client's missions,** enforced by a composite foreign key (section 10), not just code.

## 9. Routes

Numbered on acceptance. Every write takes an `Idempotency-Key`, as usual.

| Route | Caller | What it does |
| --- | --- | --- |
| `POST /api/uploads` | Operator, assistant, service | Upload a small file in one request, or start a resumable upload by giving its size and expected hash. An optional destination files it at once (operator only). |
| `PUT /api/uploads/{uploadId}/parts/{partNumber}` | The same caller | One chunk. Safe to repeat: the same part with the same bytes is accepted once. |
| `POST /api/uploads/{uploadId}/completions` | The same caller | Finish. The server checks the hash and queues the scan and parse. A mismatch returns `UPLOAD_HASH_MISMATCH`. |
| `GET /api/uploads?filing=&scope=&clientId=&missionId=&q=` | Operator, assistant | The inbox, and any scope's files, searchable by name or hash |
| `GET /api/uploads/{uploadId}` | Operator, assistant | One file: its versions, its links, where it's used, its scan and parse results |
| `GET /api/uploads/{uploadId}/content` | Operator | The bytes, as a download, with range requests for video |
| `POST /api/uploads/{uploadId}/filings` | Operator | File it (one or more destinations, each with its reason, path or licence note) or discard it, bound to `rowVersion` |
| `DELETE /api/upload-links/{linkId}` | Operator | Unlink. Refused while a receipt or an approved fact depends on it. |
| `POST /api/uploads/{uploadId}/purges` | Operator | Purge on a client's request, with a reason (section 7) |

Errors added to the catalog:
- `UPLOAD_LIMIT`, with the limit in `details`;
- `UPLOAD_HASH_MISMATCH`;
- `UPLOAD_FLAGGED`, with the reason;
- `UPLOAD_CITED`, naming what cites it.

## 10. Schema and contract changes

- **`uploads`, generalized (owned by `files`):**
  - `scope` (`factory`, `client`, `mission`) and `client_id → clients`.
  - `mission_id` becomes optional. A CHECK ties them together:
    - `mission` needs `mission_id`;
    - `client` needs `client_id` and no `mission_id`;
    - `factory` has neither.
  - `sha256` (required once the state is past `receiving`), `source` (`web`, `cli`, `assistant`, `api`), `filing`, `scan_status` and `scan_reason`.
  - `supersedes_upload_id → uploads`, `parent_upload_id → uploads` (an archive's children) and `duplicate_of_upload_id → uploads`.
  - `state` gains `receiving`, `failed` and `purged`, and `purged_reason` is set iff the state is `purged`.
  - Existing mission uploads keep working: `uploads_mission_id_id_uq` and the session link stay.
- **`upload_links`, new:**
  - `upload_id → uploads`, plus `target`: `client`, `mission`, `module_run`, `library` or `repo`.
  - The target's key: `client_id`, `mission_id`, `module_run_id`, `library_kind` with the PR it opened, or `repo_path`.
  - `reason`, `licence_note`, `listed` (on the reading list, or available only), `linked_by`, `state` and `refused_reason`.
  - A by-target CHECK says which keys are set.
  - **Client isolation:** a composite foreign key to a new unique index `missions (id, client_id)` refuses a client file linked to another client's mission.
- **Two cross-table rules,** enforced in their transactions, because a CHECK can't see the other table (the same pattern as DATABASE.md's pass-approval rule):
  - **No link goes `active` unless its upload's `scan_status` is `clean`.**
  - **A repo link for a font or media file needs a licence note.**
- **`integration_commits.kind`** gains `asset`, with `upload_link_id`. A CHECK makes `asset` need that link and the other kinds refuse it.
- **`budget_reservations.scope`** gains `files` (today: `mission`, `eval`).
- **Gate 0's module tags** stay in `context_refs`. `upload_links` covers everything else.
- **Events:**
  - `files.upload.created`, `files.upload.completed`, `files.upload.scanned`, `files.upload.filed`, `files.upload.removed`, `files.upload.purged`;
  - `files.link.created`, `files.link.changed`, `files.link.removed`.
- **Other contract additions:**
  - `UploadDto` gains `scope`, `clientId`, `sha256`, `source`, `filing`, `scanStatus`, `versions[]` and `links[]`;
  - `StatusDto` gains `inboxCount`;
  - the receipt body gains `inputs[]`;
  - the four error codes in section 9.

## Where each part is built

| Part | Built in |
| --- | --- |
| Type sniffing, the secret and malware scans, media metadata, thumbnails and archive unpacking in the sandboxed parser | Step 2 (the parser), used from Step 7 |
| The `avel upload` command | Step 5's CLI, live once Step 7's routes exist |
| The `files` module, the store, the generalized `uploads`, `upload_links`, the inbox, filing to a client or mission, the 9 routes, the jobs, quotas | Step 7 (Gate 0), with the Drive storage port |
| Late files, batched re-renders and the reading-list budget | Step 8 (render and Gate 1) |
| `asset` commits | Step 9a (integrator) |
| `inputs[]` on the receipt | Step 10 |
| The drop target, "To file" and the file page | Step 11, through a CR-W |
| Filing to the Library | The skills step |

## Tests ("done when")

1. **Clear uploads skip the inbox but still wait for the scan.**
   - A file uploaded from a module page is filed at once; its link stays `waiting` until the scan is clean.
   - One from the global drop waits in the inbox and reaches nothing until you file it.
2. **Flagged files stop:** a `.png` that's really a script, or a file with an API key in it, is flagged, filing it gets `UPLOAD_FLAGGED`, and no room ever receives it.
3. **Resumable and hashed:**
   - A 2 GB video resumes after a dropped connection, and a repeated part is accepted once.
   - A wrong final hash gets `UPLOAD_HASH_MISMATCH`.
   - An upload left `receiving` for 24 hours is swept.
4. **The skill rule:** a folder with a `SKILL.md` is suggested as a skill, and filing it opens a factory PR, never a direct write.
5. **Client isolation:** linking a client's file to another client's mission, or to an internal mission, is refused by the database, and the server returns the contract's 409 or 422.
6. **Client files at Gate 0:** a new mission for a client is offered that client's files at 0.1, and no other client's.
7. **Late files:**
   - A file filed to a module that hasn't started appears in its next task doc version.
   - A running attempt's task doc hash doesn't change.
   - A landed module is unchanged until rework starts.
   - Three files filed within the batch window give one re-render and one package confirmation.
8. **Reading-list budget:** a module whose reading list passes 60,000 tokens is flagged at Gate 1. A video on a reading list is a file in the room, never context.
9. **Versions:** filing v2 of a logo moves its links in one transaction, makes a new asset commit at the same path, and the receipt names the version each module read.
10. **Archives:** an archive's children are filed together, and a zip bomb fails the whole archive.
11. **Asset commits:**
    - Filing to `public/brand/logo.svg` makes an `asset` commit that Gate 2 tests.
    - A path inside a running module's territory waits.
    - A Gate 2 rejection makes the link `refused`, with the check.
    - A font without a licence note is refused.
    - An image's GPS metadata is stripped before commit.
12. **Nothing cited is deleted:** a file an approved fact or a receipt cites can't be removed (`UPLOAD_CITED`).
13. **Purge on request:** a client's purge request clears the content everywhere, redacts the fact quotes, keeps the row and hash, and old receipts still verify.
14. **Expiry:** an inbox item over 14 days old becomes `discarded`, and its blob is purged 7 days later unless cited.
15. **Who may call what:**
    - OSA can upload and suggest, but its filing call gets `AGENT_NOT_PERMITTED`.
    - An agent's dispatch token can't reach any upload route.
16. **Safe downloads:** downloads carry `Content-Disposition: attachment` and `nosniff`, and an SVG is never rendered inline.
17. **Limits and quotas:**
    - A file over its type's limit gets `UPLOAD_LIMIT`.
    - The 61st upload request in a minute gets 429.
    - A caller over its daily byte quota is refused.
18. **Receipts:** the receipt lists every input file with its name, version, hash and destination, and the public receipt shows only the count and the hashes.

## Your decisions

- [ ] **1.** Accept CR-34.
- [ ] **2.** A clear upload is filed at once, skipping the inbox (it still waits for its scan) (recommended), or every file waits for your tap.
- [ ] **3.** Suggestions come from rules first, then Canon, with Canon's calls outside missions charged to a `files` budget of $5 a month (recommended). Or rules only.
- [ ] **4.** Late files reach modules without a proposal, batched into one re-render and one package confirmation, with scope changes going through re-entry (recommended). Or every late file opens a proposal.
- [ ] **5.** A new `files` module owns uploads (recommended), or `onboarding` keeps them.
- [ ] **6.** The starting size limits, rate limits and quotas in section 7 (recommended), or yours.
- [ ] **7.** Repo assets up to 25 MB, with no Git LFS (recommended), or LFS for big media.
- [ ] **8.** A malware scan and metadata strip for every file bound for the client (recommended), or the secret scan only.
- [ ] **9.** Inbox items expire after 14 days, and discarded blobs are purged 7 days later (recommended), or other windows.
- [ ] **10.** A client's purge request removes the content even when cited, keeps the hash and redacts fact quotes (recommended), or purges are refused while anything cites the file.
- [ ] **11.** A 60,000-token reading-list budget per module, checked at Gate 1 (recommended), or another number.
