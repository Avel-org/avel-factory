---
description: Start one dispatch from its rendered task doc (docs/agent-dispatch/<team>/<sprint>/<task doc>)
argument-hint: <team>/<sprint>/<task doc>
---
Your dispatch is `docs/agent-dispatch/$ARGUMENTS.md` (`.md` is added if the argument doesn't end in it).

1. Read that task doc in full, every part, before you do anything else. It was rendered by `scripts/render.py` from the sprint's `plan.toml`. It is your whole briefing.
2. Its last section, **Activation**, is your activation prompt. Treat it as the operator's first message to you, and follow it exactly.
3. Work through Parts 2 to 7 in order. Part 2 lists what to read first, Part 5 is the only place you may write, Part 6 is how you work, and Part 7 is how you finish.

If the file doesn't exist, or it has no Activation section, stop. Say exactly which path you tried, and don't guess at the work.
