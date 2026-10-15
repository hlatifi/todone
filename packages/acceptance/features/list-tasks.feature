Feature: List Tasks
  As a ToDone user
  I want to filter and list tasks by their completion status
  So that I can focus on active work or review completed work

  Background:
    Given an empty task list
    And a task exists with title "Task Alpha" as active
    And a task exists with title "Task Beta" as completed
    And a task exists with title "Task Gamma" as active

  Scenario: List all tasks regardless of status
    When I list all tasks
    Then I should see 3 tasks

  Scenario: Filter active tasks only
    When I list active tasks
    Then I should see 2 tasks

  Scenario: Filter completed tasks only
    When I list completed tasks
    Then I should see 1 tasks
