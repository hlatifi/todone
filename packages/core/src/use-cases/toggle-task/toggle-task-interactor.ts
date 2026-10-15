import { TaskGateway } from "../../gateways/task-gateway";
import { EntityNotFoundError } from "../../errors/domain-error";
import { ToggleTaskRequestDTO } from "./toggle-task-dto";
import { ToggleTaskInputPort, ToggleTaskOutputPort } from "./toggle-task-ports";

export class ToggleTaskInteractor implements ToggleTaskInputPort {
  constructor(private readonly taskGateway: TaskGateway) {}

  public async execute(
    request: ToggleTaskRequestDTO,
    presenter: ToggleTaskOutputPort
  ): Promise<void> {
    try {
      const task = await this.taskGateway.findById(request.id);
      if (!task) {
        throw new EntityNotFoundError("Task", request.id);
      }

      task.toggle();
      await this.taskGateway.save(task);

      presenter.presentSuccess({
        id: task.id,
        completed: task.isCompleted,
        completedAt: task.completedAt?.toISOString(),
      });
    } catch (error) {
      presenter.presentError(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
