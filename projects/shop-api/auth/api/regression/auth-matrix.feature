@auth-api @security
Feature: Auth API - Credentials and route guard matrix

  @regression @api-auth-03
  Scenario Outline: Sign-in is refused for <case>
    When I sign in to the API as "<username>" with password "<password>"
    Then the response status should be 400
    And the response should match the "error" schema
    And the response field "message" should be "<message>"

    Examples:
      | case             | username | password   | message                        |
      | a wrong password | emilys   | wrong-pass | Invalid credentials            |
      | an unknown user  | no-one   | emilyspass | Invalid credentials            |
      | a missing password | emilys |            | Username and password required |

  # Every protected route x every way of NOT being authenticated. Each header shape is a
  # different code path on the server, so each is pinned separately.
  @regression @api-auth-04
  Scenario Outline: <route> rejects a request with <header>
    When I send a GET request to "<route>" with the "<header>" header
    Then the response status should be 401

    Examples:
      | route                  | header          |
      | /auth/me               | no-token        |
      | /auth/me               | blank-token     |
      | /auth/me               | malformed-token |
      | /auth/products?limit=1 | no-token        |
      | /auth/products?limit=1 | blank-token     |
      | /auth/products?limit=1 | malformed-token |
      | /auth/carts?limit=1    | no-token        |
      | /auth/carts?limit=1    | blank-token     |
      | /auth/carts?limit=1    | malformed-token |

  # KNOWN DEFECT (knowledge-base/known-defects.md#KD-04) — a real token with an altered signature
  # answers 500 "invalid signature" instead of 401. @fail keeps the build green while it is
  # broken and turns it red the day it is fixed, so this tag cannot outlive the bug.
  @regression @known-defect @fail @api-auth-05
  Scenario Outline: <route> rejects a tampered token with 401, not a server error
    When I send a GET request to "<route>" with the "tampered-token" header
    Then the response status should be 401

    Examples:
      | route                  |
      | /auth/me               |
      | /auth/products?limit=1 |
