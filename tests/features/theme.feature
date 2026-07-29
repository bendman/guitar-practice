Feature: Colour scheme
  Both themes are the app icon read in either direction: its cream ground and
  its dark ink swap roles. The app follows the operating system by default, and
  the settings screen offers an explicit override that survives a reload.
  Choosing "system" hands control back to the OS.

  Background:
    Given I open the app
    And the practice stats are cleared

  Scenario: With no choice made, the app tracks the system both ways
    Given the system prefers "dark"
    When I open my progress
    Then the theme should not be pinned
    And the page background should be the dark ground
    When the system prefers "light"
    Then the page background should be the light ground

  Scenario: A pinned theme overrides the system and persists
    Given the system prefers "dark"
    When I open my progress
    And I set the theme to "Clair"
    Then the theme should be pinned to "light"
    And the page background should be the light ground
    And the stored setting "theme" should be "light"
    When I reload the app
    Then the theme should be pinned to "light"
    And the page background should be the light ground

  Scenario: Choosing system hands control back to the OS
    Given the system prefers "dark"
    When I open my progress
    And I set the theme to "Clair"
    And I set the theme to "Système"
    Then the theme should not be pinned
    And the stored setting "theme" should be "system"
    And the page background should be the dark ground
