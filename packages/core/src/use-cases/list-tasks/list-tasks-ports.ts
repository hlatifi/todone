import { ListTasksRequestDTO, ListTasksResponseDTO } from "./list-tasks-dto";

export interface ListTasksOutputPort {
  presentSuccess(response: ListTasksResponseDTO): void;
  presentError(error: Error): void;
}

export interface ListTasksInputPort {
  execute(request: ListTasksRequestDTO, presenter: ListTasksOutputPort): Promise<void>;
}
