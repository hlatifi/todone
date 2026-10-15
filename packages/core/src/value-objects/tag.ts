import { ValidationError } from "../errors/domain-error";

export class Tag {
  private readonly value: string;

  private constructor(rawTag: string) {
    let normalized = rawTag.trim();
    if (normalized.startsWith("#")) {
      normalized = normalized.slice(1);
    }
    normalized = normalized.toLowerCase();

    if (!normalized) {
      throw new ValidationError("Tag cannot be empty", "tag");
    }
    if (normalized.length > 50) {
      throw new ValidationError("Tag cannot exceed 50 characters", "tag");
    }
    if (!/^[a-z0-9-]+$/.test(normalized)) {
      throw new ValidationError(
        `Tag "${normalized}" must contain only alphanumeric characters and hyphens`,
        "tag"
      );
    }

    this.value = normalized;
  }

  public static create(rawTag: string): Tag {
    return new Tag(rawTag);
  }

  public toString(): string {
    return this.value;
  }

  public toHashString(): string {
    return `#${this.value}`;
  }

  public equals(other: Tag): boolean {
    return this.value === other.value;
  }
}
