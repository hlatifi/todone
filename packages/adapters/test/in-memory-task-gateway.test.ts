import { describe, it, expect } from "vitest";
import { Task } from "@todone/core";
import { InMemoryTaskGateway } from "../src/repositories/in-memory-task-gateway";
import {
  SimpleCreateTaskPresenter,
  SimpleListTasksPresenter,
  SimpleToggleTaskPresenter,
} from "../src/presenters/task-presenter";

describe("Adapters - InMemoryTaskGateway & Presenters", () => {
  it("saves, finds, lists, and deletes tasks in memory", async () => {
    const gateway = new InMemoryTaskGateway();
    const task = Task.create("task-1", "Adapter test");

    await gateway.save(task);

    const found = await gateway.findById("task-1");
    expect(found).not.toBeNull();
    expect(found?.title).toBe("Adapter test");

    const all = await gateway.findAll();
    expect(all).toHaveLength(1);

    await gateway.delete("task-1");
    const afterDelete = await gateway.findById("task-1");
    expect(afterDelete).toBeNull();
  });

  it("handles presenters correctly", () => {
    const createPresenter = new SimpleCreateTaskPresenter();
    createPresenter.presentSuccess({
      id: "1",
      title: "Test",
      completed: false,
      createdAt: new Date().toISOString(),
    });
    expect(createPresenter.response?.title).toBe("Test");

    const listPresenter = new SimpleListTasksPresenter();
    listPresenter.presentError(new Error("Database offline"));
    expect(listPresenter.error?.message).toBe("Database offline");

    const togglePresenter = new SimpleToggleTaskPresenter();
    togglePresenter.presentSuccess({
      id: "1",
      completed: true,
    });
    expect(togglePresenter.response?.completed).toBe(true);
  });
});
