# Research: Uncle Bob's Clean Architecture & Acceptance Test Patterns for TypeScript

**Issue Reference**: [#2](https://github.com/hlatifi/todone/issues/2)  
**Parent Issue**: [#1 (Map: ToDone Repository Architecture & Scaffold)](https://github.com/hlatifi/todone/issues/1)  
**Author**: Antigravity Assistant  
**Date**: October 2026  

---

## 1. Executive Summary

This document establishes the architectural foundation and acceptance test design for **ToDone**, adhering strictly to Robert C. Martin's ("Uncle Bob") **Clean Architecture**, **FitNesse Slim** principles, and the **Acceptance Pipeline Specification (APS)** (`unclebob/Acceptance-Pipeline-Specification`), structured for a modern TypeScript monorepo targeting mobile (iOS, Android) and Progressive Web Apps (PWA).

The core tenet is **total decoupling**:
1. Enterprise domain entities and application use cases contain zero references to frameworks, UI libraries, or storage drivers.
2. Acceptance tests execute against the **Use Case Interactor boundaries** rather than the UI or a live database, executing in sub-second time with zero flakiness.
3. SwarmForge (`unclebob/swarm-forge`) agent squads (Specifier, Coder, Refactorer, Architect) operate with clear contractual boundaries.

---

## 2. Uncle Bob's Clean Architecture: Theoretical Foundations & Primary Sources

### 2.1 The Dependency Rule

> *"Source code dependencies must point only inward, toward higher-level policies."*  
> — Robert C. Martin, *Clean Architecture: A Craftsman's Guide to Software Structure and Design* (Prentice Hall, 2017)

Nothing in an inner circle may have any knowledge whatsoever of something in an outer circle. Specifically:
- Names of classes, functions, variables, or data formats declared in an outer circle must not be mentioned in an inner circle.
- Data formats used in an outer circle (e.g., database table schemas, HTTP request payloads, React props) must not cross into an inner circle unless transformed into an inner DTO or Entity.

```
+------------------------------------------------------------------+
|                   Frameworks & Drivers                           |
|       (Expo, React Native, React DOM, Expo SQLite, Web IndexedDB)|
|   +----------------------------------------------------------+   |
|   |                 Interface Adapters                       |   |
|   |       (Controllers, Presenters, Gateway Implementations) |   |
|   |   +--------------------------------------------------+   |   |
|   |   |             Application Business Rules           |   |   |
|   |   |       (Use Case Interactors, Input/Output Ports) |   |   |
|   |   |   +------------------------------------------+   |   |   |
|   |   |   |        Enterprise Business Rules         |   |   |   |
|   |   |   |       (Entities, Value Objects)          |   |   |   |
|   |   |   +------------------------------------------+   |   |   |
|   |   +--------------------------------------------------+   |   |
|   +----------------------------------------------------------+   |
+------------------------------------------------------------------+
```

### 2.2 Boundary Crossing & Inversion of Control

When an inner layer (Use Case) needs to interact with an outer concern (e.g., storing a task or outputting a view), it defines an abstract port (interface). The outer layer provides the concrete implementation.

```
       [UI / Fixture]
             |
             | invokes
             v
     +---------------+
     |  Controller   |
     +---------------+
             |
             | passes InputDTO
             v
+------------------------+
|   <<InputBoundary>>    | <------------------------+
+------------------------+                          |
             ^                                      |
             | implements                           |
+------------------------+                          |  packages/core
|  UseCaseInteractor     |                          |
|                        |                          |
|  - taskGateway:        |                          |
|      TaskGateway       |                          |
+------------------------+                          |
       |          |                                 |
       | calls    | calls                           |
       v          v                                 |
+-------------+ +------------------------+          |
| TaskGateway | |   <<OutputBoundary>>   | <--------+
+-------------+ +------------------------+
       ^                     ^
       | implements          | implements
+-------------+        +-----------------+
| SQLiteTask- |        |  TaskPresenter  |             packages/adapters
| Gateway     |        +-----------------+
+-------------+              |
                             | updates
                             v
                       +-----------------+
                       | TaskViewModel   |
                       +-----------------+
```

1. **Input Boundary**: The interface that the Controller or Test Fixture invokes (e.g., `CreateTaskInputPort.execute(request: CreateTaskRequestDTO): Promise<void>`).
2. **Output Boundary**: The interface the Interactor calls to present results (e.g., `CreateTaskOutputPort.present(response: CreateTaskResponseDTO): void` or `presentError(error: DomainError): void`).
3. **Gateway Interface**: The persistence or external SPI interface (e.g., `TaskRepository.save(task: Task): Promise<void>`).
4. **Data Transfer Objects (DTOs)**: Simple, immutable data structures crossing the boundaries. Entities never leak directly across the Input/Output boundary.

---

## 3. Acceptance Testing Patterns: FitNesse Slim & APS

### 3.1 The Flaw of UI-Driven Acceptance Tests

Uncle Bob has consistently argued against GUI-driven acceptance tests:
- **Brittleness**: Layout, styles, and animation changes break tests even when business behavior is intact.
- **Latency**: Spinning up browsers or mobile simulators takes seconds per test, crippling developer feedback cycles.
- **Complexity**: Asynchronous UI states, gesture timings, and DOM hierarchies obscure business intent.

### 3.2 The Slim & APS Philosophy

In FitNesse (and specifically the **Slim** - *Simple Lightweight Interface Mechanism* protocol):
- Acceptance tests are written in natural or tabular language (Gherkin Given/When/Then or FitNesse tables).
- A lightweight runner translates instructions to calls against a **Fixture**.
- The **Fixture** is an Interface Adapter: it lives in the adapter layer, instantiates pure Use Case interactors, injects in-memory gateway stubs, and executes the use cases directly.

### 3.3 Portable Acceptance Pipeline Specification (`unclebob/Acceptance-Pipeline-Specification`)

The canonical APS architecture consists of four distinct components:

1. **Gherkin Parser (`parser-spec.md`)**:
   - Parses `.feature` files into a language-neutral **JSON Intermediate Representation (JSON IR)**.
   - Decouples specification authoring from test runtime implementation.
2. **IR Dry Checker (`ir-dry-checker-spec.md`)**:
   - Analyzes JSON IR to detect duplicate, near-duplicate, or synonym steps across features, enforcing consistency and reuse.
3. **Acceptance Test Generator & Runtime (`acceptance-generator.md`)**:
   - Generates executable test suites from the JSON IR.
   - Dispatches step definitions to project-specific Step Handlers (Fixtures).
   - Validates implementation hash signatures to prevent out-of-sync test generation.
4. **Acceptance Mutation (`mutator-spec.md`)**:
   - Mutates Gherkin example values and data tables inside the JSON IR.
   - Runs the suite against mutated data to prove that tests fail when inputs vary—guaranteeing test sensitivity and preventing false positives ("tautological passing tests").

---

## 4. TypeScript Monorepo Architecture for ToDone

To achieve clean separation of concerns and fast CI/CD pipelines, ToDone is structured into isolated workspaces:

```
todone/
├── packages/
│   ├── core/                  # Pure TypeScript (Zero Framework / Zero DB dependencies)
│   │   ├── src/
│   │   │   ├── entities/      # Task, Project, Tag, Invariants, Value Objects
│   │   │   ├── use-cases/     # Interactors, Input/Output Ports, DTOs
│   │   │   ├── gateways/      # TaskGateway, ProjectGateway interfaces
│   │   │   └── errors/        # DomainError, ValidationError
│   │   ├── tsconfig.json      # Node-agnostic, DOM-agnostic (ES2022)
│   │   └── package.json
│   │
│   ├── adapters/              # Interface Adapters
│   │   ├── src/
│   │   │   ├── repositories/
│   │   │   │   ├── in-memory/ # InMemoryTaskGateway (for Acceptance tests & Unit tests)
│   │   │   │   └── sqlite/    # SQLiteTaskGateway (Kysely / Expo SQLite / wa-sqlite)
│   │   │   ├── presenters/    # Reactive ViewModels & OutputBoundary implementations
│   │   │   └── controllers/   # Action dispatchers invoked by UI or Fixtures
│   │   └── package.json
│   │
│   └── acceptance/            # Acceptance Pipeline Specification Harness
│       ├── features/          # .feature files (Gherkin specs)
│       ├── src/
│       │   ├── fixtures/      # APS Step Handlers binding Gherkin to Core Use Cases
│       │   └── runner.ts      # Slim/APS JSON IR executor
│       └── package.json
│
└── apps/
    └── todone/                # Expo Application (iOS, Android, PWA Web)
        ├── app/               # Expo Router file-based routes
        ├── components/        # Presentational UI components
        └── package.json
```

---

## 5. Concrete Code Patterns & Contracts

### 5.1 Pure Entity (`packages/core/src/entities/task.ts`)

```typescript
export interface TaskProps {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly completed: boolean;
  readonly createdAt: Date;
  readonly completedAt?: Date;
}

export class Task {
  private constructor(private props: TaskProps) {}

  public static create(id: string, title: string, description?: string): Task {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      throw new Error("Task title cannot be empty");
    }
    if (trimmedTitle.length > 255) {
      throw new Error("Task title cannot exceed 255 characters");
    }

    return new Task({
      id,
      title: trimmedTitle,
      description: description?.trim(),
      completed: false,
      createdAt: new Date(),
    });
  }

  public complete(): void {
    if (this.props.completed) {
      return;
    }
    this.props = {
      ...this.props,
      completed: true,
      completedAt: new Date(),
    };
  }

  public get id(): string { return this.props.id; }
  public get title(): string { return this.props.title; }
  public get isCompleted(): boolean { return this.props.completed; }
  public toSnapshot(): TaskProps { return { ...this.props }; }
}
```

### 5.2 Use Case Boundary & Interactor (`packages/core/src/use-cases/create-task/`)

```typescript
// DTOs
export interface CreateTaskRequestDTO {
  readonly title: string;
  readonly description?: string;
}

export interface CreateTaskResponseDTO {
  readonly id: string;
  readonly title: string;
  readonly completed: boolean;
}

// Ports
export interface CreateTaskOutputPort {
  presentSuccess(response: CreateTaskResponseDTO): void;
  presentError(error: Error): void;
}

export interface CreateTaskInputPort {
  execute(request: CreateTaskRequestDTO, presenter: CreateTaskOutputPort): Promise<void>;
}

export interface TaskGateway {
  save(task: Task): Promise<void>;
  findById(id: string): Promise<Task | null>;
  nextIdentity(): Promise<string>;
}

// Interactor
export class CreateTaskInteractor implements CreateTaskInputPort {
  constructor(private readonly gateway: TaskGateway) {}

  public async execute(
    request: CreateTaskRequestDTO,
    presenter: CreateTaskOutputPort
  ): Promise<void> {
    try {
      const id = await this.gateway.nextIdentity();
      const task = Task.create(id, request.title, request.description);
      await this.gateway.save(task);

      presenter.presentSuccess({
        id: task.id,
        title: task.title,
        completed: task.isCompleted,
      });
    } catch (err) {
      presenter.presentError(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
```

### 5.3 Acceptance Test Fixture (`packages/acceptance/src/fixtures/task-fixture.ts`)

```typescript
import {
  CreateTaskInteractor,
  CreateTaskOutputPort,
  CreateTaskResponseDTO,
} from "@todone/core";
import { InMemoryTaskGateway } from "@todone/adapters";

export class TaskFixture implements CreateTaskOutputPort {
  private gateway = new InMemoryTaskGateway();
  private interactor = new CreateTaskInteractor(this.gateway);

  public lastResponse?: CreateTaskResponseDTO;
  public lastError?: Error;

  public presentSuccess(response: CreateTaskResponseDTO): void {
    this.lastResponse = response;
  }

  public presentError(error: Error): void {
    this.lastError = error;
  }

  // Step Handler for: Given an empty task list
  public async givenEmptyTaskList(): Promise<void> {
    await this.gateway.clear();
  }

  // Step Handler for: When I create a task with title "{title}"
  public async whenICreateTask(title: string): Promise<void> {
    await this.interactor.execute({ title }, this);
  }

  // Step Handler for: Then the task "{title}" should be saved and active
  public async thenTaskShouldBeActive(title: string): Promise<boolean> {
    if (!this.lastResponse) return false;
    const task = await this.gateway.findById(this.lastResponse.id);
    return task !== null && task.title === title && !task.isCompleted;
  }
}
```

---

## 6. SwarmForge Agent Squad Topology Alignment

Uncle Bob's multi-agent workflow in `unclebob/swarm-forge` maps directly onto these boundaries:

| Agent Role | Scope & Worktree Responsibility | Verification Protocol |
|---|---|---|
| **Specifier** | Authors `.feature` files in `packages/acceptance/features/` | Validates Gherkin via APS Parser & IR Dry-Checker |
| **Architect** | Owns boundary definitions, interfaces, and workspace rules in `packages/core` | Verifies Dependency Rule (no outer imports in `core`) |
| **Coder** | Implements entities, interactors, and gateways test-first (TDD) | Unit test suite & Acceptance test execution |
| **Refactorer / Hardener** | Code cleanliness, DRY checks, and Acceptance Mutation | Runs APS Mutator on JSON IR to verify test sensitivity |

---

## 7. Conclusions & Action Plan for ToDone

1. **Monorepo Tooling Setup ([#3](https://github.com/hlatifi/todone/issues/3))**:
   - Configure `pnpm-workspace.yaml` and Turborepo.
   - Establish `packages/core`, `packages/adapters`, `packages/acceptance`, and `apps/todone`.
   - Configure TypeScript project references with `composite: true` and strict `isolatedModules`.
2. **Acceptance Test Pipeline ([#5](https://github.com/hlatifi/todone/issues/5))**:
   - Set up Gherkin feature runner using Vitest / APS JSON IR parser.
   - Verify step dispatching into in-memory adapters without UI dependencies.
3. **Core Boundaries & Gateway Stubs ([#6](https://github.com/hlatifi/todone/issues/6))**:
   - Implement `TaskGateway`, `TaskPresenter`, `CreateTaskInputPort`, and `InMemoryTaskGateway`.
4. **Domain Modeling Session ([#8](https://github.com/hlatifi/todone/issues/8))**:
   - Formulate task lifecycle, invariants, subtasks, and domain events.

---

## 8. Citations & References

- Robert C. Martin, *Clean Architecture: A Craftsman's Guide to Software Structure and Design*, Prentice Hall, 2017.
- Robert C. Martin, *Clean Craftsmanship: Disciplines, Standards, and Ethics*, Addison-Wesley, 2021.
- Robert C. Martin, *FitNesse & The Slim Protocol*, [fitnesse.org](http://fitnesse.org/FitNesse.UserGuide.WritingAcceptanceTests.SliM).
- Portable Acceptance Pipeline Specification, [github.com/unclebob/Acceptance-Pipeline-Specification](https://github.com/unclebob/Acceptance-Pipeline-Specification).
- SwarmForge: Multi-Agent Workspace Orchestration, [github.com/unclebob/swarm-forge](https://github.com/unclebob/swarm-forge).
