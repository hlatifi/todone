# SwarmForge Coordination Topology for ToDone

This directory configures **SwarmForge** (`unclebob/swarm-forge`) for the ToDone repository. It establishes a 4-role autonomous development squad aligned with Uncle Bob's Clean Architecture, Acceptance Pipeline Specification (APS), and Test-Driven Development (TDD).

---

## 1. Squad Roles & Responsibilities

The squad operates in a structured pipeline where each role has clear ownership, strict worktree boundaries, and well-defined handoff protocols:

```
┌──────────────┐     git_handoff     ┌──────────────┐
│  Specifier   │ ──────────────────> │    Coder     │
│ (main/root)  │                     │(squad/coder) │
└──────────────┘                     └──────┬───────┘
                                            │ git_handoff
                                            ▼
┌──────────────┐     git_handoff     ┌──────────────┐
│  Architect   │ <────────────────── │  Refactorer  │
│(squad/arch)  │                     │ (squad/ref)  │
└──────┬───────┘                     └──────────────┘
       │ back-all
       ▼
┌──────────────┐
│  main/master │
└──────────────┘
```

| Role | Worktree / Branch | Primary Responsibilities | Next Role |
| :--- | :--- | :--- | :--- |
| **Specifier** | Repo root (`main`) | Authors Gherkin `.feature` specifications in `packages/acceptance/features/` conforming to `parser-spec.md`. Resolves domain ambiguity using `CONTEXT.md`. | `coder` |
| **Coder** | `.worktrees/coder` (`squad/coder`) | Test-Driven Development (TDD): writes unit tests, implements pure use cases and entities in `packages/core`, implements adapters in `packages/adapters`, wires steps in `TaskFixture`. | `refactorer` |
| **Refactorer** | `.worktrees/refactorer` (`squad/refactorer`) | Improves naming, eliminates duplication (DRY), sharpens abstractions, and enforces type safety without altering observable behavior. Verifies all tests stay green. | `architect` |
| **Architect** | `.worktrees/architect` (`squad/architect`) | Enforces Uncle Bob's Clean Architecture Dependency Rule (core has zero external dependencies), reviews ports and DTO boundaries, verifies full test/build pipeline, propagates back to `main`. | `main` |

---

## 2. Worktree Directory Structure

Worktrees isolate each agent's filesystem and git branch to eliminate file conflicts and context bleeding:

```text
todone/
├── .worktrees/
│   ├── coder/           # Worktree on branch squad/coder
│   ├── refactorer/      # Worktree on branch squad/refactorer
│   └── architect/       # Worktree on branch squad/architect
├── .swarmforge/
│   └── handoffs/
│       ├── queue/       # Active handoff manifests waiting for pickup
│       └── archive/     # Historical completed manifests
├── swarmforge/
│   ├── swarmforge.conf  # SwarmForge squad configuration
│   ├── constitution.prompt
│   ├── constitution/
│   │   └── articles/
│   │       ├── engineering.prompt  # Clean Architecture, APS, TDD rules
│   │       ├── workflow.prompt     # Worktree discipline, commit bylines
│   │       └── handoffs.prompt     # Handoff schemas & routing
│   ├── roles/
│   │   ├── specifier.prompt
│   │   ├── coder.prompt
│   │   ├── refactorer.prompt
│   │   └── architect.prompt
│   └── scripts/
│       ├── setup_squad_worktrees.sh  # Bootstraps branches, worktrees & hooks
│       ├── ready_for_next.sh        # Inbound handoff pickup & git merge
│       ├── swarm_handoff.sh         # Dispatches outbound handoff manifest
│       └── done_with_current.sh     # Acknowledges and archives completed handoff
└── tmp/                 # Local scratch space (git-ignored)
```

---

## 3. Configuration (`swarmforge.conf`)

The topology configuration defines the window, role, agent model, worktree, batching, and handoff loop strategy:

```conf
# SwarmForge 4-pack Squad Configuration for ToDone
window-invisible specifier codex master --yolo
window-invisible coder grok coder
window-invisible refactorer grok refactorer back-one
window-invisible architect codex architect batch back-all --yolo
```

- `back-one`: Allows Refactorer to send rework back to Coder if defects are discovered.
- `back-all`: Architect propagates reviewed and validated changes back to `main`.

---

## 4. Handoff Protocol & Scripts

### A. Initializing Worktrees
Run the bootstrap script once to create the squad branches, worktree directories, and git hooks:
```bash
./swarmforge/scripts/setup_squad_worktrees.sh
```

### B. Inbound Pickup: `ready_for_next.sh`
When invoked, `ready_for_next.sh`:
1. Infers the active role from `$SWARMFORGE_ROLE` or current branch.
2. Checks `.swarmforge/handoffs/queue/` for pending manifests matching `to: <role>`.
3. If a `git_handoff` is found, merges the sender's commit into the local branch and records the active task.
```bash
./swarmforge/scripts/ready_for_next.sh
```

### C. Outbound Dispatch: `swarm_handoff.sh`
To hand work off to the next role, create a draft in `./tmp/` and execute `swarm_handoff.sh`:
```bash
cat << EOF > ./tmp/handoff.txt
type: git_handoff
to: refactorer
priority: 10
task: implement-subtask-depth-limit
EOF

./swarmforge/scripts/swarm_handoff.sh ./tmp/handoff.txt
```

### D. Task Acknowledgment: `done_with_current.sh`
When your role has dispatched its work and completed its task, acknowledge completion to archive the queue manifest:
```bash
./swarmforge/scripts/done_with_current.sh
```

---

## 5. Commit Discipline & Automation

Every commit within a SwarmForge squad must include a role byline:
```text
Implement cascading task completion logic

By coder.
```

The bootstrap script installs a git hook (`.git/hooks/commit-msg`) that automatically appends the `By <role>.` byline if omitted.

---

## 6. Verification Pipeline

Every role must ensure all tests pass before handing off work:
```bash
# Run unit and acceptance tests
pnpm test

# Verify TypeScript type safety
pnpm -r typecheck

# Full production build verification
pnpm build
```
