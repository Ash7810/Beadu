---
name: gsd
description: "Get Shit Done (GSD) meta-prompting, context engineering, and spec-driven development system. Use whenever the user mentions GSD, asks to plan/execute with GSD, or wants structured progress tracking."
---

# Get Shit Done (GSD) Master Skill

GSD is an execution framework that turns goals into shipped software through an explicit, resumable workflow:
**explore → plan → execute → verify → ship**.

## When to Use

Trigger this skill whenever the user says:
- "use gsd"
- "gsd plan" / "gsd execute" / "gsd progress" / "gsd status"
- "get shit done"
- wants structured, spec-driven phase planning and execution under `.planning/`

## Core Workflow Loop

1. **State & Progress**:
   - Check `.planning/STATE.md` and `.planning/ROADMAP.md` before taking action.
   - Use `gsd-progress` to summarize progress and determine the next action.

2. **Phase Planning**:
   - Create or update phase specifications in `.planning/phases/`.
   - Use `gsd-plan-phase` to break a phase into verified task plans (`PLAN.md`).

3. **Execution**:
   - Use `gsd-execute-phase` to build in small, atomic, test-backed steps.
   - Maintain durable context in files rather than context window drift.

4. **Verification & Quality Gate**:
   - Use `gsd-verify-work` for conversational UAT.
   - Use `gsd-code-review` and `gsd-audit-fix` before declaring milestones complete.
   - Ensure `npm run dev` or `tsc --noEmit` build passes cleanly.

5. **Ship**:
   - Use `gsd-ship` to prepare clean branches, review commits, and merge.
