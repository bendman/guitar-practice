Feature: Welcome screen
  The landing screen shows lifetime stats and routes into a practice mode.

  Background:
    Given I open the app
    And the practice stats are cleared

  Scenario: Choosing Notes mode opens the config screen
    When I choose the "Notes" mode
    Then I should see the config screen

  Scenario: Choosing Chords mode opens the config screen
    When I choose the "Accords" mode
    Then I should see the config screen
