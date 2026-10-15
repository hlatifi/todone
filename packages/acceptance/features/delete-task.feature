Feature: Delete Task
  As a ToDone user
  I want to delete tasks
  So that I can remove unwanted or canceled commitments

  Background:
    Given an empty task list
    And a task exists with title "Temporary Task" as active

  Scenario: Delete an existing task
    When I delete the task "Temporary Task"
    Then the task "Temporary Task" should no longer exist
