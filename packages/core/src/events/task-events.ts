import { DomainEvent } from "./domain-event";

export interface TaskCreatedEvent extends DomainEvent {
  readonly eventType: "TaskCreated";
  readonly title: string;
  readonly description?: string;
  readonly projectId?: string;
  readonly parentId?: string;
  readonly depth: number;
}

export interface TaskCompletedEvent extends DomainEvent {
  readonly eventType: "TaskCompleted";
  readonly completedAt: Date;
  readonly cascadedSubtaskIds: string[];
}

export interface TaskReopenedEvent extends DomainEvent {
  readonly eventType: "TaskReopened";
  readonly reopenedAt: Date;
}

export interface TaskArchivedEvent extends DomainEvent {
  readonly eventType: "TaskArchived";
  readonly archivedAt: Date;
  readonly cascadedSubtaskIds: string[];
}

export interface TaskUnarchivedEvent extends DomainEvent {
  readonly eventType: "TaskUnarchived";
  readonly unarchivedAt: Date;
}

export interface TaskDetailsUpdatedEvent extends DomainEvent {
  readonly eventType: "TaskDetailsUpdated";
  readonly title: string;
  readonly description?: string;
}

export interface TaskScheduledEvent extends DomainEvent {
  readonly eventType: "TaskScheduled";
  readonly dueDate?: Date;
  readonly reminderDate?: Date;
}

export interface TaskTagAddedEvent extends DomainEvent {
  readonly eventType: "TaskTagAdded";
  readonly tag: string;
}

export interface TaskTagRemovedEvent extends DomainEvent {
  readonly eventType: "TaskTagRemoved";
  readonly tag: string;
}

export interface SubtaskAttachedEvent extends DomainEvent {
  readonly eventType: "SubtaskAttached";
  readonly parentId: string;
  readonly subtaskId: string;
  readonly depth: number;
}

export type TaskDomainEvent =
  | TaskCreatedEvent
  | TaskCompletedEvent
  | TaskReopenedEvent
  | TaskArchivedEvent
  | TaskUnarchivedEvent
  | TaskDetailsUpdatedEvent
  | TaskScheduledEvent
  | TaskTagAddedEvent
  | TaskTagRemovedEvent
  | SubtaskAttachedEvent;
