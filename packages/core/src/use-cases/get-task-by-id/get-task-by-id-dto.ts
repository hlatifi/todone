export interface GetTaskByIdRequestDTO {
  readonly id: string;
}

export interface GetTaskByIdResponseDTO {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly completed: boolean;
  readonly createdAt: string;
  readonly completedAt?: string;
}
