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

  Scenario: QCM pause button toggles between pause and resume states
    When I select the "Triades" preset
    And I select the QCM progression mode
    And I start the session
    Then I should see the session screen
    And the pause button should show "Pause"
    When I click the pause button
    Then the pause button should show "Reprendre"
    When I click the pause button
    Then the pause button should show "Pause"

  Scenario: QCM session tracks practice time for summary
    When I select the "Triades" preset
    And I select the QCM progression mode
    And I start the session
    Then I should see the session screen
    When I wait 2 seconds
    And I stop the session
    Then I should see the summary screen
    And the session duration should be at least 1 second

  Scenario: User saves current chord selection as a named custom preset
    When I select the "Pop I–V–vi–IV" progression
    Then the chord total should be "4"
    When I save the current selection as a preset named "Mon Pop"
    Then I should see a chip labeled "Mon Pop"
    And the chip "Mon Pop" should be active

  Scenario: Custom preset persists across reload and can be deleted
    When I select the "Blues en La" progression
    And I save the current selection as a preset named "Blues perso"
    And I reload the app
    And I choose the "Accords" mode
    Then I should see a chip labeled "Blues perso"
    When I delete the preset "Blues perso"
    Then I should not see a chip labeled "Blues perso"
