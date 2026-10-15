import { UpdateTaskRequestDTO, UpdateTaskResponseDTO } from "./update-task-dto";

export interface UpdateTaskOutputPort {
  presentSuccess(response: UpdateTaskResponseDTO): void;
  presentError(error: Error): void;
}

export interface UpdateTaskInputPort {
  execute(request: UpdateTaskRequestDTO, presenter: UpdateTaskOutputPort): Promise<void>;
}
