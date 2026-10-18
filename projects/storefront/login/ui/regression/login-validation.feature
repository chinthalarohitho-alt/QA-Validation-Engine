@logged-out @login
Feature: Login - Validation and access control

  As the store
  I want every bad sign-in refused with a clear message, and every page gated
  So that nobody reaches the store without a valid account

  @regression @web-login-03
  Scenario Outline: Sign-in is refused for <case>
    Given I am on the login page
    When I sign in as "<username>" with password "<password>"
    Then I should see the login error "<error>"
    And I should still be on the login page

    Examples:
      | case             | username      | password      | error                                                                     |
      | a wrong password | standard_user | not-the-pass  | Epic sadface: Username and password do not match any user in this service |
      | an unknown user  | nobody_here   | secret_sauce  | Epic sadface: Username and password do not match any user in this service |
      | a blank username |               | secret_sauce  | Epic sadface: Username is required                                        |
      | a blank password | standard_user |               | Epic sadface: Password is required                                        |

  @regression @security @web-login-04
  Scenario Outline: <page> cannot be opened without signing in
    When I open "<path>" without signing in
    Then I should see the login error "Epic sadface: You can only access '<path>' when you are logged in."

    Examples:
      | page          | path                    |
      | Products      | /inventory.html         |
      | Cart          | /cart.html              |
      | Checkout      | /checkout-step-one.html |

  # KNOWN DEFECT (knowledge-base/known-defects.md#KD-01) — performance_glitch_user takes ~5 s to
  # sign in. @fail makes Playwright expect the failure: the build stays green while the defect
  # exists, and turns RED the day it is fixed, so the tag cannot outlive the bug unnoticed.
  @regression @performance @known-defect @fail @web-login-05
  Scenario: Sign-in reaches the products page within the 2-second budget
    Given I am on the login page
    When I sign in as "performance_glitch_user"
    Then I should land on the products page within 2000 ms
