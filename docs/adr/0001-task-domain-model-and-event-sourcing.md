# 1. Task Domain Hierarchy, Cascading Completion, and Event Sourcing

We decided to model Tasks as recursive aggregate roots capped at 5 levels of nesting, with cascading completion down the subtask tree, implicit Project inheritance, and aggregate-level buffering of Domain Events for offline synchronization.

## Status

Accepted

## Context

ToDone requires offline-first operation on Android, iOS, and Web PWA with local SQLite and IndexedDB persistence. Tasks need structured breakdown without becoming an overly complex project management system, while state changes must be deterministically replayable and syncable across devices without data loss.

## Considered Options

- **Flat Tags Only**: Rejected because users require parent-child task decomposition for complex goals.
- **Unbounded Tree Depth**: Rejected because unbounded depth invites UI rendering bottlenecks, cyclic reference vulnerabilities, and sync thrashing on mobile devices.
- **State-based Last-Write-Wins (LWW)**: Rejected because simple timestamps drop concurrent offline edits on separate task fields.

## Consequences

- Aggregate roots enforce a maximum depth of 5 and prohibit circular ancestry at the domain invariant level.
- Completing a parent task automatically completes all incomplete descendant subtasks.
- Subtasks strictly inherit their root parent's project ID.
- Every state change appends an immutable `DomainEvent` to the entity's internal buffer, which repository gateways publish atomically upon `save()`.
