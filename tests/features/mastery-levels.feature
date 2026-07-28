Feature: Declaring mastery
  Automatic notes practice grades nothing, so it can never mark a note learned on
  its own. The user says so instead — from the summary histogram, from the
  learning details, or mid-session from the pause screen — and that judgement
  feeds the same weight the graded flows write.

  Background:
    Given I open the app
    And the practice stats are cleared

  Scenario: Mark a note mastered from the session pause screen
    When I choose the "Notes" mode
    And I set the interval to "10"
    And I start the session
    Then I should see the session screen
    When I click the pause button
    Then I should see the note levels dialog
    When I mark "Do" as "Maîtrisé"
    Then "Do" should be marked as "Maîtrisé"
    And the stored weight for "do" should be "0.35"

  Scenario: The panel is hidden until the session is paused
    When I choose the "Notes" mode
    And I set the interval to "10"
    And I start the session
    Then I should see the session screen
    And I should not see the note levels dialog

  Scenario: Resuming the session dismisses the panel
    When I choose the "Notes" mode
    And I set the interval to "10"
    And I start the session
    Then I should see the session screen
    When I click the pause button
    Then I should see the note levels dialog
    When I click the pause button
    Then I should not see the note levels dialog

  Scenario: A declared level survives the session and shows on the summary
    When I choose the "Notes" mode
    And I set the interval to "10"
    And I start the session
    Then I should see the session screen
    When I click the pause button
    And I mark "La" as "Difficile"
    And I click the pause button
    And I stop the session
    Then I should see the summary screen
    And "La" should be marked as "Difficile"

  Scenario: Mark a note straight from the summary histogram
    When I choose the "Notes" mode
    And I set the interval to "10"
    And I start the session
    And I stop the session
    Then I should see the summary screen
    When I mark "Si" as "Maîtrisé"
    Then "Si" should be marked as "Maîtrisé"
    And the stored weight for "si" should be "0.35"

  Scenario: Levels are editable from the learning details too
    When I choose the "Notes" mode
    And I set the interval to "10"
    And I start the session
    And I open the learning details
    And I mark "Fa" as "Moyen"
    Then the stored weight for "fa" should be "1.3"

  Scenario: Marking a note back to new clears its record
    When I choose the "Notes" mode
    And I set the interval to "10"
    And I start the session
    Then I should see the session screen
    When I click the pause button
    And I mark "Mi" as "Maîtrisé"
    Then the stored weight for "mi" should be "0.35"
    When I mark "Mi" as "Nouveau"
    Then the progress weights should be empty
