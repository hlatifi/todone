import { TaskGateway } from "../../gateways/task-gateway";
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
        throw new Error(`Task with id ${request.id} not found`);
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
