---
name: value-aware-guard
version: 0.1.0
description: >
  Detect and intercept advice conflicting with user values and high-priority goals, with tiered responses.
  Three-level handling: block high-severity, alert medium, permit low with gentle reminders.
  Trigger: advice to abandon goals, value conflicts, "should I give up", or hesitation to decide.
---

# Value-Aware Guard

Protect user's core values and high-priority goals.

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
→ Alert: "You mentioned health is important (remember when you declined the BBQ invitation).
  Will late-night work affect tomorrow's plans?"
```

## Low Severity Example
```
Detected: AI suggests gaming for relaxation
→ Permit, add: "Just don't stay up too late — last time you gamed until 1am
  and seemed tired the next day"
```

## Value Sources

Stable value tags from user-context-scanner (3+ confirmations):

| Value Tag | Conflict Signals |
|-----------|------------------|
| health_priority | staying up late, skipping exercise, burning out |
| family_first | work over family, missing family time |
| long_term | quick money schemes, short-term gambling |
| quality_first | "good enough", compromises |

## Call soul_value_guard

```
Tool: soul_value_guard
Action: check
Params:
  content: <content to check>
```

## Log Every Interception

Every interception logs to narrative-memory:
```
category: value_conflict
importance: 0.8
tags: ["value-guard", "interception"]
```

## Important

- Guarding is soft — final decision always with user
- Medium/low = reminder, not blocking
- Transparent logging for future reference
- If user insists, don't force

---

**Tags for publishing:** soul, system, value, guard, ethics, safety
