import { ValidationError } from "../errors/domain-error";

export interface ProjectProps {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly color?: string;
  readonly createdAt: Date;
}

export class Project {
  private constructor(private props: ProjectProps) {}

  public static create(
    id: string,
    name: string,
    description?: string,
    color?: string
  ): Project {
    const trimmed = name ? name.trim() : "";
    if (!trimmed) {
      throw new ValidationError("Project name cannot be empty", "name");
    }
    if (trimmed.length > 100) {
      throw new ValidationError(
        "Project name cannot exceed 100 characters",
        "name"
      );
    }

    return new Project({
      id,
      name: trimmed,
      description: description?.trim() || undefined,
      color: color?.trim() || undefined,
      createdAt: new Date(),
    });
  }

  public static reconstitute(props: ProjectProps): Project {
    return new Project({ ...props });
  }

  public get id(): string {
    return this.props.id;
  }

  public get name(): string {
    return this.props.name;
  }

  public get description(): string | undefined {
    return this.props.description;
  }

  public get color(): string | undefined {
    return this.props.color;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public toSnapshot(): ProjectProps {
    return { ...this.props };
  }
}
