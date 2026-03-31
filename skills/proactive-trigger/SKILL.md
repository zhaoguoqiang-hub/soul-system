---
name: proactive-trigger
version: 0.1.0
description: >
  Proactively check in at the right moment based on user patterns, with learning silence and acceptance weighting.
  File-based tracking works standalone. Use proactive-engine plugin for enhanced attention budget management.
  Trigger: goal near completion (80%), burnout signals, appropriate times, or recalling past commitments.
---

# Proactive Trigger System

From "passive response" to "understanding companion".

## Architecture

**Standalone mode**: File-based tracking in `memory/trigger-state.json`
**With plugin**: Uses `soul_focus`, `soul_proactive` tools for unified management

## Five Trigger Sources

| Type | Description | Trigger Condition |
|------|-------------|-------------------|
| goal_based | Goal reminder | Sub-goal complete / 80% milestone |
| time_habit | Time habit | User's usual time patterns |
| context | Context change | External events affecting goals |
| reflection | Insight from reflection | Valuable finding from reflection |
| pending_task | Incomplete task | Task >4 hours without closure |

## Pre-Check (Required Every Time)

```
1. Check focus mode flag
   → If ON, skip and note in trigger-state

2. Check current time
   → Deep night (after 23:00) = skip

3. Check today's trigger count (in trigger-state.json)
   → If >= 3 used today, skip

4. Check cooldown
   → Less than 4 hours since last trigger = skip
```

## Learning Mechanism (Standalone)

Maintain `memory/trigger-state.json`:

```json
{
  "today": "2026-03-31",
  "triggerCount": 2,
  "lastTrigger": "2026-03-31T20:00:00+08:00",
  "typeCooldowns": {
    "goal_based": "2026-03-31T20:00:00+08:00",
    "rejections": {"goal_based": 0, "time_habit": 0}
  },
  "acceptedStreaks": {"goal_based": 2, "time_habit": 0}
}
```

### Rejection Learning (Standalone)
```
3 consecutive rejections → that trigger type silenced for 24 hours
```
Update rejections count in trigger-state.json. Skip that type until cooldown expires.

### Acceptance Reward (Standalone)
```
Each acceptance → acceptedStreaks[type] += 1
```

## Time Windows

| Time | Trigger? | Notes |
|------|---------|-------|
| 07:00-09:00 | ✅ Brief | Morning greeting |
| 09:00-12:00 | ✅ Work | Golden hours |
| 12:00-14:00 | ⚠️ Cautious | Lunch, brief only |
| 14:00-18:00 | ✅ Work | Afternoon |
| 18:00-22:00 | ✅ Care | After work |
| 22:00-07:00 | ❌ Never | Deep night |

## Message Format

Every proactive message must have:

1. **Specific reason**: Why AI is saying this now
2. **Non-intrusive**: End with question, not command
3. **Helpful**: Imply assistance, not pressure
4. **Connected to user**: Reference past conversation

## Examples

**Bad:** "Goal 'product design' has 3 days without update"

**Good:** "I noticed you discussed product design a lot this week. You said user experience matters most — how's that direction going?"

## Cooldown (Standalone)

- Max 3 per day (tracked in trigger-state.json)
- Min 4 hours between triggers
- Same topic: 1 hour minimum
- Rejected 3 times → 24-hour silence for that type

## Call soul_proactive (With Plugin)

```
Tool: soul_proactive
Action: check
Params:
  context: <current context description>
```

---

**Tags for publishing:** soul, system, proactive, trigger, check-in, companion

**Requires nothing** — file-based tracking works standalone.
