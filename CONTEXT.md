# ToDone Domain Context

ToDone is an offline-first, cross-platform task and commitment management application operating with Uncle Bob's Clean Architecture.

## Language

### Core Entities & Boundaries

**Task**:
An actionable commitment with a title, optional description, binary completion state, and hierarchical subtask capabilities.
_Avoid_: Item, action, todo, ticket

**Subtask**:
A task that is hierarchically nested underneath another parent task, inheriting the parent's project boundary.
_Avoid_: Child item, step, checklist item

**Project**:
A high-level organizational boundary grouping related tasks and workflows.
_Avoid_: Folder, workspace, category, list

**Tag**:
A normalized alphanumeric slug attached to a task to enable cross-cutting categorical filtering.
_Avoid_: Label, hashtag, category, badge

### Lifecycle & Scheduling

**Active**:
The lifecycle state of a task representing an open, incomplete commitment requiring action.
_Avoid_: Open, pending, in-progress, todo

**Completed**:
The lifecycle state of a task representing a fulfilled commitment.
_Avoid_: Done, closed, resolved, finished

**Archived**:
The lifecycle state of a task and its descendant subtasks that hides them from default active and completed views without permanently destroying their record.
_Avoid_: Deleted, hidden, muted, soft-deleted

**Due Date**:
The target date by which a task is expected to be completed.
_Avoid_: Deadline, target date, expiry

**Reminder Date**:
The scheduled timestamp at which an alert should notify the user of an impending due date.
_Avoid_: Alarm, notification timestamp, alert

### Synchronization & Domain Events

**Domain Event**:
An immutable record capturing a significant business state transition within the domain aggregate, buffered in-memory and emitted upon atomic persistence.
_Avoid_: Mutation, action, message, sync payload
