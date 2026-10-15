import { describe, it, expect } from "vitest";
import { Task } from "@todone/core";
import { InMemoryTaskGateway } from "../src/repositories/in-memory-task-gateway";
import {
  SimpleCreateTaskPresenter,
  SimpleListTasksPresenter,
  SimpleToggleTaskPresenter,
  SimpleDeleteTaskPresenter,
  SimpleUpdateTaskPresenter,
  SimpleGetTaskByIdPresenter,
  TaskListPresenter,
  TaskListViewModel,
} from "../src/presenters/task-presenter";

describe("Adapters - InMemoryTaskGateway & Presenter Protocols", () => {
  it("enforces snapshot isolation in gateway storage", async () => {
    const gateway = new InMemoryTaskGateway();
    const task = Task.create("task-1", "Original Title");

    await gateway.save(task);

    // Mutating external entity after save should NOT affect the saved gateway snapshot
    task.updateDetails("Locally Mutated Title");

    const retrieved = await gateway.findById("task-1");
    expect(retrieved?.title).toBe("Original Title");
  });

  it("supports failure simulation for resilience testing", async () => {
    const gateway = new InMemoryTaskGateway();
    gateway.setSimulateFailure(true, "Simulated disk I/O failure");

    const task = Task.create("task-1", "Test");
    await expect(gateway.save(task)).rejects.toThrow("Simulated disk I/O failure");
    await expect(gateway.findById("task-1")).rejects.toThrow("Simulated disk I/O failure");
    await expect(gateway.findAll()).rejects.toThrow("Simulated disk I/O failure");
    await expect(gateway.delete("task-1")).rejects.toThrow("Simulated disk I/O failure");
    await expect(gateway.nextIdentity()).rejects.toThrow("Simulated disk I/O failure");

    gateway.setSimulateFailure(false);
    await expect(gateway.save(task)).resolves.toBeUndefined();
  });

  it("transforms DTOs into reactive TaskListViewModel via TaskListPresenter", () => {
    const presenter = new TaskListPresenter();
    const emittedViewModels: TaskListViewModel[] = [];

    const unsubscribe = presenter.subscribe((vm) => {
      emittedViewModels.push(vm);
    });

    expect(presenter.viewModel.totalCount).toBe(0);
    expect(presenter.viewModel.hasTasks).toBe(false);

    presenter.presentSuccess({
      tasks: [
        {
          id: "1",
          title: "Architecture Review",
          description: "Clean Architecture & APS",
          completed: false,
          createdAt: new Date("2026-10-15T10:00:00Z").toISOString(),
        },
        {
          id: "2",
          title: "Expo Client",
          completed: true,
          createdAt: new Date("2026-10-14T10:00:00Z").toISOString(),
          completedAt: new Date("2026-10-15T11:00:00Z").toISOString(),
        },
      ],
    });

    const vm = presenter.viewModel;
    expect(vm.totalCount).toBe(2);
    expect(vm.activeCount).toBe(1);
    expect(vm.completedCount).toBe(1);
    expect(vm.hasTasks).toBe(true);

    const activeItem = vm.items.find((i) => i.id === "1")!;
    expect(activeItem.statusBadge).toBe("active");
    expect(activeItem.description).toBe("Clean Architecture & APS");

    const completedItem = vm.items.find((i) => i.id === "2")!;
    expect(completedItem.statusBadge).toBe("completed");
    expect(completedItem.completedAtFormatted).toBeDefined();

    presenter.presentError(new Error("Network timeout"));
    expect(presenter.viewModel.errorMessage).toBe("Network timeout");

    unsubscribe();
  });

  it("handles simple delete, update, and get presenters", () => {
    const delPresenter = new SimpleDeleteTaskPresenter();
    delPresenter.presentSuccess({ id: "1", success: true });
    expect(delPresenter.response?.success).toBe(true);

    const updatePresenter = new SimpleUpdateTaskPresenter();
    updatePresenter.presentSuccess({
      id: "1",
      title: "New Title",
      completed: false,
    });
    expect(updatePresenter.response?.title).toBe("New Title");

    const getPresenter = new SimpleGetTaskByIdPresenter();
    getPresenter.presentSuccess({
      id: "1",
      title: "Title",
      completed: false,
      createdAt: new Date().toISOString(),
    });
    expect(getPresenter.response?.id).toBe("1");
  });
});
