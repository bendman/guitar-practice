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
