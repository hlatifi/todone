export interface DeleteTaskRequestDTO {
  readonly id: string;
}

export interface DeleteTaskResponseDTO {
  readonly id: string;
  readonly success: boolean;
}
