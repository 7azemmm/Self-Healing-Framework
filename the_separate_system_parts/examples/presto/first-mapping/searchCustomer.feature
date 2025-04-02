Feature: Search Customer

Scenario: Search Custome
    Given I am on the customer page
    When I enter query "1272"
    I should see "محمد الكميشي"