export interface TaskItemDTO {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly completed: boolean;
  readonly createdAt: string;
  readonly completedAt?: string;
}

export interface ListTasksRequestDTO {
  readonly filter?: "all" | "active" | "completed";
}

export interface ListTasksResponseDTO {
  readonly tasks: TaskItemDTO[];
}
