@inventory
Feature: Products - Smoke

  @smoke @critical @web-inv-01
  Scenario: The catalogue lists every product with a name and a price
    Given I am on the products page
    Then I should see 6 products
    And every product should show a name and a positive price
