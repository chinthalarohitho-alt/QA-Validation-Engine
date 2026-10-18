@auth-api
Feature: Auth API - Smoke

  # Proves the chain every other API scenario stands on: the configured account can sign in,
  # and the token it gets back identifies it. If this fails, nothing else here can be trusted.

  @smoke @critical @api-auth-01
  Scenario: The configured account signs in and receives a valid token
    When I sign in to the API with the configured account
    Then the response status should be 200
    And the response should match the "login" schema
    And the token should identify the configured account

  @smoke @critical @api-auth-02
  Scenario: The current user is resolved from the token
    When I send a GET request to "/auth/me"
    Then the response status should be 200
    And the response should match the "current-user" schema
