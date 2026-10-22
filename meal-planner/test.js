const assert = require("assert");
const recipes = require("./recipes.js");
const P = require("./planner.js");
const base = { likes: [], dislikes: [], diet: "any", maxTime: 60, budget: 0, servings: 2, days: 7 };
let n = 0; const t = (name, fn) => { fn(); n++; console.log("ok -", name); };

t("plan has requested days, no repeats", () => {
  const plan = P.generate(recipes, base);
  assert.strictEqual(plan.length, 7);
  assert.strictEqual(new Set(plan.map((r) => r.id)).size, 7);
});
t("respects max time", () => {
  assert.ok(P.generate(recipes, { ...base, maxTime: 20, days: 5 }).every((r) => r.time <= 20));
});
t("vegan diet and dislikes", () => {
  const plan = P.generate(recipes, { ...base, diet: "vegan", days: 4, dislikes: ["tofu"] });
  assert.ok(plan.every((r) => r.tags.includes("vegan") && !r.name.toLowerCase().includes("tofu")));
});
t("likes bias selection", () => {
  const plan = P.generate(recipes, { ...base, likes: ["pasta"], days: 4 }, () => 0);
  assert.ok(plan.filter((r) => r.tags.includes("pasta")).length >= 3);
});
t("budget is honoured when achievable", () => {
  const prefs = { ...base, budget: 60 };
  assert.ok(P.planCost(P.generate(recipes, prefs), prefs) <= 60);
});
t("regenerate swaps to a new meal within filters", () => {
  const prefs = { ...base, days: 5, maxTime: 30 };
  const plan = P.generate(recipes, prefs);
  const next = P.regenerate(recipes, prefs, plan, 2);
  assert.ok(!plan.some((r) => r.id === next.id) && next.time <= 30);
});
t("shopping list merges duplicates, rounds counts, orders aisles", () => {
  const a = recipes.find((r) => r.id === "spag-bol"), b = recipes.find((r) => r.id === "veg-curry");
  const list = P.shoppingList([a, b], 2);
  const flat = list.flatMap((g) => g.items);
  assert.strictEqual(flat.filter((i) => i.name === "onion").length, 1);
  assert.strictEqual(flat.find((i) => i.name === "onion").qty, 2);
  assert.strictEqual(list[0].aisle, "Produce");
});
t("impossible filters throw a helpful error", () => {
  assert.throws(() => P.generate(recipes, { ...base, maxTime: 5 }), /No recipes/);
});
console.log(n + " tests passed");
