Feature: Note naming preference
  The progress/settings screen lets the user show note names as letters
  (A B C) instead of solfège (Do Ré Mi), and the choice applies app-wide.

  Background:
    Given I open the app
    And the practice stats are cleared

  Scenario: Notes default to solfège names
    When I choose the "Notes" mode
    Then I should see the note "Do" on the keyboard

  Scenario: Switching to letters relabels the note keyboard
    When I open my progress
    And I set the note naming to "letters"
    And I leave my progress
    And I choose the "Notes" mode
    Then I should see the note "C" on the keyboard
    And I should not see the note "Do" on the keyboard

  Scenario: The note naming choice persists across reloads
    When I open my progress
    And I set the note naming to "letters"
    And I leave my progress
    And I reload the app
    And I choose the "Notes" mode
    Then I should see the note "C" on the keyboard
