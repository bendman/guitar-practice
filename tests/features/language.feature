Feature: Interface language
  The app is French by default (browser detection with French fallback), and
  the settings screen offers an English override that persists across reloads.

  Background:
    Given I open the app
    And the practice stats are cleared

  Scenario: Switching to English translates the UI and persists
    When I open my progress
    And I set the language to "English"
    Then the settings screen should be in English
    And the stored setting "language" should be "en"
    When I reload the app
    Then the home screen should be in English
