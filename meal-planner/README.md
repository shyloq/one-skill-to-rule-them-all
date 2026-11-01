# Meal planner & shopping list

Tell it what you like, your allergies and dislikes, diet, daily calories, weekly
budget, cook-time limit and household size. It builds a week of days, each with
**3 meals and 2 snacks** in this order: breakfast, morning snack, lunch,
afternoon snack, dinner. One combined shopping list (meals and snacks) is sorted
by supermarket aisle. Swap any single item; the list and totals update.

- Open `index.html` in a browser (no build, no dependencies). State is kept in localStorage.
- `recipes.js` holds the recipe data: slots, nutrition per serving, steps, and ingredients (per serving).
- `planner.js` holds the pure planning logic. Run the tests with `node test.js`.

How it plans:

- The daily calorie target is split 25% breakfast, 7.5% per snack, 30% lunch, 30% dinner.
- Snacks take 10 minutes or less; the cook-time limit applies to every item.
- Recipes avoid repeating within the week when the filtered pool is big enough.
- Every plan is validated (exactly 3 meals + 2 snacks per day) and generation retries, then errors.

Budget and nutrition are rough estimates from the data, not live prices or lab values.
