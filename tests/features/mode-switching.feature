Feature: Switching between learning modes
  The chord progression mode (Manuelle / Auto / QCM) is shared, persisted state.
  Switching between chords and notes practice must not leave one mode's
  behaviour stuck in the other — each session's timer must keep running.

  Background:
    Given I open the app
    And the practice stats are cleared

  Scenario: Notes practice still advances after a chord QCM session
    When I choose the "Accords" mode
    And I select the "Triades" preset
    And I select the QCM progression mode
    And I start the session
    And I stop the session
    And I return to the home screen
    And I choose the "Notes" mode
    And I start the session
    Then I should see the session screen
    And the practice should advance past the first card

  Scenario: Chord practice still advances after a notes session
    When I choose the "Notes" mode
    And I start the session
    And I stop the session
    And I return to the home screen
    And I choose the "Accords" mode
    And I select the "Triades" preset
    And I select the "Auto" progression mode
    And I start the session
    Then I should see the session screen
    And the practice should advance past the first card
