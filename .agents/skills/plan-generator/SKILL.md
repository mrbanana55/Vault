---
name: plan-generator
description: Use this skill when the user asks to plan, design, or architect a feature implementation from an existing spec. Produces a plan.md file based on spec requirements and project standards.
---

# Plan Generator

Transforms an approved feature specification (`spec.md`) into a technical implementation blueprint (`plan.md`). The plan defines **HOW** the feature will be built without writing the actual production code.

## Process

1. **Read the context.** Read `docs/constitution.md` (if present) and the source specification (e.g., `specs/NNN-<name>/spec.md`). Ensure full context of project principles and functional requirements (FRs).
2. **Analyze requirements.** Map out every functional requirement (FR-1, FR-2, etc.) to ensure 100% coverage in the technical design.
3. **Select output location.** Write the output plan to the corresponding feature directory: `specs/NNN-<name>/plan.md`.
4. **Draft the plan.** Complete all required sections outlined in the template below.
5. **Annotate requirement mapping.** Explicitly label which FR is addressed by each module, CLI command, data model attribute, or test case.

## Section Guidelines

- **Module Structure:** Map directory tree and responsibilities. State which FRs each module covers.
- **Data Model:** Define JSON schemas or data structures with concrete example payloads.
- **Algorithms:** Express non-trivial business logic (e.g., streak calculation, state machines) in explicit pseudocode.
- **CLI / API Contract:** Define commands, options, expected standard outputs/errors, and exit codes.
- **Technical Decisions:** List every architectural choice alongside rejected alternatives and the rationale behind the decision.
- **Testing Strategy:** Detail unit, integration, and edge-case test plans.

## Rules

- **DO NOT WRITE PRODUCTION CODE.** The output must strictly remain a planning and design document.
- Respect all principles in `docs/constitution.md`.
- Explicitly tag every section or feature component with its target requirement (e.g., `[Covers FR-1, FR-3]`).
- Every technical decision must include at least one discarded alternative.
- Do not make silent architectural assumptions. If a requirement's implementation path is ambiguous, explicitly list options or flag as `[NEEDS CLARIFICATION]`.

## Template (`plan.md`)

````markdown
# Implementation Plan: [Feature Name]

**Spec Reference:** `specs/NNN-[name]/spec.md`

## 1. Module Structure

<!-- High-level architectural breakdown and directory layout -->

- `src/...`: [Description] `[Covers FR-X]`

## 2. Data Model

<!-- Schemas and example payloads -->

```json
{
  "example": "data payload"
}
```
````
