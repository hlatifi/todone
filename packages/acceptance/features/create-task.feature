Feature: Create Task
  As a ToDone user
  I want to create tasks with title and optional description
  So that I can keep track of my commitments

  Background:
    Given an empty task list

  Scenario: Successfully create an active task
    When I create a task with title "Complete Clean Architecture setup" and description "Zero framework dependencies in core"
    Then the task "Complete Clean Architecture setup" should be saved and active

  Scenario Outline: Reject tasks violating title validation invariants
    When I create a task with title "<title>"
    Then an error should be returned with message "<error>"

    Examples:
      | title | error                       |
      |       | Task title cannot be empty  |
      |    | Task title cannot be empty  |
