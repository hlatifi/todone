Feature: Update Task
  As a ToDone user
  I want to rename and edit existing tasks
  So that I can keep task details accurate as requirements evolve

  Background:
    Given an empty task list
    And a task exists with title "Draft Architecture" as active

  Scenario: Rename an existing task
    When I update the task "Draft Architecture" to "Finalize Clean Architecture"
    Then the task "Finalize Clean Architecture" should be saved and active
    And the task "Draft Architecture" should no longer exist
