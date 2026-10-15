Feature: Toggle Task Completion
  As a ToDone user
  I want to toggle task status between active and completed
  So that I can mark tasks done and reopen them when needed

  Background:
    Given an empty task list
    And a task exists with title "Ship Acceptance Harness" as active

  Scenario: Complete an active task
    When I toggle the task "Ship Acceptance Harness"
    Then the task "Ship Acceptance Harness" should be completed

  Scenario: Reopen a completed task
    Given a task exists with title "Reopenable task" as completed
    When I toggle the task "Reopenable task"
    Then the task "Reopenable task" should be saved and active
