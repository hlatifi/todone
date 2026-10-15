import {
  CreateTaskInteractor,
  CreateTaskOutputPort,
  CreateTaskResponseDTO,
  ListTasksInteractor,
  ListTasksOutputPort,
  ListTasksResponseDTO,
  ToggleTaskInteractor,
  ToggleTaskOutputPort,
  ToggleTaskResponseDTO,
  TaskItemDTO,
} from "@todone/core";
import { InMemoryTaskGateway } from "@todone/adapters";
import { StepRegistry } from "../runtime/step-registry";

export class TaskFixture
  implements CreateTaskOutputPort, ListTasksOutputPort, ToggleTaskOutputPort
{
  public readonly gateway = new InMemoryTaskGateway();
  public readonly createInteractor = new CreateTaskInteractor(this.gateway);
  public readonly listInteractor = new ListTasksInteractor(this.gateway);
  public readonly toggleInteractor = new ToggleTaskInteractor(this.gateway);

  public lastCreateResponse?: CreateTaskResponseDTO;
  public lastListResponse?: ListTasksResponseDTO;
  public lastToggleResponse?: ToggleTaskResponseDTO;
  public lastError?: Error;

  // Output Port Callbacks
  public presentSuccess(
    response: CreateTaskResponseDTO | ListTasksResponseDTO | ToggleTaskResponseDTO
  ): void {
    if ("tasks" in response) {
      this.lastListResponse = response;
    } else if ("title" in response) {
      this.lastCreateResponse = response;
    } else {
      this.lastToggleResponse = response;
    }
  }

  public presentError(error: Error): void {
    this.lastError = error;
  }

  // Step Methods
  public async givenEmptyTaskList(): Promise<void> {
    await this.gateway.clear();
    this.lastCreateResponse = undefined;
    this.lastListResponse = undefined;
    this.lastToggleResponse = undefined;
    this.lastError = undefined;
  }

  public async givenTaskExists(title: string, completed: boolean = false): Promise<void> {
    await this.createInteractor.execute({ title }, this);
    if (completed && this.lastCreateResponse) {
      await this.toggleInteractor.execute({ id: this.lastCreateResponse.id }, this);
    }
  }

  public async whenICreateTask(title: string, description?: string): Promise<void> {
    await this.createInteractor.execute({ title, description }, this);
  }

  public async whenIToggleTask(title: string): Promise<void> {
    const tasks = await this.gateway.findAll();
    const task = tasks.find((t) => t.title === title);
    if (!task) {
      throw new Error(`Task with title "${title}" not found for toggle`);
    }
    await this.toggleInteractor.execute({ id: task.id }, this);
  }

  public async whenIListTasks(filter: "all" | "active" | "completed" = "all"): Promise<void> {
    await this.listInteractor.execute({ filter }, this);
  }

  public async thenTaskShouldBeActive(title: string): Promise<boolean> {
    const tasks = await this.gateway.findAll();
    const task = tasks.find((t) => t.title === title);
    return task !== undefined && !task.isCompleted;
  }

  public async thenTaskShouldBeCompleted(title: string): Promise<boolean> {
    const tasks = await this.gateway.findAll();
    const task = tasks.find((t) => t.title === title);
    return task !== undefined && task.isCompleted;
  }

  public async getListedTasks(): Promise<TaskItemDTO[]> {
    return this.lastListResponse ? this.lastListResponse.tasks : [];
  }
}

export function createTaskStepRegistry(): StepRegistry<TaskFixture> {
  const registry = new StepRegistry<TaskFixture>();

  // Given an empty task list
  registry.register(/an empty task list/i, async (fixture) => {
    await fixture.givenEmptyTaskList();
  });

  // Given a task exists with title "..."
  registry.register(
    /a task exists with title "([^"]+)"(?:\s+as (active|completed))?/i,
    async (fixture, [title, state]) => {
      await fixture.givenTaskExists(title, state === "completed");
    }
  );

  // When I create a task with title "..."
  registry.register(
    /I create a task with title "([^"]*)"(?: and description "([^"]*)")?/i,
    async (fixture, [title, description]) => {
      await fixture.whenICreateTask(title, description);
    }
  );

  // When I toggle the task "..."
  registry.register(
    /I toggle the task "([^"]+)"/i,
    async (fixture, [title]) => {
      await fixture.whenIToggleTask(title);
    }
  );

  // When I list all tasks
  registry.register(
    /I list (all|active|completed) tasks/i,
    async (fixture, [filter]) => {
      await fixture.whenIListTasks(filter as "all" | "active" | "completed");
    }
  );

  // Then the task "..." should be saved and active
  registry.register(
    /the task "([^"]+)" should be saved and active/i,
    async (fixture, [title]) => {
      const active = await fixture.thenTaskShouldBeActive(title);
      if (!active) {
        throw new Error(`Expected task "${title}" to be saved and active`);
      }
    }
  );

  // Then the task "..." should be completed
  registry.register(
    /the task "([^"]+)" should be completed/i,
    async (fixture, [title]) => {
      const completed = await fixture.thenTaskShouldBeCompleted(title);
      if (!completed) {
        throw new Error(`Expected task "${title}" to be completed`);
      }
    }
  );

  // Then I should see {count} tasks
  registry.register(
    /I should see (\d+) tasks?/i,
    async (fixture, [countStr]) => {
      const expected = parseInt(countStr, 10);
      const tasks = await fixture.getListedTasks();
      if (tasks.length !== expected) {
        throw new Error(
          `Expected ${expected} tasks, but received ${tasks.length} (${tasks.map((t) => t.title).join(", ")})`
        );
      }
    }
  );

  // Then an error should be returned with message "..."
  registry.register(
    /an error should be returned with message "([^"]+)"/i,
    async (fixture, [expectedMsg]) => {
      if (!fixture.lastError) {
        throw new Error(`Expected error containing "${expectedMsg}", but no error occurred`);
      }
      if (!fixture.lastError.message.includes(expectedMsg)) {
        throw new Error(
          `Expected error message "${expectedMsg}", but got "${fixture.lastError.message}"`
        );
      }
    }
  );

  return registry;
}
