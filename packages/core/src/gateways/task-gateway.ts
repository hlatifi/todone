import { Task } from "../entities/task";

export interface TaskGateway {
  save(task: Task): Promise<void>;
  findById(id: string): Promise<Task | null>;
  findAll(): Promise<Task[]>;
  delete(id: string): Promise<void>;
  nextIdentity(): Promise<string>;
}
