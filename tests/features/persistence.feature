Feature: Settings persistence
  Configuration is written to real localStorage so it survives reloads.

  Scenario: The interval is persisted
    Given I open the app
    And the practice stats are cleared
    When I choose the "Notes" mode
    And I set the interval to "4"
    Then the interval display should show "4"
