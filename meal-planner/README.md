# Meal planner & shopping list

Tell it what you like, your allergies and dislikes, diet, daily calories, weekly
budget, cook-time limit and household size. It builds a week of days, each with
**3 meals and 2 snacks** in this order: breakfast, morning snack, lunch,
afternoon snack, dinner. One combined shopping list (meals and snacks) is sorted
by supermarket aisle. Swap any single item; the list and totals update.

- Open `index.html` in a browser (no build, no dependencies). State is kept in localStorage.
- `recipes.js` holds the recipe data: slots, nutrition per serving, steps, and ingredients (per serving).
- `planner.js` holds the pure planning logic.
- `nutrition.js` holds the fitness maths (BMR, maintenance, goal targets, macros, guardrails, unit conversion).
- `store.js` holds versioned storage and migrations (v2 plans are migrated to v3 and the old key is kept).
- Run every test with `node test.js` (it also runs `test-nutrition.js` and `test-store.js`).

Fitness profile: enter age, sex, height, weight, activity, training days/type and goal (metric or imperial).
Calories come from Mifflin-St Jeor times an activity multiplier, then a goal adjustment (fat loss -20%,
muscle gain +10%, maintenance and recomposition 0%). The app shows each step. Protein, carbs, fat and fibre
targets follow from goal and bodyweight and can be overridden. Guardrails: calories never go below 1,500
(male) or 1,200 (female), under-18s get maintenance only, and manual extremes show a warning.
General guidance, not medical advice.

How it plans:

- The daily calorie target is split 25% breakfast, 7.5% per snack, 30% lunch, 30% dinner.
- Snacks take 10 minutes or less; the cook-time limit applies to every item.
- Recipes avoid repeating within the week when the filtered pool is big enough.
- Every plan is validated (exactly 3 meals + 2 snacks per day) and generation retries, then errors.

Budget and nutrition are rough estimates from the data, not live prices or lab values.
