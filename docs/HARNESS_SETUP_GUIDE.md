# Repository Harness Setup Guide

This document is the canonical reference for agents and engineers setting up the **Repository Harness** on any new or existing codebase. It captures the exact process applied from [`hoangnb24/repository-harness`](https://github.com/hoangnb24/repository-harness).

---

## 1. Overview & Purpose

The **Repository Harness** establishes a standardized, platform-agnostic operating contract between AI coding agents and human engineers. It turns any codebase into an agent-ready, legible workspace by providing:

1. **A compact entrypoint** (`AGENTS.md` & `CLAUDE.md`) establishing authority boundaries and workflow rules.
2. **A clear workflow protocol** (`docs/WORKFLOW.md`) distinguishing read-only inquiries, bounded changes, and multi-session initiatives.
3. **Durable execution memory** (`docs/plans/active/` and `docs/plans/completed/`) replacing external task databases.
4. **Mechanical invariants** (`docs/patterns/encoding-invariants.md`) preventing regressions via native tests.
5. **Conflict-safe provenance and updates** (`.harness-core/manifest.json` and the `harness` CLI) enabling three-way merges with upstream harness improvements without destroying consumer-owned customizations.

---

## 2. Prerequisites & Tooling

Depending on the host operating system:

| Platform | Recommended Bootstrap Method | Required Tools |
|---|---|---|
| **Windows** (PowerShell) | Build/use Rust `harness.exe` binary directly | `git`, `cargo` (Rust toolchain) |
| **Linux / macOS / WSL** | Official bootstrap shell script | `git`, `curl`, `bash`, `shasum` |

---

## 3. Step-by-Step Installation Procedure

### Step 1: Obtain the Harness CLI

#### Option A: Build the Native Binary via Cargo (Recommended on Windows)
Clone the repository harness into a temporary directory and compile the release binary:
```powershell
# Clone upstream harness repo into a scratch/temp folder
git clone https://github.com/hoangnb24/repository-harness.git C:\temp\repository-harness

# Build the release binary
cargo build --release --manifest-path C:\temp\repository-harness\Cargo.toml -p harness

# The executable will be at:
# C:\temp\repository-harness\target\release\harness.exe
```

#### Option B: Remote Bootstrap Script (Unix / macOS / Git Bash)
```bash
curl -fsSL "https://raw.githubusercontent.com/hoangnb24/repository-harness/main/scripts/install-harness.sh?$(date +%s)" | bash -s -- --merge --claude --yes
```

---

### Step 2: Install Core Payload into Target Repository

From the target workspace root, run the installer:

```powershell
# Preview first (optional dry-run)
C:\temp\repository-harness\target\release\harness.exe install --directory . --dry-run

# Execute fresh installation / adoption
C:\temp\repository-harness\target\release\harness.exe install --directory .
```

This command installs the core payload and writes the provenance manifest:
- **Provenance Manifest**: `.harness-core/manifest.json`
- **Agent Entrypoint**: `AGENTS.md` (with canonical marked Harness block)
- **Agent Skills** under `.agents/skills/`:
  - `audit-onboarding-proposal/`
  - `encode-invariant/`
  - `improve-harness/`
  - `onboard-repository/`
- **Documentation Core**:
  - `docs/WORKFLOW.md`
  - `docs/README.md`
  - `docs/patterns/encoding-invariants.md`
  - `docs/plans/README.md`, `docs/plans/active/README.md`, `docs/plans/completed/README.md`
  - `docs/decisions/README.md`
  - `docs/product/README.md`
  - `docs/templates/exec-plan.md`
  - `docs/templates/decision.md`
  - `docs/templates/application-runbook.md`
  - `docs/templates/harness-improvement.md`

*(Note: If a target file already exists, `harness install` safely **adopts** it rather than destroying it).*

---

### Step 3: Set Up Local Repository Maintenance Binary & Git Ignore

To ensure future agents and CI can run `harness status`, `harness doctor`, and `harness update` without re-cloning the source repository, copy the binary into the target repository:

```powershell
# Create scripts/bin directory if missing
if (!(Test-Path scripts\bin)) { New-Item -ItemType Directory -Path scripts\bin -Force }

# Copy binary
Copy-Item C:\temp\repository-harness\target\release\harness.exe scripts\bin\harness.exe
```

Update the repository `.gitignore` to ensure the compiled maintenance binaries are excluded from version control:
```gitignore
# Harness core maintenance binary
scripts/bin/harness
scripts/bin/harness.exe
```

---

### Step 4: Install Multi-Agent Shims & Optional Skills

#### 1. Claude Code Shim (`CLAUDE.md`)
Claude Code does not auto-load `AGENTS.md`. Create `CLAUDE.md` in the project root to import `AGENTS.md`:

```markdown
# Project Rules

<!-- HARNESS:BEGIN -->
## Harness

Claude Code does not auto-load `AGENTS.md`. Import that single canonical
project instruction source. Keep this bare `@` line outside backticks so the
import remains active.

@AGENTS.md
<!-- HARNESS:END -->
```

#### 2. Gemini / Antigravity Shim (`GEMINI.md`)
Antigravity and Gemini-based agents automatically discover rules from `GEMINI.md` and `AGENTS.md`, and skills from `.agents/skills/`. Create `GEMINI.md` to establish first-class integration:

```markdown
# Gemini Agent Instructions

<!-- HARNESS:BEGIN -->
## Harness
This codebase is operated under the Repository Harness.
The canonical instructions and workflow authority are defined in [AGENTS.md](AGENTS.md).
<!-- HARNESS:END -->

Please refer to and follow [AGENTS.md](AGENTS.md) for full workflow, product context, architecture contracts, and operating guardrails.
```

#### 3. Optional Engineering Wisdom Advisory Skill
If the repository benefits from general software design heuristics (SOLID, refactoring, code clarity), copy `.agents/skills/engineering-wisdom/`:
```powershell
Copy-Item -Recurse C:\temp\repository-harness\.agents\skills\engineering-wisdom .agents\skills\engineering-wisdom
```

---

### Step 5: Customize `AGENTS.md` with Project-Specific Context

`AGENTS.md` is the single source of truth for agent behavior.

> [!IMPORTANT]
> **Marker Preservation**: Never edit the content inside `<!-- HARNESS:BEGIN -->` and `<!-- HARNESS:END -->`. The `harness` CLI uses these markers to safely perform three-way updates.

Append a `## Project-specific Instructions` section below the closing `<!-- HARNESS:END -->` tag:

```markdown
# Agent Instructions

<!-- HARNESS:BEGIN -->
## Harness

Start with the requested outcome and use the repository as the system of record.
Read `docs/WORKFLOW.md` and only relevant product, design, plan, code, and
validation material.

- Answers, explanations, reviews, diagnoses, plans, and status reports are
  read-only. Inspect only what is needed; change nothing.
- For a bounded change, inspect affected behavior and proof, implement, and
  validate. No control-plane operation is required.
- Use one `docs/plans/active/` file when work spans sessions, coordinates
  contributors, has dependencies, or needs recovery. Move it to
  `docs/plans/completed/` only after validation.
- Before editing, identify repository authority for each new externally
  observable policy. If materially different choices remain open, stop before
  edits; configurable defaults are not authority.
- For architecture, reliability, security, or quality invariant work, read
  `docs/patterns/encoding-invariants.md` and enforce only accepted rules.
- Report reusable agent friction. Change guidance, tools, runbooks, or validation
  for that purpose only when explicitly asked to use `$improve-harness`.
- Also pause when product intent remains ambiguous, recovery is difficult,
  validation is weakened, or authority is insufficient.
- Claim completion only with executable or observable evidence. Report outcome,
  changes, validation, and unresolved risks.

Harness has no task database or orchestration lifecycle. Use repository plans
and behavior-level proof; do not create parallel control-plane state.
<!-- HARNESS:END -->

## Project-specific Instructions

### Product & Domain Context
- **Project**: <Project Name or Slug>
- **Phase**: <Current development phase and active milestone>
- **Domain Glossary**: [CONTEXT.md](CONTEXT.md)
- **Product Specification**: [docs/product/](docs/product/)
- **Architecture Overview**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Testing Seams**: [docs/architecture/TESTING_STRATEGY.md](docs/architecture/TESTING_STRATEGY.md) (or test runner conventions)
- **Architecture Decisions**: [docs/decisions/](docs/decisions/) and [docs/adr/](docs/adr/)

### Operating Guardrails
- **<Guardrail 1>**: (e.g. Do not implement production code before PoC validation)
- **<Guardrail 2>**: (e.g. Inward dependency rules, offline-first local authority)
```

---

### Step 6: Map Existing Repository Documentation

Bridge the generic Harness directory structure with the target repository's existing documentation:

1. **`docs/ARCHITECTURE.md`**: Create an architectural entrypoint summarizing the high-level system diagram, core principles, and links to detailed platform architecture documents.
2. **`docs/product/README.md`**: Add an index linking to existing product requirements documents (e.g., `MVP_SPEC.md`).
3. **`docs/decisions/README.md`**: Add an index linking to existing decision logs (e.g., `DECISION_LOG.md`) and ADR folders (e.g., `docs/adr/`).
4. **`docs/HARNESS.md`**: Ensure the product model principles document is present.

---

### Step 7: Verify Installation & Health

Run the diagnostic commands from the local repository binary:

```powershell
# 1. Verify repository integrity and safe paths
scripts\bin\harness.exe doctor --directory .

# Expected Output:
# pass transaction: no interrupted transaction
# pass update_resolution: no staged update conflict
# pass three_way_merge: Git merge-file is required for overlapping update analysis
# pass provenance: installed core 0.1.10
# pass path:AGENTS.md: managed path is safe
# ... (all 30 checks passing)

# 2. Check installation status and modified files
scripts\bin\harness.exe status --directory .

# Expected Output:
# Harness core: current (installed=0.1.10, target=0.1.10, modified=N, missing=0)
```

*(Note: `modified=N` indicates custom additions made outside marked harness tags, which is expected and cleanly supported by the 3-way merge engine).*

---

## 4. How Agents Work in a Harness-Equipped Codebase

Future agents working in this repository should adhere to the following workflow:

```text
read-only request
  -> inspect the smallest authoritative surface
  -> answer with evidence

bounded change
  -> inspect authority and affected behavior
  -> implement the smallest coherent change
  -> run relevant proof (tests/build)

multi-session or coordinated change
  -> create docs/plans/active/<plan-slug>.md from docs/templates/exec-plan.md
  -> keep decisions, progress, recovery, and validation current
  -> move validated plan to docs/plans/completed/

architectural/invariant rule
  -> encode as a mechanical test using docs/patterns/encoding-invariants.md

material product ambiguity
  -> stop before mutation
  -> present the concrete choice and consequences to the human
```

---

## 5. Maintenance & Future Updates

When a new version of `repository-harness` is released:
```powershell
# Preview three-way merge update
scripts\bin\harness.exe update --directory . --dry-run

# Apply update
scripts\bin\harness.exe update --directory .
```
- Upstream changes inside `<!-- HARNESS:BEGIN -->` are updated.
- Consumer-owned customizations in `## Project-specific Instructions` and `docs/` are preserved.
- If conflicts occur, `harness update` stages the conflicting files in `.harness-core/update/` for inspection and resolution before completing via `harness update --continue`.
