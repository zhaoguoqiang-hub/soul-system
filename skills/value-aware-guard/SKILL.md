---
name: value-aware-guard
version: 0.1.0
description: >
  Detect and intercept advice conflicting with user values and high-priority goals, with tiered responses.
  File-based catalog works standalone. Use proactive-engine plugin for unified value tracking.
  Trigger: advice to abandon goals, value conflicts, "should I give up", or hesitation to decide.
---

# Value-Aware Guard

Protect user's core values and high-priority goals.

## Architecture

**Standalone mode**: File-based value catalog in `memory/values.jsonl`
**With plugin**: Uses `soul_value_guard` tool for unified detection and logging

## Three Tiers

| Severity | Condition | Action |
|-----------|-----------|--------|
| **High** | AI tempts to abandon priority>=8 goal | Block, replace with gentle alternative |
| **Medium** | Advice conflicts with known values | Alert user, ask for confirmation |
| **Low** | Minor conflict | Permit, add gentle reminder |

## High Severity Example
```
Detected: AI says "Forget it, this goal is too hard, give up"
→ Block, replace: "This goal is indeed challenging, but we've come so far.
  Maybe try a different approach?"
```

## Medium Severity Example
```
Detected: AI suggests late-night overtime, conflicts with "health rest" value
→ Alert: "You mentioned health is important. Will late-night work affect tomorrow?"
```

## Low Severity Example
```
Detected: AI suggests gaming for relaxation
→ Permit, add: "Just don't stay up too late"
```

## Value Catalog (Standalone)

Maintain `memory/values.jsonl` — one value per line:

```json
{"tag":"health_priority","source":"direct","mentions":3,"confirmed":true,"examples":["I exercise regularly","Health comes first"],"created":"2026-03-15"}
{"tag":"family_first","source":"indirect","mentions":2,"confirmed":false,"examples":["I spend weekends with kids"],"created":"2026-03-20"}
```

## Value Sources

Values come from user-context-scanner or manual addition.

### Core Value Tags

| Value Tag | Conflict Signals |
|-----------|------------------|
| health_priority | staying up late, skipping exercise, burning out |
| family_first | work over family, missing family time |
| long_term | quick money schemes, short-term gambling |
| quality_first | "good enough", compromises |

## Detection (Standalone)

Check AI's response against value catalog:
1. Parse AI response for conflict signals
2. Match against active values in `values.jsonl`
3. Determine severity level
4. Take action per tier

## Log Every Interception (Standalone)

Write to `memory/guard-log.jsonl`:

```json
{"timestamp":"2026-03-31T23:00:00+08:00","severity":"medium","detected":"overtime suggestion","matchedValue":"health_priority","action":"alerted","userResponse":"accepted"}
```

## Call soul_value_guard (With Plugin)

```
Tool: soul_value_guard
Action: check
Params:
  content: <content to check>
```

## Important

- Guarding is soft — final decision always with user
- Medium/low = reminder, not blocking
- Works standalone without proactive-engine plugin

---

**Tags for publishing:** soul, system, value, guard, ethics, safety

**Requires nothing** — file-based catalog works standalone.
