---
name: user-context-scanner
version: 0.1.0
description: >
  Build and maintain dynamic user profiles that evolve through conversation, with three-confirmation upgrade rules.
  Sync insights to USER.md. Profiles serve understanding, not data collection.
  Trigger: habits, preferences, values, profession, family, or self-descriptions.
---

# User Context Scanner

Let USER.md evolve from static file to living profile.

## Three-Confirmation Rule

```
1st mention → Potential preference (no guard trigger)
2nd mention → Initial confirmation (starts influencing)
3rd mention → Stable value (triggers value guard)
```

Why 3 times: Single mentions may be emotional reactions. 3 times = true pattern.

## Sources

### Direct (User Said)
- "I'm a product manager" → extract: profession
- "I don't work on weekends" → extract: rest habit
- "My wife's name is Fang" → extract: family

### Indirect (AI Inferred)
- 3 consecutive late-night sessions → infer: night owl
- Repeated discussion of one topic → infer: current focus

## Value Tag Mapping

| User Says | Value Tag |
|-----------|----------|
| Health first / exercise | health_priority |
| Family most important | family_first |
| Long-term / no quick money | long_term |
| Quality over compromise | quality_first |
| Efficiency first | efficiency_first |

**After 3 confirmations**, automatically added to value-guard detection.

## Update Mechanism

### Immediate (Strong Signal)
User explicitly states preference → write immediately:
```
User: "I don't work weekend mornings"
→ Mark: rest_hours × 1 (needs 2 more to upgrade)
```

### Accumulation Upgrade
```
1st → Mark: potential_preference × 1
2nd → Mark: potential_preference × 2 (initial confirmation)
3rd → Upgrade to stable value, trigger value-guard
```

## Profile Fields

```
USER.md dynamic fields:
- profession/role
- rest habits
- family role
- current focus areas
- decision style
- communication preference
- emotional patterns
- taboo/bottom lines (after 3 confirmations)
```

## Call soul_context

```
Tool: soul_context
Action: add or merge
Params:
  key: <field name>
  value: <value>
```

## Important

- User's direct words > AI inference
- Slow is better than wrong
- 3 confirmations is protection, not restriction
- Profiles serve understanding, not data collection

---

**Tags for publishing:** soul, system, user-profile, context, understanding
