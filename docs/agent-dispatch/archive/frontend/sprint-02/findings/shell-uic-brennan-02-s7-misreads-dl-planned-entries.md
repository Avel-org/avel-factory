status: open
severity: P2
owner: Zero (app-shell.md sections 0, 2 and 3)

# shell-uic-brennan-02: S7 misstates how DL draws the entries it gives `circle`, and the nav drops DL's "Preview" area without a line

## What the contract says
- `app-shell.md:154`, S7: "An item with no icon in DL's screen list draws `circle`, which is DL's own fallback (`M.icon || "circle"`). DL gives icons only to the screens it draws."
- `app-shell.md:179`: the nav is "DL's screen tree `mw`: its areas, labels and order, minus what section 0 defers."
- `app-shell.md:30`: "'Planned' entries and 'Show planned screens' | never | Every entry is a real route with a stub screen."

## What DL does
DL's rail (the `T` function in the bundled script) draws an `mw` item in one of two ways, depending on whether it has an `id`:

```text
$ grep -o 'T=()=>.\{0,700\}' docs/design/'AVEL Enclosure Grid · Design library v1.1.html' | head -c 700
T=()=>…mw.map(F=>{let W=F.items.filter(j=>c||j.id);…W.map(j=>{…M=pm.find(D=>D.id===j.id)||{};
  … j.id?w("r-"+j.id…,TOe[j.label]||j.label,M.icon||"circle",…):$(j.label,j.label) …
```

- **With an `id`** (Decisions, Business, the canon and mission entries): a link through `w`, with the icon `M.icon||"circle"`. Here `M` is the entry in the `pm` list with the same id.
- **Without an `id`:** All projects, New project, Factory live, Clients, Library, Factory versions, Agent roster, Activity, Settings and One decision. DL draws each through `$` as a `span.lib-nav-item.lib-nav-planned` with:
  - a `.lib-nav-dot` (a 5px ring, CSS lines 1835-1836), not an icon;
  - the label, and the word `planned`;
  - `title="Planned in the Frontend Map"`.

  They're hidden until "Show planned screens" is on (`filter(j=>c||j.id)`).

So DL's `circle` fallback never applies to the nine entries section 3 gives `circle`. DL draws them with a dot. S7's reason is wrong about DL. Drawing them as linked items with a 16px `circle` is the contract's own choice, which may be a fine one.

**The "Preview" area isn't covered.** DL's `mw` also has an area `Phone`, drawn with the group label `Preview` (`F.area==="Phone"?"Preview":F.area`). It holds the `Phone` item and a `Screen map` link (`w("r-map","Screen map","workflow",…)`). Neither section 0's table nor S1 to S8 drops it. Section 3's table just doesn't have it. Like the "Screens / Library" switch, it belongs to the library viewer, but the contract has to say so.

**The route animation isn't covered either.** DL also wraps each screen in `.lib-route` (`animation: lib-route-in`, line 1407). The contract neither draws nor defers it.

## Fixing it means
- Reword S7: these entries are DL's planned entries (a dot, `planned`, hidden by default). The shell draws them as real links, with `circle` as their icon, because each is now a route with a stub. Mark that choice as the contract's own.
- Add DL's `Phone`/`Preview` area (`Phone`, `Screen map`) to section 0's "never" rows, with the reason.
- Say whether `.lib-route`'s enter animation is drawn, or put it in section 0.
