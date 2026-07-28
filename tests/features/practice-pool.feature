Feature: Practice pool
  The working-set bucket is a spaced-repetition aid for the chord flows that
  grade: they earn the weights that let mastered chords rotate the bucket. Notes
  practice has no such bucket, so every note the user selected can be asked for
  the whole session.

  Background:
    Given I open the app
    And the practice stats are cleared

  Scenario: Every selected note stays active during a notes session
    When I choose the "Notes" mode
    And I start the session
    And I open the learning details
    Then the "active" learning section should list 7 items
    And the learning details should not show a working set limit

  Scenario: An ungraded notes session leaves the progress weights alone
    When I choose the "Notes" mode
    And I start the session
    And I wait 3 seconds
    And I stop the session
    Then I should see the summary screen
    And the progress weights should be empty

  Scenario: The ungraded chord carousel leaves the progress weights alone
    When I choose the "Accords" mode
    And I select the "Triades" preset
    And I select the "Auto" progression mode
    And I start the session
    And I wait 3 seconds
    And I stop the session
    Then I should see the summary screen
    And the progress weights should be empty

  Scenario: Graded chord practice keeps its working set
    When I choose the "Accords" mode
    And I select the "Triades" preset
    And I start the session
    And I open the learning details
    Then the "active" learning section should list 5 items
    And the "waiting" learning section should list 31 items
    And the learning details should show a working set limit
