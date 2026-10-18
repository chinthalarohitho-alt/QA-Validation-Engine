// Load test for the recommendation endpoint — the one write-shaped, compute-heavy call.
//
// Beyond status codes, every response is checked against the constraints the request asked for:
// under load a service can stay fast by quietly returning wrong answers, and a load test that
// checks only `200` would call that a pass.

import http from 'k6/http';
import { check, sleep } from 'k6';
import { stagesFor, thresholdsFor } from '../../../../shared/k6/k6.config.ts';
import { authHeaders, currentProfile, loadApiUrl } from '../../../../shared/k6/runtime.ts';

const RECOMMEND = 'POST /api/pizza';

export const options = {
  stages: stagesFor(currentProfile()),
  thresholds: thresholdsFor({ [RECOMMEND]: 1500 }),
};

interface Ingredient { name: string; vegetarian: boolean; caloriesPerSlice: number }

export default function () {
  const vegetarian = __ITER % 2 === 0;
  const maxCalories = 600 + 100 * (__VU % 3);
  const request = {
    maxCaloriesPerSlice: maxCalories,
    mustBeVegetarian: vegetarian,
    excludedIngredients: ['Pepperoni'],
    excludedTools: [],
    maxNumberOfToppings: 5,
    minNumberOfToppings: 2,
  };

  const response = http.post(`${loadApiUrl()}/api/pizza`, JSON.stringify(request), {
    headers: authHeaders(),
    tags: { name: RECOMMEND },
  });

  const pizza = response.status === 200 ? (response.json('pizza') as { ingredients: Ingredient[] } | null) : null;
  const ingredients = pizza?.ingredients ?? [];

  check(response, {
    'status is 200': (r) => r.status === 200,
    // The cap applies to ingredients only — dough calories are not counted. Observed behaviour,
    // recorded in knowledge-base/known-defects.md#Q-01 rather than asserted as a defect.
    'ingredient calories stay within the cap': () =>
      ingredients.length > 0 && ingredients.reduce((sum, i) => sum + i.caloriesPerSlice, 0) <= maxCalories,
    'honours mustBeVegetarian': () => !vegetarian || ingredients.every((i) => i.vegetarian),
    'leaves out excluded ingredients': () => ingredients.every((i) => i.name !== 'Pepperoni'),
  });

  sleep(1);
}
