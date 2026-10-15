import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { GherkinParser } from "../src/parser/gherkin-parser";
import { AcceptanceRunner } from "../src/runtime/acceptance-runner";
import { TaskFixture, createTaskStepRegistry } from "../src/fixtures/task-fixture";

describe("Acceptance Pipeline Specification (APS) Harness", () => {
  const featuresDir = path.resolve(__dirname, "../features");
  const featureFiles = fs
    .readdirSync(featuresDir)
    .filter((f) => f.endsWith(".feature"));

  const registry = createTaskStepRegistry();
  const runner = new AcceptanceRunner(registry, () => new TaskFixture());

  for (const file of featureFiles) {
    const fullPath = path.join(featuresDir, file);
    const content = fs.readFileSync(fullPath, "utf-8");
    const featureIR = GherkinParser.parse(content);

    describe(`Feature: ${featureIR.name} (${file})`, () => {
      for (const scenario of featureIR.scenarios) {
        const exampleCount =
          scenario.examples.length > 0 ? scenario.examples.length : 1;

        for (let idx = 0; idx < exampleCount; idx++) {
          const executionName = `${scenario.name}${
            scenario.examples.length > 0 ? ` [example ${idx + 1}]` : ""
          }`;

          it(executionName, async () => {
            const singleScenarioResults = await runner.runScenario(
              {
                ...scenario,
                examples:
                  scenario.examples.length > 0
                    ? [scenario.examples[idx]]
                    : [],
              },
              featureIR.background
            );

            expect(singleScenarioResults).toHaveLength(1);
            const result = singleScenarioResults[0];

            if (!result.passed) {
              const failedStep = result.stepResults.find((s) => !s.passed);
              const errMsg = failedStep?.error?.message || "Scenario step failed";
              throw new Error(
                `Step failed: "${failedStep?.keyword} ${failedStep?.text}" -> ${errMsg}`
              );
            }

            expect(result.passed).toBe(true);
          });
        }
      }
    });
  }
});
