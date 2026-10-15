import { FeatureIR, ScenarioIR, StepIR, ExampleRow, ExecutionResult } from "./ir-types";
import { StepRegistry } from "./step-registry";

export class AcceptanceRunner<TFixture> {
  constructor(
    private readonly registry: StepRegistry<TFixture>,
    private readonly fixtureFactory: () => TFixture
  ) {}

  public async runFeature(feature: FeatureIR): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];

    for (const scenario of feature.scenarios) {
      const scenarioResults = await this.runScenario(scenario, feature.background);
      results.push(...scenarioResults);
    }

    return results;
  }

  public async runScenario(
    scenario: ScenarioIR,
    background: StepIR[] = []
  ): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];
    const exampleRows: ExampleRow[] =
      scenario.examples.length > 0 ? scenario.examples : [{}];

    for (let index = 0; index < exampleRows.length; index++) {
      const example = exampleRows[index];
      const executionId = `${scenario.name}/example_${index + 1}`;
      const fixture = this.fixtureFactory();

      const allSteps = [...background, ...scenario.steps];
      const stepResults: ExecutionResult["stepResults"] = [];
      let scenarioPassed = true;
      let failureError: Error | undefined;

      for (const step of allSteps) {
        const resolvedText = this.interpolateStepText(step.text, example);
        const match = this.registry.findHandler(resolvedText);

        if (!match) {
          const unsupportedError = new Error(
            `Unsupported step [${step.keyword} ${resolvedText}] in ${executionId}`
          );
          stepResults.push({
            keyword: step.keyword,
            text: resolvedText,
            passed: false,
            error: unsupportedError,
          });
          scenarioPassed = false;
          failureError = unsupportedError;
          break;
        }

        try {
          await match.handler(fixture, match.args);
          stepResults.push({
            keyword: step.keyword,
            text: resolvedText,
            passed: true,
          });
        } catch (stepError) {
          const err = stepError instanceof Error ? stepError : new Error(String(stepError));
          stepResults.push({
            keyword: step.keyword,
            text: resolvedText,
            passed: false,
            error: err,
          });
          scenarioPassed = false;
          failureError = err;
          break;
        }
      }

      results.push({
        scenarioName: scenario.name,
        executionId,
        passed: scenarioPassed,
        error: failureError,
        stepResults,
      });
    }

    return results;
  }

  private interpolateStepText(text: string, example: ExampleRow): string {
    return text.replace(/<([A-Za-z0-9_]+)>/g, (_match, paramName) => {
      if (example[paramName] !== undefined) {
        return example[paramName];
      }
      return _match;
    });
  }
}
