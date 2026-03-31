---
name: narrative-memory
version: 0.1.0
description: >
  Capture and weave meaningful moments into vivid narrative memories with time, emotion, and scene.
  Works standalone or with proactive-engine plugin for enhanced storage and retrieval.
  Trigger: milestone, decision, value judgment, emotional turning point, first-time experience, or reflection.
---

# Narrative Memory System

Let AI remember who you are, not what you said.

## Architecture

**Standalone mode**: Writes to `memory/narrative.jsonl` (line-delimited JSON)
**With plugin**: Uses `soul_narrative` tool for unified storage and retrieval

## Three-Layer Memory Design

### Layer 1: Ignore
These don't deserve memory space:
- Simple confirmations: "ok", "yes", "got it"
- Small talk about weather, daily stuff
- Repetitive factual Q&A
- Date/time queries

### Layer 2: Accumulate First
Not important alone, but meaningful when repeated:
- Same topic mentioned multiple times
- Repeated emotional patterns (e.g., saying "tired" 3 times)
- Habitual actions (e.g., discussing products every Friday)

**Do not write immediately**. Mark in context: "topic X mentioned for the Nth time"

### Layer 3: Write Narrative Memory (Essence Only)

Trigger "write scene" for:

| Type | Signal | Why Remember |
|------|--------|-------------|
| Key decision | "I decided...", "Finally chose...", "Gave up..." | Remember decision logic |
| Value judgment | "I think A is more important than B" | Build decision framework |
| Emotional turn | "From...to..." | Understand emotional patterns |
| Milestone | "Finally completed..." | Mark life nodes |
| First time | "First time doing..." | Mark fresh experiences |
| Regret/reflection | "I shouldn't have..." | Remember lessons |

## Storage (Standalone Mode)

Write to `memory/narrative.jsonl` — one JSON object per line:

```json
{"timestamp":"2026-03-31T23:00:00+08:00","type":"decision","scene":"Friday 11pm, discussing product priority","vibe":"down but firm","core":"User experience matters more than features","impact":"Later became basis for cutting features","importance":0.8,"tags":["product","decision"]}
```

**Fallback**: If file write fails, write to conversation context as note.

## Narrative Fragment Format

Write as descriptive paragraph:

```
【Scene】
Time: Friday 11pm
Scene: Discussing product priority
Vibe: Just finished reading user complaints, slightly down but firm
Core: "User experience matters more than feature count"
Impact: This judgment later became the basis for cutting features
```

## Decay Curve (With Plugin)

When proactive-engine is installed:
- < 0.5 importance: decays after 7 days
- 0.5-0.7: decays after 30 days
- >= 0.8: permanent

**Standalone**: No automatic decay. User can manually prune.

## Call soul_narrative (With Plugin)

```
Tool: soul_narrative
Action: add
Params:
  event: <complete narrative fragment>
  category: decision / emotion_change / milestone / preference / general
  importance: 0.0-1.0 (determines decay speed)
  tags: [<related tags>]
```

## Integration

- When recalled (with plugin): +0.05 importance (reinforcement)
- When accumulated: notify proactive-trigger (topic X mentioned N times)
- Standalone: maintain flag in context about repeated topics

---

**Tags for publishing:** memory, narrative, soul, system, forgetting-curve, episodic-memory

**Requires nothing** — works standalone without proactive-engine.
