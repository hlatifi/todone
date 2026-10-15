import { DeleteTaskRequestDTO, DeleteTaskResponseDTO } from "./delete-task-dto";

export interface DeleteTaskOutputPort {
  presentSuccess(response: DeleteTaskResponseDTO): void;
  presentError(error: Error): void;
}

export interface DeleteTaskInputPort {
  execute(request: DeleteTaskRequestDTO, presenter: DeleteTaskOutputPort): Promise<void>;
}
