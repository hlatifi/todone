import { CreateTaskRequestDTO, CreateTaskResponseDTO } from "./create-task-dto";

export interface CreateTaskOutputPort {
  presentSuccess(response: CreateTaskResponseDTO): void;
  presentError(error: Error): void;
}

export interface CreateTaskInputPort {
  execute(request: CreateTaskRequestDTO, presenter: CreateTaskOutputPort): Promise<void>;
}
