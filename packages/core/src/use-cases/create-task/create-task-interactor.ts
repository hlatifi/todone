import { Task } from "../../entities/task";
import { TaskGateway } from "../../gateways/task-gateway";
import { CreateTaskRequestDTO } from "./create-task-dto";
import { CreateTaskInputPort, CreateTaskOutputPort } from "./create-task-ports";

export class CreateTaskInteractor implements CreateTaskInputPort {
  constructor(private readonly taskGateway: TaskGateway) {}

  public async execute(
    request: CreateTaskRequestDTO,
    presenter: CreateTaskOutputPort
  ): Promise<void> {
    try {
      const id = await this.taskGateway.nextIdentity();
      const task = Task.create(id, request.title, request.description);
      await this.taskGateway.save(task);

      presenter.presentSuccess({
        id: task.id,
        title: task.title,
        description: task.description,
        completed: task.isCompleted,
        createdAt: task.createdAt.toISOString(),
      });
    } catch (error) {
      presenter.presentError(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
