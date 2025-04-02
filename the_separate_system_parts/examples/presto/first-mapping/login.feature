Feature: Login Functionality

Scenario: Successful login with valid credentials
    Given I am on the login page
    When I enter email "super_admin@prestoeat.com"
    And I enter password "12345678"
    And I click the login button
    Then I should see the dashboard

