Feature: Session summary — notes seen
  An automatic notes session ends with a horizontal histogram of how often each
  note came up. It covers the whole selection, so notes that never appeared read
  as empty bars instead of going missing.

  Background:
    Given I open the app
    And the practice stats are cleared

  Scenario: The chart covers every selected note, including ones never shown
    # A 10s interval means nothing advances during the session, so every one of
    # the seven notes must be charted at zero.
    When I choose the "Notes" mode
    And I set the interval to "10"
    And I start the session
    And I wait 1 seconds
    And I stop the session
    Then I should see the summary screen
    And the summary should chart 7 notes seen
    And the summary should chart "Do" as seen 0 times
    And the summary should chart "Si" as seen 0 times

  Scenario: The whole selection is charted once notes start coming up
    When I choose the "Notes" mode
    And I start the session
    And I wait 3 seconds
    And I stop the session
    Then I should see the summary screen
    And the summary should chart 7 notes seen

  Scenario: The chord carousel summary has no note chart
    When I choose the "Accords" mode
    And I select the "Triades" preset
    And I select the "Auto" progression mode
    And I start the session
    And I wait 3 seconds
    And I stop the session
    Then I should see the summary screen
    And the summary should not chart the notes seen
