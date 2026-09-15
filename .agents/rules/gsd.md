# Get Shit Done (GSD) Core Rule

This project supports and uses [GSD Core](https://github.com/open-gsd/gsd-core) for meta-prompting, context engineering, and spec-driven development.

## Core Philosophy

- **Explicit, Resumable Workflow:** `explore` → `plan` → `execute` → `verify` → `ship`.
- **Durable Context:** Maintain durable state and roadmap under `.planning/` (`PROJECT.md`, `ROADMAP.md`, `STATE.md`, `REQUIREMENTS.md`) rather than relying on ephemeral chat context.
- **Small, Atomic Steps:** Work is broken into small, verified tasks with test-backed commits.
- **Verification-First:** Never declare work complete without verifying against requirements and running linters/type checks.

## Key Skills & Workflows Available

When the user asks to plan, build, audit, or execute with GSD, invoke the corresponding GSD skill:
- **`gsd-progress`**: Check project progress, advance workflow, or dispatch situational next steps.
- **`gsd-plan-phase`**: Create detailed phase plans (`PLAN.md`) with verification loops.
- **`gsd-execute-phase`**: Execute plans in dependency-aware order.
- **`gsd-verify-work`**: Conduct conversational UAT and verification.
- **`gsd-code-review`**: Autonomous code review for bugs, security, and quality.
- **`gsd-audit-fix`**: Autonomous audit-to-fix pipeline.
- **`gsd-ship`**: Prepare PR, run checks, and prepare for deployment/merge.
