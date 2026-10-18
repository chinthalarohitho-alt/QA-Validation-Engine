@cart
Feature: Cart - Managing items

  @regression @web-cart-02
  Scenario: The badge counts every product added
    Given I am on the products page
    When I add these products to the cart:
      | Sauce Labs Backpack     |
      | Sauce Labs Bike Light   |
      | Sauce Labs Bolt T-Shirt |
    Then the cart badge should show 3

  @regression @web-cart-03
  Scenario: Removing a product updates the cart and the badge
    Given I am on the products page
    When I add these products to the cart:
      | Sauce Labs Backpack   |
      | Sauce Labs Bike Light |
    And I open the cart
    And I remove "Sauce Labs Backpack" from the cart
    Then the cart should list exactly the products I added, at the prices I saw
    And the cart badge should show 1

  @regression @web-cart-04
  Scenario: Removing the last product empties the cart and hides the badge
    Given I am on the products page
    When I add "Sauce Labs Onesie" to the cart
    And I open the cart
    And I remove "Sauce Labs Onesie" from the cart
    Then the cart should be empty
    And the cart badge should not be shown
