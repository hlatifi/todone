import { GetTaskByIdRequestDTO, GetTaskByIdResponseDTO } from "./get-task-by-id-dto";

export interface GetTaskByIdOutputPort {
  presentSuccess(response: GetTaskByIdResponseDTO): void;
  presentError(error: Error): void;
}

export interface GetTaskByIdInputPort {
  execute(request: GetTaskByIdRequestDTO, presenter: GetTaskByIdOutputPort): Promise<void>;
}
