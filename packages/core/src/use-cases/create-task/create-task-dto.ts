export interface CreateTaskRequestDTO {
  readonly title: string;
  readonly description?: string;
}

export interface CreateTaskResponseDTO {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly completed: boolean;
  readonly createdAt: string;
}
