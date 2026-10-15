import {
  ValidationError,
  InvariantViolationError,
} from "../errors/domain-error";
import { Tag } from "../value-objects/tag";
import { DomainEvent } from "../events/domain-event";
import {
  TaskCreatedEvent,
  TaskCompletedEvent,
  TaskReopenedEvent,
  TaskArchivedEvent,
  TaskUnarchivedEvent,
  TaskDetailsUpdatedEvent,
  TaskScheduledEvent,
  TaskTagAddedEvent,
  TaskTagRemovedEvent,
  SubtaskAttachedEvent,
} from "../events/task-events";

export type TaskStatus = "active" | "completed" | "archived";

export interface TaskProps {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly status: TaskStatus;
  readonly projectId?: string;
  readonly parentId?: string;
  readonly depth: number;
  readonly subtaskIds: string[];
  readonly tags: string[];
  readonly dueDate?: Date;
  readonly reminderDate?: Date;
  readonly createdAt: Date;
  readonly completedAt?: Date;
  readonly archivedAt?: Date;
}

export class Task {
  private uncommittedEvents: DomainEvent[] = [];

  private constructor(private props: TaskProps) {}

  public static create(
    id: string,
    title: string,
    description?: string,
    projectId?: string,
    parentId?: string,
    depth: number = 1
  ): Task {
    const trimmedTitle = title ? title.trim() : "";
    if (!trimmedTitle) {
      throw new ValidationError("Task title cannot be empty", "title");
    }
    if (trimmedTitle.length > 255) {
      throw new ValidationError("Task title cannot exceed 255 characters", "title");
    }
    if (depth < 1) {
      throw new InvariantViolationError("Task depth cannot be less than 1");
    }
    if (depth > 5) {
      throw new InvariantViolationError("Maximum subtask depth of 5 exceeded");
    }
    if (parentId && parentId === id) {
      throw new InvariantViolationError("Task cannot be its own parent");
    }

    const createdAt = new Date();
    const task = new Task({
      id,
      title: trimmedTitle,
      description: description?.trim() || undefined,
      status: "active",
      projectId,
      parentId,
      depth,
      subtaskIds: [],
      tags: [],
      createdAt,
    });

    task.recordEvent({
      eventId: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      aggregateId: id,
      eventType: "TaskCreated",
      occurredAt: createdAt,
      title: trimmedTitle,
      description: task.props.description,
      projectId,
      parentId,
      depth,
    } as TaskCreatedEvent);

    return task;
  }

  public static reconstitute(props: TaskProps): Task {
    return new Task({
      ...props,
      subtaskIds: [...props.subtaskIds],
      tags: [...props.tags],
    });
  }

  public updateDetails(title: string, description?: string): void {
    const trimmedTitle = title ? title.trim() : "";
    if (!trimmedTitle) {
      throw new ValidationError("Task title cannot be empty", "title");
    }
    if (trimmedTitle.length > 255) {
      throw new ValidationError("Task title cannot exceed 255 characters", "title");
    }

    this.props = {
      ...this.props,
      title: trimmedTitle,
      description: description?.trim() || undefined,
    };

    this.recordEvent({
      eventId: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      aggregateId: this.id,
      eventType: "TaskDetailsUpdated",
      occurredAt: new Date(),
      title: trimmedTitle,
      description: this.props.description,
    } as TaskDetailsUpdatedEvent);
  }

  public schedule(dueDate?: Date, reminderDate?: Date): void {
    if (dueDate && reminderDate && reminderDate.getTime() > dueDate.getTime()) {
      throw new ValidationError(
        "Reminder date must be before or equal to due date",
        "reminderDate"
      );
    }

    this.props = {
      ...this.props,
      dueDate,
      reminderDate,
    };

    this.recordEvent({
      eventId: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      aggregateId: this.id,
      eventType: "TaskScheduled",
      occurredAt: new Date(),
      dueDate,
      reminderDate,
    } as TaskScheduledEvent);
  }

  public complete(cascadedSubtasks: Task[] = []): void {
    if (this.props.status === "completed") {
      return;
    }

    const now = new Date();
    this.props = {
      ...this.props,
      status: "completed",
      completedAt: now,
    };

    const cascadedIds: string[] = [];
    for (const subtask of cascadedSubtasks) {
      if (!subtask.isCompleted) {
        subtask.complete();
        cascadedIds.push(subtask.id);
      }
    }

    this.recordEvent({
      eventId: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      aggregateId: this.id,
      eventType: "TaskCompleted",
      occurredAt: now,
      completedAt: now,
      cascadedSubtaskIds: cascadedIds,
    } as TaskCompletedEvent);
  }

  public reopen(): void {
    if (this.props.status === "active") {
      return;
    }

    const now = new Date();
    this.props = {
      ...this.props,
      status: "active",
      completedAt: undefined,
    };

    this.recordEvent({
      eventId: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      aggregateId: this.id,
      eventType: "TaskReopened",
      occurredAt: now,
      reopenedAt: now,
    } as TaskReopenedEvent);
  }

  public toggle(cascadedSubtasks: Task[] = []): void {
    if (this.props.status === "completed") {
      this.reopen();
    } else {
      this.complete(cascadedSubtasks);
    }
  }

  public archive(cascadedSubtasks: Task[] = []): void {
    if (this.props.status === "archived") {
      return;
    }

    const now = new Date();
    this.props = {
      ...this.props,
      status: "archived",
      archivedAt: now,
    };

    const cascadedIds: string[] = [];
    for (const subtask of cascadedSubtasks) {
      if (!subtask.isArchived) {
        subtask.archive();
        cascadedIds.push(subtask.id);
      }
    }

    this.recordEvent({
      eventId: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      aggregateId: this.id,
      eventType: "TaskArchived",
      occurredAt: now,
      archivedAt: now,
      cascadedSubtaskIds: cascadedIds,
    } as TaskArchivedEvent);
  }

  public unarchive(): void {
    if (this.props.status !== "archived") {
      return;
    }

    const now = new Date();
    this.props = {
      ...this.props,
      status: this.props.completedAt ? "completed" : "active",
      archivedAt: undefined,
    };

    this.recordEvent({
      eventId: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      aggregateId: this.id,
      eventType: "TaskUnarchived",
      occurredAt: now,
      unarchivedAt: now,
    } as TaskUnarchivedEvent);
  }

  public addTag(rawTag: string | Tag): void {
    const tagObj = rawTag instanceof Tag ? rawTag : Tag.create(rawTag);
    const tagStr = tagObj.toString();

    if (this.props.tags.includes(tagStr)) {
      return;
    }

    this.props = {
      ...this.props,
      tags: [...this.props.tags, tagStr],
    };

    this.recordEvent({
      eventId: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      aggregateId: this.id,
      eventType: "TaskTagAdded",
      occurredAt: new Date(),
      tag: tagStr,
    } as TaskTagAddedEvent);
  }

  public removeTag(rawTag: string | Tag): void {
    const tagStr = (rawTag instanceof Tag ? rawTag : Tag.create(rawTag)).toString();

    if (!this.props.tags.includes(tagStr)) {
      return;
    }

    this.props = {
      ...this.props,
      tags: this.props.tags.filter((t) => t !== tagStr),
    };

    this.recordEvent({
      eventId: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      aggregateId: this.id,
      eventType: "TaskTagRemoved",
      occurredAt: new Date(),
      tag: tagStr,
    } as TaskTagRemovedEvent);
  }

  public attachSubtask(childTask: Task): void {
    if (childTask.id === this.id) {
      throw new InvariantViolationError("Task cannot attach itself as a subtask");
    }
    const nextDepth = this.depth + 1;
    if (nextDepth > 5) {
      throw new InvariantViolationError("Maximum subtask depth of 5 exceeded");
    }

    if (!this.props.subtaskIds.includes(childTask.id)) {
      this.props = {
        ...this.props,
        subtaskIds: [...this.props.subtaskIds, childTask.id],
      };
    }

    // Implicit Project Inheritance: Child inherits parent's project ID
    childTask.setHierarchy(this.id, this.projectId, nextDepth);

    this.recordEvent({
      eventId: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      aggregateId: this.id,
      eventType: "SubtaskAttached",
      occurredAt: new Date(),
      parentId: this.id,
      subtaskId: childTask.id,
      depth: nextDepth,
    } as SubtaskAttachedEvent);
  }

  public setHierarchy(parentId: string, projectId: string | undefined, depth: number): void {
    if (depth > 5) {
      throw new InvariantViolationError("Maximum subtask depth of 5 exceeded");
    }
    this.props = {
      ...this.props,
      parentId,
      projectId,
      depth,
    };
  }

  // Domain Event Buffer
  public getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  public clearUncommittedEvents(): void {
    this.uncommittedEvents = [];
  }

  protected recordEvent(event: DomainEvent): void {
    this.uncommittedEvents.push(event);
  }

  // Getters
  public get id(): string { return this.props.id; }
  public get title(): string { return this.props.title; }
  public get description(): string | undefined { return this.props.description; }
  public get status(): TaskStatus { return this.props.status; }
  public get isCompleted(): boolean { return this.props.status === "completed"; }
  public get isArchived(): boolean { return this.props.status === "archived"; }
  public get projectId(): string | undefined { return this.props.projectId; }
  public get parentId(): string | undefined { return this.props.parentId; }
  public get depth(): number { return this.props.depth; }
  public get subtaskIds(): string[] { return [...this.props.subtaskIds]; }
  public get tags(): string[] { return [...this.props.tags]; }
  public get dueDate(): Date | undefined { return this.props.dueDate; }
  public get reminderDate(): Date | undefined { return this.props.reminderDate; }
  public get createdAt(): Date { return this.props.createdAt; }
  public get completedAt(): Date | undefined { return this.props.completedAt; }
  public get archivedAt(): Date | undefined { return this.props.archivedAt; }

  public toSnapshot(): TaskProps {
    return {
      ...this.props,
      subtaskIds: [...this.props.subtaskIds],
      tags: [...this.props.tags],
    };
  }
}
