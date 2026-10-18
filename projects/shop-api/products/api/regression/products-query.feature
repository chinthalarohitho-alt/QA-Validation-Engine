@products-api
Feature: Products API - Pagination, search, projection and sorting

  @regression @api-prd-03
  Scenario: limit and skip page through the catalogue
    When I send a GET request to "/products?limit=5&skip=10&select=id"
    Then the response status should be 200
    And the response field "skip" should be "10"
    And the response field "limit" should be "5"
    And the products should be ids 11 to 15

  @regression @api-prd-04
  Scenario Outline: Search for "<term>" returns only matching products
    When I send a GET request to "/products/search?q=<term>&limit=0&select=title,description"
    Then the response status should be 200
    And every product should mention "<term>" in its title or description

    Examples:
      | term   |
      | phone  |
      | laptop |
      | watch  |

  @regression @api-prd-05
  Scenario: select returns only the requested fields
    When I send a GET request to "/products?limit=5&select=title,price"
    Then the response status should be 200
    And every product should carry only the fields "title,price"

  @regression @api-prd-06
  Scenario Outline: Products can be sorted by <field> <order>
    When I send a GET request to "/products?limit=0&select=<field>&sortBy=<field>&order=<order>"
    Then the response status should be 200
    And the products should be sorted by <field> <order>

    Examples:
      | field | order |
      | price | asc   |
      | price | desc  |
      | title | asc   |

  @regression @api-prd-07
  Scenario: An unknown product is a 404 with a message
    When I send a GET request to "/products/99999"
    Then the response status should be 404
    And the response should match the "error" schema
    And the response field "message" should be "Product with id '99999' not found"
