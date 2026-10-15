import { TaskGateway } from "../../gateways/task-gateway";
import { ListTasksRequestDTO, TaskItemDTO } from "./list-tasks-dto";
import { ListTasksInputPort, ListTasksOutputPort } from "./list-tasks-ports";

export class ListTasksInteractor implements ListTasksInputPort {
  constructor(private readonly taskGateway: TaskGateway) {}

  public async execute(
    request: ListTasksRequestDTO,
    presenter: ListTasksOutputPort
  ): Promise<void> {
    try {
      const allTasks = await this.taskGateway.findAll();
      const filter = request.filter || "all";

      const filtered = allTasks.filter((task) => {
        if (filter === "active") return !task.isCompleted;
        if (filter === "completed") return task.isCompleted;
        return true;
      });

      const tasksDTO: TaskItemDTO[] = filtered.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        completed: t.isCompleted,
        createdAt: t.createdAt.toISOString(),
        completedAt: t.completedAt?.toISOString(),
      }));

      presenter.presentSuccess({ tasks: tasksDTO });
    } catch (error) {
      presenter.presentError(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
