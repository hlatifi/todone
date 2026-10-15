export type StepHandler<TFixture> = (
  fixture: TFixture,
  args: string[]
) => Promise<void> | void;

interface RegisteredStep<TFixture> {
  readonly pattern: RegExp;
  readonly handler: StepHandler<TFixture>;
}

export class StepRegistry<TFixture> {
  private steps: RegisteredStep<TFixture>[] = [];

  public register(
    pattern: string | RegExp,
    handler: StepHandler<TFixture>
  ): void {
    if (typeof pattern === "string") {
      // Escape special regex chars except for quotes or placeholders
      const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      this.steps.push({
        pattern: new RegExp(`^${escaped}$`, "i"),
        handler,
      });
    } else {
      this.steps.push({
        pattern,
        handler,
      });
    }
  }

  public findHandler(
    stepText: string
  ): { handler: StepHandler<TFixture>; args: string[] } | null {
    for (const step of this.steps) {
      const match = step.pattern.exec(stepText);
      if (match) {
        const args = Array.from(match).slice(1);
        return { handler: step.handler, args };
      }
    }
    return null;
  }
}
