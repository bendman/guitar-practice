Feature: Chord builder
  Users build custom chord voicings on an interactive diagram and save them
  as extra voicings on an existing root+quality chord.

  Background:
    Given I open the app
    And the practice stats are cleared

  Scenario: Open the builder from the settings screen as an overlay
    When I open my progress
    And I open the chord builder
    Then I should see the chord builder
    And I should see the settings screen

  Scenario: Build a voicing, save it, and see it listed with a delete button
    When I open my progress
    And I open the chord builder
    And I select the chord root "Do"
    And I select the chord family "Majeur"
    And I tap string 1 at fret 3
    And I save the chord
    Then the custom voicings store should contain "do_maj"
    When I expand the chord "Do Majeur"
    Then I should see a custom voicing for "Do Majeur"

  Scenario: Delete a custom voicing removes it from storage
    When I open my progress
    And I open the chord builder
    And I select the chord root "Do"
    And I select the chord family "Majeur"
    And I tap string 1 at fret 3
    And I save the chord
    And I expand the chord "Do Majeur"
    And I delete the custom voicing for "Do Majeur"
    Then there should be no custom voicing for "Do Majeur"
    And the custom voicings store should be empty

  Scenario: A saved voicing persists across reloads
    When I open my progress
    And I open the chord builder
    And I select the chord root "Do"
    And I select the chord family "Majeur"
    And I tap string 1 at fret 3
    And I save the chord
    And I reload the app
    And I open my progress
    And I expand the chord "Do Majeur"
    Then I should see a custom voicing for "Do Majeur"

  Scenario: Saving a duplicate of an existing voicing is blocked
    When I open my progress
    And I open the chord builder
    And I select the chord root "Mi"
    And I select the chord family "Majeur"
    And I tap string 2 at fret 2
    And I tap string 3 at fret 2
    And I tap string 4 at fret 1
    Then the save chord button should be disabled
    And I should see the duplicate warning

  Scenario: Adding a voicing from a session pauses it and returns there
    When I choose the "Accords" mode
    And I start the session
    And I reveal the chord
    And I add a voicing from the session
    Then I should see the chord builder
    When I save the chord
    Then I should see the session screen
    And I should be back at the revealed chord
