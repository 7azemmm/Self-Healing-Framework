Feature: signup Functionality

Scenario: Successful signup with valid credentials
    Given I am on the signup page
    When I enter username "user@example.com"
    And I enter password "password123"
    And I click the signup button
    Then I should see the login

