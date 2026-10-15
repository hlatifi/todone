import { describe, it, expect } from "vitest";
import { GherkinParser } from "../src/parser/gherkin-parser";

describe("GherkinParser - APS parser-spec.md Conformance", () => {
  it("rejects feature files missing Feature declaration", () => {
    expect(() =>
      GherkinParser.parse(`
        Scenario: Orphan scenario
          Given something
      `)
    ).toThrow("Scenario declared before Feature");
  });

  it("parses background, scenarios, and step parameters accurately into JSON IR", () => {
    const featureContent = `
      # Comment line should be ignored
      Feature: Manage Commitments

      Background:
        Given an empty task list

      Scenario: Create valid task
        When I create a task with title "Learn Clean Architecture"
        Then the task "Learn Clean Architecture" should be saved and active

      Scenario Outline: Title invariant validation
        When I create a task with title "<title>"
        Then an error should be returned with message "<error>"

        Examples:
          | title | error                      |
          |       | Task title cannot be empty |
    `;

    const ir = GherkinParser.parse(featureContent);

    expect(ir.name).toBe("Manage Commitments");
    expect(ir.background).toHaveLength(1);
    expect(ir.background[0]).toEqual({
      keyword: "Given",
      text: "an empty task list",
      parameters: [],
    });

    expect(ir.scenarios).toHaveLength(2);

    const scenario1 = ir.scenarios[0];
    expect(scenario1.name).toBe("Create valid task");
    expect(scenario1.steps).toHaveLength(2);
    expect(scenario1.examples).toHaveLength(0);

    const scenario2 = ir.scenarios[1];
    expect(scenario2.name).toBe("Title invariant validation");
    expect(scenario2.steps).toHaveLength(2);
    expect(scenario2.steps[0].parameters).toEqual(["title"]);
    expect(scenario2.steps[1].parameters).toEqual(["error"]);
    expect(scenario2.examples).toHaveLength(1);
    expect(scenario2.examples[0]).toEqual({
      title: "",
      error: "Task title cannot be empty",
    });
  });

  it("throws parsing error when Examples row column count does not match header count", () => {
    const invalidTable = `
      Feature: Invalid Examples Table
      Scenario Outline: Test
        When I do "<action>"
        Examples:
          | action | extra |
          | only-one-cell |
    `;

    expect(() => GherkinParser.parse(invalidTable)).toThrow(
      "Examples data row cell count"
    );
  });
});
