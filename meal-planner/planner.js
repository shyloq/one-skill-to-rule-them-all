// Planning logic. Pure functions; works in the browser (window.Planner) and Node.
(function (root) {
  const AISLE_ORDER = ["Produce", "Meat & Fish", "Dairy & Eggs", "Bakery", "Pantry", "Frozen"];
  const MEAT_TAGS = ["chicken", "beef", "pork", "fish", "salmon", "shrimp"];

  // prefs: {likes[], dislikes[], diet: "any"|"vegetarian"|"vegan", maxTime, budget, servings, days}
  function eligible(recipes, prefs) {
    const dislikes = (prefs.dislikes || []).map((d) => d.toLowerCase()).filter(Boolean);
    return recipes.filter((r) => {
      if (r.time > prefs.maxTime) return false;
      if (prefs.diet === "vegan" && !r.tags.includes("vegan")) return false;
      if (prefs.diet === "vegetarian" && !r.tags.includes("vegetarian") && !r.tags.includes("vegan")) return false;
      const hay = [r.name, ...r.tags, ...r.ing.map((i) => i[0])].join(" ").toLowerCase();
      return !dislikes.some((d) => hay.includes(d));
    });
  }

  function score(r, prefs, rng) {
    const likes = (prefs.likes || []).map((l) => l.toLowerCase()).filter(Boolean);
    const hay = [r.name, ...r.tags, ...r.ing.map((i) => i[0])].join(" ").toLowerCase();
    return likes.filter((l) => hay.includes(l)).length * 3 + rng();
  }

  const mealCost = (r, prefs) => r.cost * prefs.servings;
  const planCost = (plan, prefs) => plan.reduce((s, r) => s + mealCost(r, prefs), 0);

  // Returns an array of `days` recipes, or throws if nothing fits.
  function generate(recipes, prefs, rng = Math.random) {
    const pool = eligible(recipes, prefs);
    if (!pool.length) throw new Error("No recipes match those filters. Try a longer cook time or fewer dislikes.");
    const ranked = pool.map((r) => ({ r, s: score(r, prefs, rng) })).sort((a, b) => b.s - a.s).map((x) => x.r);
    // Avoid repeats and back-to-back same main protein where possible.
    const plan = [];
    const used = new Set();
    for (let d = 0; d < prefs.days; d++) {
      const prev = plan[plan.length - 1];
      const prot = (r) => r.tags.find((t) => MEAT_TAGS.includes(t));
      let pick = ranked.find((r) => !used.has(r.id) && !(prev && prot(r) && prot(r) === prot(prev)))
        || ranked.find((r) => !used.has(r.id))
        || ranked[d % ranked.length];
      used.add(pick.id);
      plan.push(pick);
    }
    return fitBudget(plan, ranked, prefs);
  }

  // Swap the priciest meals for cheaper unused ones until under budget (or no swaps help).
  function fitBudget(plan, ranked, prefs) {
    plan = plan.slice();
    if (!prefs.budget) return plan;
    for (let guard = 0; guard < 50 && planCost(plan, prefs) > prefs.budget; guard++) {
      const ids = new Set(plan.map((r) => r.id));
      let best = null;
      plan.forEach((r, i) => {
        ranked.forEach((c) => {
          if (ids.has(c.id) || c.cost >= r.cost) return;
          const saving = r.cost - c.cost;
          if (!best || saving > best.saving) best = { i, c, saving };
        });
      });
      if (!best) break;
      plan[best.i] = best.c;
    }
    return plan;
  }

  // Replace the meal at `index` with another eligible one not already in the plan.
  // Prefers candidates that keep the plan within budget, then the best-liked.
  function regenerate(recipes, prefs, plan, index, rng = Math.random) {
    const ids = new Set(plan.map((r) => r.id));
    const others = planCost(plan, prefs) - mealCost(plan[index], prefs);
    const cands = eligible(recipes, prefs).filter((r) => !ids.has(r.id));
    if (!cands.length) return plan[index];
    const ok = prefs.budget ? cands.filter((r) => others + mealCost(r, prefs) <= prefs.budget) : cands;
    const from = ok.length ? ok : cands.sort((a, b) => a.cost - b.cost).slice(0, 1);
    return from.map((r) => ({ r, s: score(r, prefs, rng) })).sort((a, b) => b.s - a.s)[0].r;
  }

  const round = (n) => Math.round(n * 100) / 100;

  // Combine ingredients across the plan, grouped by aisle in walking order.
  function shoppingList(plan, servings) {
    const map = new Map();
    plan.forEach((r) => r.ing.forEach(([name, qty, unit, aisle]) => {
      const key = name + "|" + unit;
      const e = map.get(key) || { name, unit, aisle, qty: 0 };
      e.qty += qty * servings;
      map.set(key, e);
    }));
    const byAisle = {};
    [...map.values()].forEach((e) => {
      if (e.unit === "pc" || e.unit === "slice" || e.unit === "clove") e.qty = Math.ceil(e.qty - 1e-9);
      else e.qty = round(e.qty);
      (byAisle[e.aisle] = byAisle[e.aisle] || []).push(e);
    });
    const aisles = Object.keys(byAisle).sort((a, b) => {
      const ia = AISLE_ORDER.indexOf(a), ib = AISLE_ORDER.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    return aisles.map((aisle) => ({ aisle, items: byAisle[aisle].sort((a, b) => a.name.localeCompare(b.name)) }));
  }

  const api = { eligible, generate, regenerate, shoppingList, planCost, mealCost };
  root.Planner = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
