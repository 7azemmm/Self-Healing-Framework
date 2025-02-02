Feature: Login Functionality

Scenario: Successful login with valid credentials
    Given I am on the login page
    When I enter username "user@example.com"
    And I enter password "password123"
    And I click the login button
    Then I should see the dashboard

