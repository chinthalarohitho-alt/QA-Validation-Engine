@checkout @money
Feature: Checkout - Totals and validation

  # The money rules are re-derived from what the shopper saw on the catalogue, not compared
  # against a hard-coded total — so a price change in the store cannot break these, only a
  # wrong calculation can.

  @regression @web-chk-02
  Scenario Outline: The summary for <case> adds up
    Given I am on the products page
    When I add these products to the cart:
      | <first>  |
      | <second> |
    And I open the cart
    And I go to checkout
    And I enter valid customer details
    Then the item total should equal the sum of the prices I added
    And the tax should be 8% of the item total
    And the order total should equal the item total plus tax

    Examples:
      | case                     | first                   | second                            |
      | the two cheapest items   | Sauce Labs Onesie       | Sauce Labs Bike Light             |
      | the two dearest items    | Sauce Labs Fleece Jacket | Sauce Labs Backpack              |
      | two items at equal price | Sauce Labs Bolt T-Shirt | Test.allTheThings() T-Shirt (Red) |

  @regression @web-chk-03
  Scenario: The whole catalogue in one order adds up
    Given I am on the products page
    When I add these products to the cart:
      | Sauce Labs Backpack               |
      | Sauce Labs Bike Light             |
      | Sauce Labs Bolt T-Shirt           |
      | Sauce Labs Fleece Jacket          |
      | Sauce Labs Onesie                 |
      | Test.allTheThings() T-Shirt (Red) |
    And I open the cart
    And I go to checkout
    And I enter valid customer details
    Then the item total should equal the sum of the prices I added
    And the tax should be 8% of the item total
    And the order total should equal the item total plus tax

  @regression @web-chk-04
  Scenario Outline: Checkout refuses to continue with <field> blank
    Given I am on the products page
    When I add "Sauce Labs Backpack" to the cart
    And I open the cart
    And I go to checkout
    And I enter customer details with <field> left blank
    Then I should see the checkout error "<error>"

    Examples:
      | field      | error                          |
      | firstName  | Error: First Name is required  |
      | lastName   | Error: Last Name is required   |
      | postalCode | Error: Postal Code is required |
