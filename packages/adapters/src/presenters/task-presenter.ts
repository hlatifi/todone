import {
  CreateTaskOutputPort,
  CreateTaskResponseDTO,
  ListTasksOutputPort,
  ListTasksResponseDTO,
  ToggleTaskOutputPort,
  ToggleTaskResponseDTO,
} from "@todone/core";

export class SimpleCreateTaskPresenter implements CreateTaskOutputPort {
  public response?: CreateTaskResponseDTO;
  public error?: Error;

  public presentSuccess(response: CreateTaskResponseDTO): void {
    this.response = response;
  }

  public presentError(error: Error): void {
    this.error = error;
  }
}

export class SimpleListTasksPresenter implements ListTasksOutputPort {
  public response?: ListTasksResponseDTO;
  public error?: Error;

  public presentSuccess(response: ListTasksResponseDTO): void {
    this.response = response;
  }

  public presentError(error: Error): void {
    this.error = error;
  }
}

export class SimpleToggleTaskPresenter implements ToggleTaskOutputPort {
  public response?: ToggleTaskResponseDTO;
  public error?: Error;

  public presentSuccess(response: ToggleTaskResponseDTO): void {
    this.response = response;
  }

  public presentError(error: Error): void {
    this.error = error;
  }
}
