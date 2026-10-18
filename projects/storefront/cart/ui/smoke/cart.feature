@cart
Feature: Cart - Smoke

  @smoke @critical @web-cart-01
  Scenario: A product added from the catalogue appears in the cart at the same price
    Given I am on the products page
    When I add "Sauce Labs Backpack" to the cart
    Then the cart badge should show 1
    When I open the cart
    Then the cart should list exactly the products I added, at the prices I saw
