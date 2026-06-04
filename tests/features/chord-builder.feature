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

  Scenario: A non-barre D chord (000121) saves without a barre
    When I open my progress
    And I open the chord builder
    And I select the chord root "Ré"
    And I select the chord family "Majeur"
    And I tap string 4 at fret 1
    And I tap string 5 at fret 2
    And I tap string 6 at fret 1
    And I save the chord
    Then the custom voicing "re_maj" frets should be "0,0,0,1,2,1"
    And the custom voicing "re_maj" should not have a barre

  Scenario: A G barre chord (355433) is built by dragging a full barre
    When I open my progress
    And I open the chord builder
    And I select the chord root "Sol"
    And I select the chord family "Majeur"
    And I drag a barre from string 1 fret 3 to string 6 fret 3
    And I tap string 2 at fret 5
    And I tap string 3 at fret 5
    And I tap string 4 at fret 4
    Then the builder diagram should show a barre at fret 3

  Scenario: Tapping a barre removes it and opens those strings
    When I open my progress
    And I open the chord builder
    And I select the chord root "Do"
    And I select the chord family "Majeur"
    And I drag a barre from string 1 fret 3 to string 6 fret 3
    Then the builder diagram should show a barre at fret 3
    When I tap to remove string 1
    Then the builder diagram should not show a barre at fret 3
    And I save the chord
    And the custom voicing "do_maj" frets should be "0,0,0,0,0,0"
    And the custom voicing "do_maj" should not have a barre

  Scenario: A note cannot be placed on or under a barre
    When I open my progress
    And I open the chord builder
    And I select the chord root "Do"
    And I select the chord family "Majeur"
    And I drag a barre from string 1 fret 3 to string 6 fret 3
    And I tap string 1 at fret 2
    And I save the chord
    Then the custom voicing "do_maj" frets should be "3,3,3,3,3,3"
    And the custom voicing "do_maj" should have a barre from string 0 to string 5 at fret 3

  Scenario: A partial barre E7 (079797) bars only A through high E at fret 7
    When I open my progress
    And I open the chord builder
    And I select the chord root "Mi"
    And I select the chord family "7"
    And I raise the first case to 7
    And I drag a barre from string 2 fret 7 to string 6 fret 7
    And I tap string 3 at fret 9
    And I tap string 5 at fret 9
    And I save the chord
    Then the custom voicing "mi_dom7" frets should be "0,7,9,7,9,7"
    And the custom voicing "mi_dom7" should have a barre from string 1 to string 5 at fret 7

  Scenario: Adding a voicing from a session pauses it and returns there
    When I choose the "Accords" mode
    And I start the session
    And I reveal the chord
    And I add a voicing from the session
    Then I should see the chord builder
    When I save the chord
    Then I should see the session screen
    And I should be back at the revealed chord
