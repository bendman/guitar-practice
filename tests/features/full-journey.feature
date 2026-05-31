Feature: Full practice journey
  The complete end-to-end loop a user walks through: pick a mode, configure,
  practice, see results, and land back home with updated stats.

  Scenario: Complete a chord session from welcome to summary and back
    Given I open the app
    And the practice stats are cleared
    Then I should see the welcome screen
    And the sessions stat should be "0"

    When I choose the "Accords" mode
    Then I should see the config screen

    When I select the "Triades" preset
    And I start the session
    Then I should see the session screen

    When I reveal the chord
    And I grade the chord as "Trouvé"
    And I reveal the chord
    And I grade the chord as "Raté"
    And I reveal the chord
    And I grade the chord as "Trouvé"
    And I stop the session
    Then I should see the summary screen

    When I return to the home screen
    Then I should see the welcome screen
    And the sessions stat should be "1"
