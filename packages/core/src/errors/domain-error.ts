export abstract class DomainError extends Error {
  public abstract readonly code: string;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends DomainError {
  public readonly code = "VALIDATION_ERROR";

  constructor(message: string, public readonly field?: string) {
    super(message);
  }
}

export class EntityNotFoundError extends DomainError {
  public readonly code = "ENTITY_NOT_FOUND";

  constructor(
    public readonly entityName: string,
    public readonly entityId: string
  ) {
    super(`${entityName} with id "${entityId}" was not found`);
  }
}

export class InvariantViolationError extends DomainError {
  public readonly code = "INVARIANT_VIOLATION";

  constructor(message: string) {
    super(message);
  }
}
