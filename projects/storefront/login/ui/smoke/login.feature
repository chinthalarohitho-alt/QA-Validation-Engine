@logged-out @login
Feature: Login - Smoke

  As a shopper
  I want to sign in with my account
  So that I can reach the store

  @smoke @critical @web-login-01
  Scenario: A registered user signs in and lands on the products page
    Given I am on the login page
    When I sign in as "standard_user"
    Then I should land on the products page

  @smoke @critical @web-login-02
  Scenario: A locked-out user is refused with a reason
    Given I am on the login page
    When I sign in as "locked_out_user"
    Then I should see the login error "Epic sadface: Sorry, this user has been locked out."
    And I should still be on the login page
