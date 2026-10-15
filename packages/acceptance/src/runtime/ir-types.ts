export interface StepIR {
  readonly keyword: "Given" | "When" | "Then" | "And";
  readonly text: string;
  readonly parameters: string[];
}

export type ExampleRow = Record<string, string>;

export interface ScenarioIR {
  readonly name: string;
  readonly steps: StepIR[];
  readonly examples: ExampleRow[];
}

export interface FeatureIR {
  readonly name: string;
  readonly background: StepIR[];
  readonly scenarios: ScenarioIR[];
}

export interface ExecutionResult {
  readonly scenarioName: string;
  readonly executionId: string;
  readonly passed: boolean;
  readonly error?: Error;
  readonly stepResults: Array<{
    readonly keyword: string;
    readonly text: string;
    readonly passed: boolean;
    readonly error?: Error;
  }>;
}
