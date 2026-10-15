import {
  CreateTaskOutputPort,
  CreateTaskResponseDTO,
  ListTasksOutputPort,
  ListTasksResponseDTO,
  ToggleTaskOutputPort,
  ToggleTaskResponseDTO,
  DeleteTaskOutputPort,
  DeleteTaskResponseDTO,
  UpdateTaskOutputPort,
  UpdateTaskResponseDTO,
  GetTaskByIdOutputPort,
  GetTaskByIdResponseDTO,
  TaskItemDTO,
} from "@todone/core";

export class SimpleCreateTaskPresenter implements CreateTaskOutputPort {
  public response?: CreateTaskResponseDTO;
  public error?: Error;

  public presentSuccess(response: CreateTaskResponseDTO): void {
    this.response = response;
  }

  public presentError(error: Error): void {
    this.error = error;
  }
}

export class SimpleListTasksPresenter implements ListTasksOutputPort {
  public response?: ListTasksResponseDTO;
  public error?: Error;

  public presentSuccess(response: ListTasksResponseDTO): void {
    this.response = response;
  }

  public presentError(error: Error): void {
    this.error = error;
  }
}

export class SimpleToggleTaskPresenter implements ToggleTaskOutputPort {
  public response?: ToggleTaskResponseDTO;
  public error?: Error;

  public presentSuccess(response: ToggleTaskResponseDTO): void {
    this.response = response;
  }

  public presentError(error: Error): void {
    this.error = error;
  }
}

export class SimpleDeleteTaskPresenter implements DeleteTaskOutputPort {
  public response?: DeleteTaskResponseDTO;
  public error?: Error;

  public presentSuccess(response: DeleteTaskResponseDTO): void {
    this.response = response;
  }

  public presentError(error: Error): void {
    this.error = error;
  }
}

export class SimpleUpdateTaskPresenter implements UpdateTaskOutputPort {
  public response?: UpdateTaskResponseDTO;
  public error?: Error;

  public presentSuccess(response: UpdateTaskResponseDTO): void {
    this.response = response;
  }

  public presentError(error: Error): void {
    this.error = error;
  }
}

export class SimpleGetTaskByIdPresenter implements GetTaskByIdOutputPort {
  public response?: GetTaskByIdResponseDTO;
  public error?: Error;

  public presentSuccess(response: GetTaskByIdResponseDTO): void {
    this.response = response;
  }

  public presentError(error: Error): void {
    this.error = error;
  }
}

// Presenter Protocol & View Models
export interface TaskViewModel {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly isCompleted: boolean;
  readonly statusBadge: "active" | "completed";
  readonly createdAtFormatted: string;
  readonly completedAtFormatted?: string;
}

export interface TaskListViewModel {
  readonly items: TaskViewModel[];
  readonly totalCount: number;
  readonly activeCount: number;
  readonly completedCount: number;
  readonly hasTasks: boolean;
  readonly errorMessage?: string;
}

export class TaskListPresenter implements ListTasksOutputPort {
  private currentViewModel: TaskListViewModel = {
    items: [],
    totalCount: 0,
    activeCount: 0,
    completedCount: 0,
    hasTasks: false,
  };

  private listeners: Set<(viewModel: TaskListViewModel) => void> = new Set();

  public subscribe(listener: (viewModel: TaskListViewModel) => void): () => void {
    this.listeners.add(listener);
    listener(this.currentViewModel);
    return () => this.listeners.delete(listener);
  }

  public get viewModel(): TaskListViewModel {
    return this.currentViewModel;
  }

  public presentSuccess(response: ListTasksResponseDTO): void {
    const items: TaskViewModel[] = response.tasks.map((dto) => this.mapToItemViewModel(dto));
    const completedCount = items.filter((i) => i.isCompleted).length;
    const totalCount = items.length;
    const activeCount = totalCount - completedCount;

    this.currentViewModel = {
      items,
      totalCount,
      activeCount,
      completedCount,
      hasTasks: totalCount > 0,
      errorMessage: undefined,
    };

    this.notify();
  }

  public presentError(error: Error): void {
    this.currentViewModel = {
      ...this.currentViewModel,
      errorMessage: error.message,
    };
    this.notify();
  }

  private mapToItemViewModel(dto: TaskItemDTO): TaskViewModel {
    const createdDate = new Date(dto.createdAt);
    const createdAtFormatted = !isNaN(createdDate.getTime())
      ? createdDate.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })
      : dto.createdAt;

    let completedAtFormatted: string | undefined;
    if (dto.completedAt) {
      const completedDate = new Date(dto.completedAt);
      if (!isNaN(completedDate.getTime())) {
        completedAtFormatted = completedDate.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
      }
    }

    return {
      id: dto.id,
      title: dto.title,
      description: dto.description || "",
      isCompleted: dto.completed,
      statusBadge: dto.completed ? "completed" : "active",
      createdAtFormatted,
      completedAtFormatted,
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.currentViewModel));
  }
}
