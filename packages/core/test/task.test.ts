import { describe, it, expect } from "vitest";
import {
  Task,
  TaskGateway,
  CreateTaskInteractor,
  CreateTaskOutputPort,
  CreateTaskResponseDTO,
  ListTasksInteractor,
  ListTasksOutputPort,
  ListTasksResponseDTO,
  ToggleTaskInteractor,
  ToggleTaskOutputPort,
  ToggleTaskResponseDTO,
} from "../src";

class StubTaskGateway implements TaskGateway {
  private tasks = new Map<string, Task>();
  private counter = 1;

  async save(task: Task): Promise<void> {
    this.tasks.set(task.id, task);
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

describe("Clean Architecture Core - Task Entity & Interactors", () => {
  it("enforces Task entity validation rules and invariants", () => {
    expect(() => Task.create("1", "")).toThrow("Task title cannot be empty");
    expect(() => Task.create("1", "   ")).toThrow("Task title cannot be empty");
    expect(() => Task.create("1", "a".repeat(256))).toThrow(
      "Task title cannot exceed 255 characters"
    );

    const task = Task.create("1", "Valid task", "Description");
    expect(task.title).toBe("Valid task");
    expect(task.description).toBe("Description");
    expect(task.isCompleted).toBe(false);

    task.toggle();
    expect(task.isCompleted).toBe(true);
    expect(task.completedAt).toBeInstanceOf(Date);

    task.toggle();
    expect(task.isCompleted).toBe(false);
    expect(task.completedAt).toBeUndefined();
  });

  it("executes CreateTask use case across input/output ports", async () => {
    const gateway = new StubTaskGateway();
    const interactor = new CreateTaskInteractor(gateway);

    let receivedResponse: CreateTaskResponseDTO | undefined;
    const presenter: CreateTaskOutputPort = {
      presentSuccess(res) {
        receivedResponse = res;
      },
      presentError(err) {
        throw err;
      },
    };

    await interactor.execute({ title: "Write acceptance test" }, presenter);

    expect(receivedResponse).toBeDefined();
    expect(receivedResponse?.title).toBe("Write acceptance test");
    expect(receivedResponse?.completed).toBe(false);

    const saved = await gateway.findById(receivedResponse!.id);
    expect(saved?.title).toBe("Write acceptance test");
  });

  it("executes ListTasks and ToggleTask use cases", async () => {
    const gateway = new StubTaskGateway();
    const createInteractor = new CreateTaskInteractor(gateway);
    const listInteractor = new ListTasksInteractor(gateway);
    const toggleInteractor = new ToggleTaskInteractor(gateway);

    let res1: CreateTaskResponseDTO | undefined;
    await createInteractor.execute(
      { title: "Task 1" },
      {
        presentSuccess(res) {
          res1 = res;
        },
        presentError(e) {
          throw e;
        },
      }
    );

    await createInteractor.execute(
      { title: "Task 2" },
      {
        presentSuccess() {},
        presentError(e) {
          throw e;
        },
      }
    );

    let toggleRes: ToggleTaskResponseDTO | undefined;
    await toggleInteractor.execute(
      { id: res1!.id },
      {
        presentSuccess(res) {
          toggleRes = res;
        },
        presentError(e) {
          throw e;
        },
      }
    );
    expect(toggleRes?.completed).toBe(true);

    let activeList: ListTasksResponseDTO | undefined;
    await listInteractor.execute(
      { filter: "active" },
      {
        presentSuccess(res) {
          activeList = res;
        },
        presentError(e) {
          throw e;
        },
      }
    );
    expect(activeList?.tasks).toHaveLength(1);
    expect(activeList?.tasks[0].title).toBe("Task 2");

    let completedList: ListTasksResponseDTO | undefined;
    await listInteractor.execute(
      { filter: "completed" },
      {
        presentSuccess(res) {
          completedList = res;
        },
        presentError(e) {
          throw e;
        },
      }
    );
    expect(completedList?.tasks).toHaveLength(1);
    expect(completedList?.tasks[0].title).toBe("Task 1");
  });
});
