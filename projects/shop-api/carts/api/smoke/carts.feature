@carts-api @money
Feature: Carts API - Smoke

  @smoke @critical @api-cart-01
  Scenario: A stored cart matches its contract and adds up
    When I send a GET request to "/carts/1"
    Then the response status should be 200
    And the response should match the "cart" schema
    And every cart line total should equal price times quantity
    And the cart total should equal the sum of its line totals
