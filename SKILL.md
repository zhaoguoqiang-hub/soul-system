---
name: acontext-engine
description: >
  AContext — persistent context layer for AI agents. File-based, user-owned,
  cross-platform. Git-synced. JSON-standard. Agent-to-agent handoff.
version: 2.6.0
spec: spec/context-spec-v1.md
---

# AContext Engine v2.6

Persistent memory. JSON-standard. Git-synced. Agent handoff.

## Protocol

**Session start**:
0. `git pull --rebase` in `~/.acontext/` → get latest + sibling handoffs
1. Read `META.json` → verify agent registration
2. **Check `handoffs/{self}.json`** — new handoffs from sibling agents → acknowledge
3. Read `goals.json`, `profile.json`
4. Read `journals/{self}.jsonl` last 1 entry
5. Read `journals/` sibling jsonl last 1 entry each
6. Read `narratives.jsonl` last 3 entries
7. Read `adaptations.json` disabled rules
8. Read `feedback.jsonl` last 5 entries
9. Detect emotional baseline → pick atmosphere
10. If last own journal > 2h ago → proactive check

**During session**: zero checks. Silent atmosphere switches. `+` `-` `=` feedback.

**Session end** (batch):
1. Signals → append to `narratives.jsonl`
2. Emotional tone → append to `journals/{self}.jsonl`
3. Update `profile.json`
4. Update relationship metrics
5. **If significant task completed → write `handoffs/{target_agent}.json`**
6. Append journal entry
7. Update `reflections.json` if > 7d
8. Every 10th session → compression
9. `git add -A && git commit -m "agent:{self} YYYYMMDD HH:MM" && git push`

## Agent Handoff

Structured handoff between agents. Not a chat note — a contract.
Format: what's completed / pending / needed / file paths.
Acknowledge on receipt. Link in narratives for cross-agent task chain.
See [sub/handoff.md](sub/handoff.md).

## Profile Merge

Two agents update profile → git merge strategy: field-level timestamp arbitration.
Newer field wins for conflicts. Non-conflicting fields merge. Merge log appended.
See [sub/handoff.md](sub/handoff.md) merge section.

## Data Format

[spec/context-spec-v1.md](spec/context-spec-v1.md). JSON + JSONL.

## Git Sync

`~/.acontext/` = git repo. Pull at start, push at end. See [sub/git-sync.md](sub/git-sync.md).

## Feedback · Compression · Transparency · Privacy · Atmosphere · Budgets

(unchanged from v2.5 — see [sub/](sub/) and [references/](references/))

## Sub-skills

atmosphere-regulator | value-aware-guard | proactive-trigger | user-context-scanner | narrative-memory | bootstrap | feedback | git-sync | **handoff** ← new

## References

[VISION.md](VISION.md) · [ROADMAP.md](ROADMAP.md) · [spec/context-spec-v1.md](spec/context-spec-v1.md) · [references/](references/)
