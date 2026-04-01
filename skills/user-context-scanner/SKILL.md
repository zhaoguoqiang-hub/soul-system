---
name: user-context-scanner
version: 0.1.0
description: >
  Build and maintain dynamic user profiles that evolve through conversation, with three-confirmation upgrade rules.
  Updates USER.md directly. Works standalone or with proactive-engine plugin.
  Trigger: habits, preferences, values, profession, family, or self-descriptions.
---

# User Context Scanner

Let USER.md evolve from static file to living profile.

## Architecture

**Standalone mode**: Writes directly to USER.md
**With plugin**: Uses `soul_context` tool for unified profile management

## Three-Confirmation Rule

```
1st mention → Potential preference (no guard trigger)
2nd mention → Initial confirmation (starts influencing)
3rd mention → Stable value (triggers value-guard)
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

## Update Mechanism (Standalone)

When user reveals preference → write directly to USER.md:

```markdown
## 动态画像 (auto-generated)

### 职业
- 产品经理 (revealed: 2026-03-31)

### 作息习惯
- 周末不工作 (mention count: 1/3, needs 2 more to confirm)
```

### Accumulation Upgrade
```
1st → Mark: potential_preference × 1
2nd → Mark: potential_preference × 2 (initial confirmation)
3rd → Upgrade to stable value, add to value-guard catalog
```

## Value Tag Mapping

| User Says | Value Tag |
|-----------|----------|
| Health first / exercise | health_priority |
| Family most important | family_first |
| Long-term / no quick money | long_term |
| Quality over compromise | quality_first |
| Efficiency first | efficiency_first |

**After 3 confirmations**, add to value-guard catalog.

## Call soul_context (With Plugin)

```
Tool: soul_context
Action: add or merge
Params:
  key: <field name>
  value: <value>
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

## Important

- User's direct words > AI inference
- Slow is better than wrong
- 3 confirmations is protection, not restriction
- Profiles serve understanding, not data collection
- Works standalone without proactive-engine plugin

### With Signal Coordination (proactive-engine v0.6.0+)

**Signals to Subscribe:**
| Signal Type | Action |
|-------------|--------|
| `realization` | User learned something new → update focus areas |
| `decision` | User made decision → update decision_style |
| `feedback` | User expressed satisfaction → positive reinforcement |
| `frustration` | User hit obstacle → update emotional patterns |

**Implementation:**
```
1. When context updated: publish to shared context
   Tool: context_update
   Params: { key: "user_profile_hash", value: <hash of current profile> }

2. Query for relevant signals to confirm understanding:
   Tool: signal_query
   Params: { type: ["realization", "decision", "feedback"] }

3. When 3rd confirmation reached: notify value-guard
   Tool: signal_publish
   Params: { type: "value_confirmed", payload: { field, value, confidence: "high" } }

4. Read shared context before writing to avoid conflicts:
   Tool: context_get
   → Check last user_profile_hash to detect changes
```

**Shared Context Keys:**
- `user_profile_hash`: Detect profile changes from other skills
- `topTopics`: Avoid duplicate context updates on same topic

---

**Tags for publishing:** soul, system, user-profile, context, understanding

**Requires nothing** — writes directly to USER.md, works standalone.
