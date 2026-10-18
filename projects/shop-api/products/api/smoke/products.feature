@products-api
Feature: Products API - Smoke

  @smoke @critical @api-prd-01
  Scenario: A single product matches its contract
    When I send a GET request to "/products/1"
    Then the response status should be 200
    And the response should match the "product" schema

  @smoke @api-prd-02
  Scenario: The product list matches its contract
    When I send a GET request to "/products?limit=10"
    Then the response status should be 200
    And the response should match the "product-list" schema
    And the response should contain 10 products
    And every listed product should match the product schema
