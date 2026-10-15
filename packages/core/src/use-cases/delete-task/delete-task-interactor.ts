import { TaskGateway } from "../../gateways/task-gateway";
import { EntityNotFoundError } from "../../errors/domain-error";
import { DeleteTaskRequestDTO } from "./delete-task-dto";
import { DeleteTaskInputPort, DeleteTaskOutputPort } from "./delete-task-ports";

export class DeleteTaskInteractor implements DeleteTaskInputPort {
  constructor(private readonly taskGateway: TaskGateway) {}

  public async execute(
    request: DeleteTaskRequestDTO,
    presenter: DeleteTaskOutputPort
  ): Promise<void> {
    try {
      const existing = await this.taskGateway.findById(request.id);
      if (!existing) {
        throw new EntityNotFoundError("Task", request.id);
      }

      await this.taskGateway.delete(request.id);
      presenter.presentSuccess({ id: request.id, success: true });
    } catch (error) {
      presenter.presentError(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
