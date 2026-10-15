export interface UpdateTaskRequestDTO {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
}

export interface UpdateTaskResponseDTO {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly completed: boolean;
}
