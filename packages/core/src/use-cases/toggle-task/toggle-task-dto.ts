export interface ToggleTaskRequestDTO {
  readonly id: string;
}

export interface ToggleTaskResponseDTO {
  readonly id: string;
  readonly completed: boolean;
  readonly completedAt?: string;
}
