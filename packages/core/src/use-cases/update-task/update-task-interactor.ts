import { TaskGateway } from "../../gateways/task-gateway";
import { EntityNotFoundError } from "../../errors/domain-error";
import { UpdateTaskRequestDTO } from "./update-task-dto";
import { UpdateTaskInputPort, UpdateTaskOutputPort } from "./update-task-ports";

export class UpdateTaskInteractor implements UpdateTaskInputPort {
  constructor(private readonly taskGateway: TaskGateway) {}

  public async execute(
    request: UpdateTaskRequestDTO,
    presenter: UpdateTaskOutputPort
  ): Promise<void> {
    try {
      const task = await this.taskGateway.findById(request.id);
      if (!task) {
        throw new EntityNotFoundError("Task", request.id);
      }

      task.updateDetails(request.title, request.description);
      await this.taskGateway.save(task);

      presenter.presentSuccess({
        id: task.id,
        title: task.title,
        description: task.description,
        completed: task.isCompleted,
      });
    } catch (error) {
      presenter.presentError(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
