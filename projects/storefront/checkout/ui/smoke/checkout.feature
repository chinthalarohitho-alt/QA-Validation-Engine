@checkout
Feature: Checkout - Smoke

  As a shopper
  I want to pay the right amount and get a confirmation
  So that I trust the store with my money

  @smoke @critical @money @web-chk-01
  Scenario: A single-item order is totalled correctly and completes
    Given I am on the products page
    When I add "Sauce Labs Backpack" to the cart
    And I open the cart
    And I go to checkout
    And I enter valid customer details
    Then the order total should be "$32.39"
    When I finish the order
    Then I should see the order confirmation
    And the cart badge should not be shown
