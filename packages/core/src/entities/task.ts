import { ValidationError } from "../errors/domain-error";

export interface TaskProps {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly completed: boolean;
  readonly createdAt: Date;
  readonly completedAt?: Date;
}

export class Task {
  private constructor(private props: TaskProps) {}

  public static create(id: string, title: string, description?: string): Task {
    const trimmedTitle = title ? title.trim() : "";
    if (!trimmedTitle) {
      throw new ValidationError("Task title cannot be empty", "title");
    }
    if (trimmedTitle.length > 255) {
      throw new ValidationError("Task title cannot exceed 255 characters", "title");
    }

    return new Task({
      id,
      title: trimmedTitle,
      description: description?.trim() || undefined,
      completed: false,
      createdAt: new Date(),
    });
  }

  public static reconstitute(props: TaskProps): Task {
    return new Task({ ...props });
  }

  public updateDetails(title: string, description?: string): void {
    const trimmedTitle = title ? title.trim() : "";
    if (!trimmedTitle) {
      throw new ValidationError("Task title cannot be empty", "title");
    }
    if (trimmedTitle.length > 255) {
      throw new ValidationError("Task title cannot exceed 255 characters", "title");
    }

    this.props = {
      ...this.props,
      title: trimmedTitle,
      description: description?.trim() || undefined,
    };
  }

  public complete(): void {
    if (this.props.completed) {
      return;
    }
    this.props = {
      ...this.props,
      completed: true,
      completedAt: new Date(),
    };
  }

  public uncomplete(): void {
    if (!this.props.completed) {
      return;
    }
    this.props = {
      ...this.props,
      completed: false,
      completedAt: undefined,
    };
  }

  public toggle(): void {
    if (this.props.completed) {
      this.uncomplete();
    } else {
      this.complete();
    }
  }

  public get id(): string {
    return this.props.id;
  }

  public get title(): string {
    return this.props.title;
  }

  public get description(): string | undefined {
    return this.props.description;
  }

  public get isCompleted(): boolean {
    return this.props.completed;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  public toSnapshot(): TaskProps {
    return { ...this.props };
  }
}
