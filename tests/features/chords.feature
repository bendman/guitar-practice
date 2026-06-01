Feature: Chord configuration
  Presets and progressions populate the active chord pool.

  Background:
    Given I open the app
    And the practice stats are cleared
    When I choose the "Accords" mode
    Then I should see the config screen

  Scenario: The Triades preset enables every root x 3 qualities
    When I select the "Triades" preset
    Then the chord total should be "36"

  Scenario: The Pop progression enables 4 chords
    When I select the "Pop I–V–vi–IV" progression
    Then the chord total should be "4"

  Scenario: QCM mode is disabled with fewer than 4 chords
    When I select the "Blues en La" progression
    Then the chord total should be "3"
    And the QCM mode should be disabled

  Scenario: QCM mode shows four hidden chord choices and reveals on pick
    When I select the "Triades" preset
    And I select the QCM progression mode
    And I start the session
    Then I should see the session screen
    And the quiz should show 4 choices
    And the quiz choice names should be hidden
    And the Next button should be disabled
    When I pick a quiz choice
    Then the quiz choice names should be revealed
    And the Next button should be enabled
    When I advance to the next quiz round
    Then the quiz should show 4 choices
    And the quiz choice names should be hidden
