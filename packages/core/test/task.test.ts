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
  DeleteTaskInteractor,
  DeleteTaskOutputPort,
  DeleteTaskResponseDTO,
  UpdateTaskInteractor,
  UpdateTaskOutputPort,
  UpdateTaskResponseDTO,
  GetTaskByIdInteractor,
  GetTaskByIdOutputPort,
  GetTaskByIdResponseDTO,
  ValidationError,
  EntityNotFoundError,
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

describe("Clean Architecture Core - Task Entity & Boundaries", () => {
  it("enforces Task entity validation rules with typed ValidationError", () => {
    expect(() => Task.create("1", "")).toThrow(ValidationError);
    expect(() => Task.create("1", "   ")).toThrow(ValidationError);
    expect(() => Task.create("1", "a".repeat(256))).toThrow(ValidationError);

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

    task.updateDetails("Updated title", "Updated desc");
    expect(task.title).toBe("Updated title");
    expect(task.description).toBe("Updated desc");

    expect(() => task.updateDetails("")).toThrow(ValidationError);
  });

  it("executes CreateTask and GetTaskById use cases across boundary ports", async () => {
    const gateway = new StubTaskGateway();
    const createInteractor = new CreateTaskInteractor(gateway);
    const getInteractor = new GetTaskByIdInteractor(gateway);

    let createRes: CreateTaskResponseDTO | undefined;
    await createInteractor.execute(
      { title: "Boundary check", description: "Clean Architecture" },
      {
        presentSuccess(res) {
          createRes = res;
        },
        presentError(err) {
          throw err;
        },
      }
    );

    expect(createRes).toBeDefined();
    expect(createRes?.title).toBe("Boundary check");

    let getRes: GetTaskByIdResponseDTO | undefined;
    await getInteractor.execute(
      { id: createRes!.id },
      {
        presentSuccess(res) {
          getRes = res;
        },
        presentError(err) {
          throw err;
        },
      }
    );

    expect(getRes?.id).toBe(createRes!.id);
    expect(getRes?.description).toBe("Clean Architecture");
  });

  it("presents EntityNotFoundError when accessing non-existent task", async () => {
    const gateway = new StubTaskGateway();
    const toggleInteractor = new ToggleTaskInteractor(gateway);
    const deleteInteractor = new DeleteTaskInteractor(gateway);
    const getInteractor = new GetTaskByIdInteractor(gateway);

    let capturedError: Error | undefined;

    await toggleInteractor.execute(
      { id: "non-existent" },
      {
        presentSuccess() {},
        presentError(err) {
          capturedError = err;
        },
      }
    );
    expect(capturedError).toBeInstanceOf(EntityNotFoundError);

    capturedError = undefined;
    await deleteInteractor.execute(
      { id: "non-existent" },
      {
        presentSuccess() {},
        presentError(err) {
          capturedError = err;
        },
      }
    );
    expect(capturedError).toBeInstanceOf(EntityNotFoundError);

    capturedError = undefined;
    await getInteractor.execute(
      { id: "non-existent" },
      {
        presentSuccess() {},
        presentError(err) {
          capturedError = err;
        },
      }
    );
    expect(capturedError).toBeInstanceOf(EntityNotFoundError);
  });

  it("executes UpdateTask and DeleteTask use cases", async () => {
    const gateway = new StubTaskGateway();
    const createInteractor = new CreateTaskInteractor(gateway);
    const updateInteractor = new UpdateTaskInteractor(gateway);
    const deleteInteractor = new DeleteTaskInteractor(gateway);

    let createRes: CreateTaskResponseDTO | undefined;
    await createInteractor.execute(
      { title: "Original Title" },
      {
        presentSuccess(res) {
          createRes = res;
        },
        presentError(e) {
          throw e;
        },
      }
    );

    let updateRes: UpdateTaskResponseDTO | undefined;
    await updateInteractor.execute(
      { id: createRes!.id, title: "Renamed Title", description: "Added desc" },
      {
        presentSuccess(res) {
          updateRes = res;
        },
        presentError(e) {
          throw e;
        },
      }
    );
    expect(updateRes?.title).toBe("Renamed Title");
    expect(updateRes?.description).toBe("Added desc");

    let deleteRes: DeleteTaskResponseDTO | undefined;
    await deleteInteractor.execute(
      { id: createRes!.id },
      {
        presentSuccess(res) {
          deleteRes = res;
        },
        presentError(e) {
          throw e;
        },
      }
    );
    expect(deleteRes?.success).toBe(true);

    const remaining = await gateway.findAll();
    expect(remaining).toHaveLength(0);
  });
});
