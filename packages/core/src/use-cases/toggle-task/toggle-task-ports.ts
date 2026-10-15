import { ToggleTaskRequestDTO, ToggleTaskResponseDTO } from "./toggle-task-dto";

export interface ToggleTaskOutputPort {
  presentSuccess(response: ToggleTaskResponseDTO): void;
  presentError(error: Error): void;
}

export interface ToggleTaskInputPort {
  execute(request: ToggleTaskRequestDTO, presenter: ToggleTaskOutputPort): Promise<void>;
}
