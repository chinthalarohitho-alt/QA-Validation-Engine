@inventory
Feature: Products - Sorting and per-persona defects

  @regression @web-inv-02
  Scenario Outline: Products can be sorted by <order>
    Given I am on the products page
    When I sort the products by "<order>"
    Then the products should be in "<order>" order

    Examples:
      | order            |
      | name ascending   |
      | name descending  |
      | price ascending  |
      | price descending |

  @regression @web-inv-03
  Scenario: Every product has its own image
    Given I am on the products page
    Then every product should show a different image

  # KNOWN DEFECTS (knowledge-base/known-defects.md#KD-02, #KD-03) — the same checks, run as
  # problem_user, a persona with seeded UI bugs. Persona is chosen by tag; see roles.config.ts.
  @regression @as-problem-user @known-defect @fail @web-inv-04
  Scenario: Sorting works for problem_user
    Given I am on the products page
    When I sort the products by "price ascending"
    Then the products should be in "price ascending" order

  @regression @as-problem-user @known-defect @fail @web-inv-05
  Scenario: Every product has its own image for problem_user
    Given I am on the products page
    Then every product should show a different image
