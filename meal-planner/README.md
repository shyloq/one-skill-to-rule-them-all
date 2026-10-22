# Meal planner & shopping list

Tell it what you like, what to avoid, your weekly budget, cook-time limit and
household size. It builds a dinner plan and a combined shopping list sorted by
supermarket aisle. Swap any meal you don't fancy; the list updates.

- Open `index.html` in a browser (no build, no dependencies). State is kept in localStorage.
- `recipes.js` holds the recipe data (add your own; quantities are per serving).
- `planner.js` holds the pure planning logic. Run the tests with `node test.js`.

Budget is a rough estimate from per-serving costs in the data, not live prices.
