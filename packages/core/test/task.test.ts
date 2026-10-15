import { describe, it, expect } from "vitest";
import {
  Task,
  Tag,
  Project,
  TaskGateway,
  CreateTaskInteractor,
  CreateTaskOutputPort,
  CreateTaskResponseDTO,
  ListTasksInteractor,
  ToggleTaskInteractor,
  DeleteTaskInteractor,
  UpdateTaskInteractor,
  GetTaskByIdInteractor,
  ValidationError,
  EntityNotFoundError,
  InvariantViolationError,
} from "../src";

class StubTaskGateway implements TaskGateway {
  private tasks = new Map<string, Task>();
  private counter = 1;

  async save(task: Task): Promise<void> {
    this.tasks.set(task.id, Task.reconstitute(task.toSnapshot()));
  }

  async findById(id: string): Promise<Task | null> {
    const task = this.tasks.get(id);
    return task ? Task.reconstitute(task.toSnapshot()) : null;
  }

  async findAll(): Promise<Task[]> {
    return Array.from(this.tasks.values()).map((t) =>
      Task.reconstitute(t.toSnapshot())
    );
  }

  async delete(id: string): Promise<void> {
    this.tasks.delete(id);
  }

  async nextIdentity(): Promise<string> {
    return `task-${this.counter++}`;
  }
}

describe("Clean Architecture Core - Domain Entities & Invariants", () => {
  it("enforces Tag value object normalization and invariants", () => {
    expect(() => Tag.create("")).toThrow(ValidationError);
    expect(() => Tag.create("   ")).toThrow(ValidationError);
    expect(() => Tag.create("invalid tag with spaces")).toThrow(ValidationError);
    expect(() => Tag.create("tag_with_underscores")).toThrow(ValidationError);

    const tag1 = Tag.create("#Architecture");
    const tag2 = Tag.create("architecture");
    expect(tag1.toString()).toBe("architecture");
    expect(tag1.toHashString()).toBe("#architecture");
    expect(tag1.equals(tag2)).toBe(true);
  });

  it("enforces Project entity invariants", () => {
    expect(() => Project.create("p1", "")).toThrow(ValidationError);
    const project = Project.create("p1", "Clean Architecture", "Desc", "#38bdf8");
    expect(project.name).toBe("Clean Architecture");
    expect(project.color).toBe("#38bdf8");
  });

  it("manages subtask hierarchy, depth cap of 5, and cycle guards", () => {
    const root = Task.create("root", "Root Task", undefined, "proj-1");
    expect(root.depth).toBe(1);
    expect(root.projectId).toBe("proj-1");

    expect(() => root.attachSubtask(root)).toThrow(InvariantViolationError);

    const child1 = Task.create("child-1", "Level 2 Child");
    root.attachSubtask(child1);
    expect(child1.depth).toBe(2);
    expect(child1.projectId).toBe("proj-1"); // Inherits project
    expect(child1.parentId).toBe("root");
    expect(root.subtaskIds).toContain("child-1");

    const child2 = Task.create("child-2", "Level 3 Child");
    child1.attachSubtask(child2);
    expect(child2.depth).toBe(3);

    const child3 = Task.create("child-3", "Level 4 Child");
    child2.attachSubtask(child3);
    expect(child3.depth).toBe(4);

    const child4 = Task.create("child-4", "Level 5 Child");
    child3.attachSubtask(child4);
    expect(child4.depth).toBe(5);

    const child5 = Task.create("child-5", "Level 6 Child - Exceeds Max");
    expect(() => child4.attachSubtask(child5)).toThrow(
      "Maximum subtask depth of 5 exceeded"
    );
  });

  it("cascades completion to incomplete descendant subtasks", () => {
    const parent = Task.create("p", "Parent Task");
    const sub1 = Task.create("s1", "Subtask 1");
    const sub2 = Task.create("s2", "Subtask 2");

    parent.attachSubtask(sub1);
    parent.attachSubtask(sub2);

    expect(parent.isCompleted).toBe(false);
    expect(sub1.isCompleted).toBe(false);

    parent.complete([sub1, sub2]);
    expect(parent.isCompleted).toBe(true);
    expect(sub1.isCompleted).toBe(true);
    expect(sub2.isCompleted).toBe(true);

    const events = parent.getUncommittedEvents();
    const completedEvent = events.find((e) => e.eventType === "TaskCompleted");
    expect(completedEvent).toBeDefined();
  });

  it("enforces temporal invariants for dueDate and reminderDate", () => {
    const task = Task.create("t1", "Scheduled Task");

    const futureDue = new Date(Date.now() + 86400000);
    const beforeReminder = new Date(Date.now() + 3600000);
    const afterReminder = new Date(Date.now() + 90000000);

    task.schedule(futureDue, beforeReminder);
    expect(task.dueDate).toEqual(futureDue);
    expect(task.reminderDate).toEqual(beforeReminder);

    expect(() => task.schedule(futureDue, afterReminder)).toThrow(
      "Reminder date must be before or equal to due date"
    );
  });

  it("buffers uncommitted Domain Events and allows clearing", () => {
    const task = Task.create("t-events", "Event Test");
    expect(task.getUncommittedEvents()).toHaveLength(1);
    expect(task.getUncommittedEvents()[0].eventType).toBe("TaskCreated");

    task.addTag("offline");
    expect(task.getUncommittedEvents()).toHaveLength(2);
    expect(task.getUncommittedEvents()[1].eventType).toBe("TaskTagAdded");

    task.clearUncommittedEvents();
    expect(task.getUncommittedEvents()).toHaveLength(0);
  });
});
