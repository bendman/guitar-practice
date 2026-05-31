@audio
Feature: Live note detection
  Drives the real microphone pitch-detection pipeline (usePitchDetection +
  lib/pitch) using a fake audio capture device fed a known 440 Hz (La) tone.
  No application code is mocked.

  Scenario: A played note is detected from the microphone
    Given I open the app
    And the practice stats are cleared
    When I choose the "Notes" mode
    And I enable microphone detection
    And I start the session
    Then the detected note should be "La"
