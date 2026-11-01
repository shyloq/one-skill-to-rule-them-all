const assert = require("assert");
const recipes = require("./recipes.js");
const P = require("./planner.js");
const base = { likes: [], dislikes: [], allergies: [], diet: "any", maxTime: 60, budget: 0, servings: 2, days: 7, calories: 2000 };
let n = 0; const t = (name, fn) => { fn(); n++; console.log("ok -", name); };
const rng = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();

t("every day has exactly 3 meals and 2 snacks in order", () => {
  const plan = P.generate(recipes, base, rng);
  assert.strictEqual(plan.length, 7);
  plan.forEach((day) => {
    assert.strictEqual(day.length, 5);
    assert.deepStrictEqual(P.SLOTS.map((s) => s.type), ["meal", "snack", "meal", "snack", "meal"]);
    day.forEach((r, i) => assert.ok(r.slots.includes(P.SLOTS[i].pool)));
    day.forEach((r, i) => { if (P.SLOTS[i].type === "snack") assert.ok(r.time <= 10); });
  });
});
t("validatePlan rejects wrong shapes", () => {
  const plan = P.generate(recipes, base, rng);
  assert.throws(() => P.validatePlan(plan.slice(1), 7), /7 days/);
  assert.throws(() => P.validatePlan(plan.map((d) => d.slice(0, 4)), 7), /5 items/);
  const bad = plan.map((d) => d.slice()); bad[0][1] = bad[0][0];
  assert.throws(() => P.validatePlan(bad, 7), /not valid/);
});
t("no repeats within the week when the pool allows", () => {
  const ids = P.generate(recipes, base, rng).flat().map((r) => r.id);
  assert.strictEqual(new Set(ids).size, ids.length);
});
t("snacks are clearly lighter than meals", () => {
  const plan = P.generate(recipes, base, rng);
  const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const snack = avg(plan.flatMap((d) => [d[1].n[0], d[3].n[0]]));
  const meal = avg(plan.flatMap((d) => [d[0].n[0], d[2].n[0], d[4].n[0]]));
  assert.ok(snack < meal / 2, `${snack} vs ${meal}`);
});
t("daily calories land near the target", () => {
  const plan = P.generate(recipes, base, rng);
  plan.forEach((d) => { const k = P.totals(d).kcal; assert.ok(k > 1500 && k < 2500, k); });
});
t("max cook time applies to meals; snacks stay <= 10 min", () => {
  const plan = P.generate(recipes, { ...base, maxTime: 20 }, rng);
  assert.ok(plan.flat().every((r) => r.time <= 20));
});
t("vegan diet, dislikes and allergies are respected", () => {
  const prefs = { ...base, diet: "vegan", dislikes: ["tofu"], allergies: ["peanuts"] };
  const plan = P.generate(recipes, prefs, rng).flat();
  assert.ok(plan.every((r) => r.tags.includes("vegan")));
  assert.ok(plan.every((r) => !r.ing.some(([nm]) => /tofu|peanut/.test(nm))));
});
t("dairy allergy keeps peanut butter and oat milk", () => {
  const ok = P.eligible(recipes, { ...base, allergies: ["dairy"] }, "breakfast").map((r) => r.id);
  assert.ok(ok.includes("porridge"));
  assert.ok(!ok.includes("eggs-toast") && !ok.includes("yogurt-granola"));
});
t("likes bias selection", () => {
  const plan = P.generate(recipes, { ...base, likes: ["pasta"] }, () => 0.5);
  assert.ok(plan.map((d) => d[2]).filter((r) => r.tags.includes("pasta")).length >= 1);
});
t("budget is honoured when achievable", () => {
  const prefs = { ...base, budget: 120 };
  assert.ok(P.planCost(P.generate(recipes, prefs, rng), prefs) <= 120);
});
t("regenerate swaps one slot to a valid, different recipe", () => {
  const plan = P.generate(recipes, { ...base, days: 3 }, rng);
  [1, 2].forEach((si) => {
    const next = P.regenerate(recipes, { ...base, days: 3 }, plan, 1, si, rng);
    assert.notStrictEqual(next.id, plan[1][si].id);
    assert.ok(next.slots.includes(P.SLOTS[si].pool));
  });
});
t("shopping list includes snack ingredients, merged and ordered by aisle", () => {
  const plan = P.generate(recipes, base, rng);
  const flat = P.shoppingList(plan, 2).flatMap((g) => g.items.map((i) => i.name));
  plan.forEach((d) => [d[1], d[3]].forEach((s) => s.ing.forEach(([nm]) => assert.ok(flat.includes(nm), nm))));
  const keys = P.shoppingList(plan, 2).flatMap((g) => g.items.map((i) => i.name + "|" + i.unit));
  assert.strictEqual(new Set(keys).size, keys.length);
  assert.strictEqual(P.shoppingList(plan, 2)[0].aisle, "Produce");
});
t("every recipe has 5 nutrition values incl. fibre", () => {
  assert.ok(recipes.every((r) => r.n.length === 5 && r.n.every((x) => typeof x === "number" && x >= 0)));
});
t("impossible filters throw a helpful error", () => {
  assert.throws(() => P.generate(recipes, { ...base, maxTime: 5 }), /No .* options/);
});
console.log(n + " tests passed");

require("./test-nutrition.js");
require("./test-store.js");
