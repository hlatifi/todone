import { Task, TaskGateway } from "@todone/core";

export class InMemoryTaskGateway implements TaskGateway {
  private tasks: Map<string, Task> = new Map();
  private idCounter = 1;
  private simulateFailure = false;
  private failureMessage = "Simulated storage gateway failure";

  public setSimulateFailure(shouldFail: boolean, message?: string): void {
    this.simulateFailure = shouldFail;
    if (message) {
      this.failureMessage = message;
    }
  }

  private checkFailure(): void {
    if (this.simulateFailure) {
      throw new Error(this.failureMessage);
    }
  }

  public async save(task: Task): Promise<void> {
    this.checkFailure();
    // Snapshot isolation: store a fresh reconstituted copy to prevent reference leakage
    this.tasks.set(task.id, Task.reconstitute(task.toSnapshot()));
  }

  public async findById(id: string): Promise<Task | null> {
    this.checkFailure();
    const task = this.tasks.get(id);
    return task ? Task.reconstitute(task.toSnapshot()) : null;
  }

  public async findAll(): Promise<Task[]> {
    this.checkFailure();
    return Array.from(this.tasks.values()).map((task) =>
      Task.reconstitute(task.toSnapshot())
    );
  }

  public async delete(id: string): Promise<void> {
    this.checkFailure();
    this.tasks.delete(id);
  }

  public async nextIdentity(): Promise<string> {
    this.checkFailure();
    return `task-${Date.now()}-${this.idCounter++}`;
  }

  public async clear(): Promise<void> {
    this.tasks.clear();
  }

  public get size(): number {
    return this.tasks.size;
  }
}
