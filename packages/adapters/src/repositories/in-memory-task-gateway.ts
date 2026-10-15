import { Task, TaskGateway } from "@todone/core";

export class InMemoryTaskGateway implements TaskGateway {
  private tasks: Map<string, Task> = new Map();
  private idCounter = 1;

  public async save(task: Task): Promise<void> {
    this.tasks.set(task.id, task);
  }

  public async findById(id: string): Promise<Task | null> {
    const task = this.tasks.get(id);
    return task ? Task.reconstitute(task.toSnapshot()) : null;
  }

  public async findAll(): Promise<Task[]> {
    return Array.from(this.tasks.values()).map((task) =>
      Task.reconstitute(task.toSnapshot())
    );
  }

  public async delete(id: string): Promise<void> {
    this.tasks.delete(id);
  }

  public async nextIdentity(): Promise<string> {
    const id = `task-${Date.now()}-${this.idCounter++}`;
    return id;
  }

  public async clear(): Promise<void> {
    this.tasks.clear();
  }
}
