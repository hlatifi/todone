import { FeatureIR, ScenarioIR, StepIR, ExampleRow } from "../runtime/ir-types";

export class GherkinParser {
  private static readonly PARAMETER_REGEX = /<([A-Za-z0-9_]+)>/g;

  public static parse(content: string): FeatureIR {
    const rawLines = content.split(/\r?\n/);
    let featureName = "";
    const backgroundSteps: StepIR[] = [];
    const scenarios: ScenarioIR[] = [];

    let currentSection: "NONE" | "BACKGROUND" | "SCENARIO" | "EXAMPLES" = "NONE";
    let currentScenario: {
      name: string;
      steps: StepIR[];
      examples: ExampleRow[];
      exampleHeaders: string[];
    } | null = null;

    for (let lineIndex = 0; lineIndex < rawLines.length; lineIndex++) {
      const line = rawLines[lineIndex].trim();

      // Rule 1 & 2: Ignore blank lines and comments
      if (!line || line.startsWith("#")) {
        continue;
      }

      // Feature declaration
      if (line.startsWith("Feature:")) {
        featureName = line.slice("Feature:".length).trim();
        continue;
      }

      // Background declaration
      if (line.startsWith("Background:")) {
        if (!featureName) {
          throw new Error(`Line ${lineIndex + 1}: Background declared before Feature`);
        }
        currentSection = "BACKGROUND";
        continue;
      }

      // Scenario or Scenario Outline
      if (line.startsWith("Scenario:") || line.startsWith("Scenario Outline:")) {
        if (!featureName) {
          throw new Error(`Line ${lineIndex + 1}: Scenario declared before Feature`);
        }
        const colonIndex = line.indexOf(":");
        const scenarioName = line.slice(colonIndex + 1).trim();

        if (currentScenario) {
          scenarios.push({
            name: currentScenario.name,
            steps: currentScenario.steps,
            examples: currentScenario.examples,
          });
        }

        currentScenario = {
          name: scenarioName,
          steps: [],
          examples: [],
          exampleHeaders: [],
        };
        currentSection = "SCENARIO";
        continue;
      }

      // Examples section
      if (line.startsWith("Examples:")) {
        if (!currentScenario) {
          throw new Error(`Line ${lineIndex + 1}: Examples declared outside Scenario`);
        }
        currentSection = "EXAMPLES";
        continue;
      }

      // Examples table rows
      if (currentSection === "EXAMPLES" && line.startsWith("|")) {
        const cells = line
          .slice(1, line.lastIndexOf("|"))
          .split("|")
          .map((c) => c.trim());

        if (currentScenario!.exampleHeaders.length === 0) {
          // Header row
          currentScenario!.exampleHeaders = cells;
        } else {
          // Data row
          if (cells.length !== currentScenario!.exampleHeaders.length) {
            throw new Error(
              `Line ${lineIndex + 1}: Examples data row cell count (${cells.length}) does not match header count (${currentScenario!.exampleHeaders.length})`
            );
          }
          const row: ExampleRow = {};
          currentScenario!.exampleHeaders.forEach((header, idx) => {
            row[header] = cells[idx];
          });
          currentScenario!.examples.push(row);
        }
        continue;
      }

      // Steps
      const stepMatch = line.match(/^(Given|When|Then|And)\s+(.*)$/);
      if (stepMatch) {
        const keyword = stepMatch[1] as "Given" | "When" | "Then" | "And";
        const text = stepMatch[2].trim();
        const parameters: string[] = [];

        let match: RegExpExecArray | null;
        const paramRegex = new RegExp(GherkinParser.PARAMETER_REGEX);
        while ((match = paramRegex.exec(text)) !== null) {
          parameters.push(match[1]);
        }

        const step: StepIR = { keyword, text, parameters };

        if (currentSection === "BACKGROUND") {
          backgroundSteps.push(step);
        } else if (currentSection === "SCENARIO" || currentSection === "EXAMPLES") {
          currentScenario!.steps.push(step);
        } else {
          throw new Error(`Line ${lineIndex + 1}: Step declared outside Background or Scenario`);
        }
        continue;
      }

      // Free-form lines not matching supported syntax are ignored according to Rule 4
    }

    if (currentScenario) {
      scenarios.push({
        name: currentScenario.name,
        steps: currentScenario.steps,
        examples: currentScenario.examples,
      });
    }

    if (!featureName) {
      throw new Error("Missing Feature declaration in Gherkin content");
    }

    return {
      name: featureName,
      background: backgroundSteps,
      scenarios,
    };
  }
}
