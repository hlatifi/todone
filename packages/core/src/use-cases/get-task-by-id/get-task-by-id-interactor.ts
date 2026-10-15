import { TaskGateway } from "../../gateways/task-gateway";
import { EntityNotFoundError } from "../../errors/domain-error";
import { GetTaskByIdRequestDTO } from "./get-task-by-id-dto";
import { GetTaskByIdInputPort, GetTaskByIdOutputPort } from "./get-task-by-id-ports";

export class GetTaskByIdInteractor implements GetTaskByIdInputPort {
  constructor(private readonly taskGateway: TaskGateway) {}

  public async execute(
    request: GetTaskByIdRequestDTO,
    presenter: GetTaskByIdOutputPort
  ): Promise<void> {
    try {
      const task = await this.taskGateway.findById(request.id);
      if (!task) {
        throw new EntityNotFoundError("Task", request.id);
      }

      presenter.presentSuccess({
        id: task.id,
        title: task.title,
        description: task.description,
        completed: task.isCompleted,
        createdAt: task.createdAt.toISOString(),
        completedAt: task.completedAt?.toISOString(),
      });
    } catch (error) {
      presenter.presentError(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
