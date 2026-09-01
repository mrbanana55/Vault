---
name: spec-generator
description: Use this skill when the user asks to create, draft, or review a specification (spec) of a feature. Guides a requirements interview and produces a spec.md following the team template.
---

# Spec Generator

Converts a vague idea into an agreed-upon specification. The spec is the
contract: if something is not here, it does not get implemented.

## Process

1. **Read the context.** `docs/constitution.md` if it exists, and previous specs
   from `specs/` to respect conventions and not contradict what has already been agreed.
2. **Interview the user.** Questions **ONE AT A TIME**, maximum 6, waiting for
   an answer before the next one. Focus on edge cases, error behavior, and what's
   out of scope. Do not propose technical solutions: if the user asks "how would
   you do it?", redirect to the WHAT.
   Prioritize questions whose answer changes what needs to be built; discard
   those with an obvious default answer.
3. **Choose the number.** Look at `specs/` and use the next available with three
   digits: `specs/NNN-<name-in-kebab-case>/spec.md`.
4. **Draft** using `spec-template.md` from this skill, without skipping
   sections. Acceptance criteria **always in EARS notation**, numbered
   as FR-1, FR-2, … Each requirement must be verifiable: if you can't think
   of how to check it, it's poorly written.
5. **Mark what you don't know** as `[NEEDS CLARIFICATION: specific question]`.
   Never fill a gap by guessing: a visible gap is information,
   a silent assumption is debt.
6. **Ask for explicit approval** when done. Do not proceed to the plan or write
   code until you have it.

## Rules

- The spec describes **WHAT** and **WHY**. Forbidden to include stack, architecture,
  file names, data schemas, algorithms, or function signatures:
  that goes in the plan.
- Always include the "Out of scope" section. It's what prevents the
  feature from growing on its own.
- One requirement, one sentence. If you need an "and" to connect two behaviors,
  they are two requirements.
- No unmeasurable adjectives: "fast", "intuitive", "robust" are not
  requirements. Write the threshold or don't write it.
- Language: the one from the project's constitution. If there isn't one, the user's.

## EARS Notation

Five patterns. Choose the one that applies, do not mix:

| Pattern      | Form                                       | When                  |
| ------------ | ------------------------------------------ | --------------------- |
| Ubiquitous   | THE SYSTEM \<will\>                        | always true           |
| Event-driven | WHEN \<trigger\>, THE SYSTEM \<will\>      | responds to something |
| State        | WHILE \<state\>, THE SYSTEM \<will\>       | during a condition    |
| Optional     | WHERE \<feature\>, THE SYSTEM \<will\>     | only if present       |
| Unwanted     | IF \<condition\>, THEN THE SYSTEM \<will\> | errors and edge cases |

Example well written:

> FR-4: IF the name already exists (comparison ignoring case and leading/trailing
> whitespace), THEN THE SYSTEM will not create a duplicate and will report the
> conflict (exit 1).

Poorly written, for contrast:

> ~~FR-4: The system must handle duplicates well and be fast.~~
> No EARS pattern, no verifiable criterion, two ideas in one sentence, and an
> unmeasurable adjective.

## When reviewing an existing spec

If the user asks to review instead of create, do not rewrite: **detect and list**,
numbered, in four blocks — (1) ambiguities, (2) contradictions between
requirements, (3) uncovered edge cases, (4) conflicts with the constitution.
Do not propose solutions until they ask you to.
