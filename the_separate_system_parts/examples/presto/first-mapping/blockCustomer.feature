Feature: Block Customer

Scenario: Block Customer
    Given I am on the customer page
    When I click Procedures bsutton
    Then I click Block button
    And I enter note "fraud"
    Then I click Confirm button 
