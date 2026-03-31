---
name: narrative-memory
version: 0.1.0
description: >
  Capture and weave meaningful moments into vivid narrative memories with time, emotion, and scene.
  Filter noise, apply decay curves, and reinforce frequently recalled memories.
  Trigger: milestone, decision, value judgment, emotional turning point, first-time experience, or reflection.
---

# Narrative Memory System

Let AI remember who you are, not what you said.

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

**Do not write immediately**. Mark: "topic X mentioned for the Nth time"

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

## Narrative Fragment Format

Not structured fields — a **descriptive paragraph**:

```
【Scene】
Time: Friday 11pm
Scene: Discussing product priority
Vibe: Just finished reading user complaints, slightly down but firm
Core: "User experience matters more than feature count"
Impact: This judgment later became the basis for cutting features
```

## Decay Curve

Memory is not permanent:

| Importance | Decay Starts | Notes |
|------------|-------------|-------|
| < 0.5 | After 7 days | Low-value memories naturally eliminated |
| 0.5-0.7 | After 30 days | Medium-value, fades if never recalled |
| >= 0.8 | Permanent | Core memories, never deleted |

**Decay ≠ delete**: Lower retrieval probability. Importance gradually drops to 0.

**Reinforcement**: Memories recalled gain +0.05 importance (cap 1.0).

## Call soul_narrative

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

- When recalled: +0.05 importance (reinforcement)
- Decay execution: handled by hippocampus
- When accumulated: notify proactive-trigger (topic X mentioned N times)

---

**Tags for publishing:** memory, narrative, soul, system, forgetting-curve, episodic-memory
