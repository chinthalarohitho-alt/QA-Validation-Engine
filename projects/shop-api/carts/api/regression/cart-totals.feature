@carts-api @money
Feature: Carts API - Totals are always consistent

  # The same money invariants checked across many carts, because an arithmetic bug that shows
  # only on certain quantities or prices will not show on cart 1.

  @regression @api-cart-02
  Scenario Outline: Cart <cart> adds up
    When I send a GET request to "/carts/<cart>"
    Then the response status should be 200
    And the response should match the "cart" schema
    And every cart line total should equal price times quantity
    And the cart total should equal the sum of its line totals
    And the cart counts should match its lines
    And the discounted total should not exceed the total

    Examples:
      | cart |
      | 2    |
      | 5    |
      | 10   |
      | 17   |
      | 25   |
      | 30   |

  @regression @api-cart-03
  Scenario: A new cart is priced by the server, not the client
    When I create a cart for user 1 with:
      | product | quantity |
      | 1       | 2        |
      | 2       | 1        |
      | 6       | 4        |
    Then the response status should be 201
    And the cart should hold exactly the quantities I asked for
    And every cart line total should equal price times quantity
    And the cart total should equal the sum of its line totals
    And the cart counts should match its lines
