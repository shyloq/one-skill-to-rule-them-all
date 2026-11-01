// Planning logic. Pure functions; works in the browser (window.Planner) and Node.
// A plan is an array of days; each day is an array of 5 recipes in SLOTS order
// (3 meals + 2 snacks).
(function (root) {
  const AISLE_ORDER = ["Produce", "Meat & Fish", "Dairy & Eggs", "Bakery", "Pantry", "Frozen"];
  const MEAT_TAGS = ["chicken", "beef", "pork", "fish", "salmon", "shrimp", "turkey"];

  // `share` splits the daily calorie target; snacks are deliberately light.
  const SLOTS = [
    { key: "breakfast", label: "Breakfast", type: "meal", pool: "breakfast", share: 0.25 },
    { key: "snack1", label: "Morning snack", type: "snack", pool: "snack", share: 0.075 },
    { key: "lunch", label: "Lunch", type: "meal", pool: "lunch", share: 0.30 },
    { key: "snack2", label: "Afternoon snack", type: "snack", pool: "snack", share: 0.075 },
    { key: "dinner", label: "Dinner", type: "meal", pool: "dinner", share: 0.30 },
  ];
  const MAX_SNACK_MINUTES = 10;

  // Allergy words expand to the ingredient words that contain them. `safe` lists
  // look-alikes that are fine (e.g. peanut butter has no dairy).
  const ALLERGENS = {
    peanut: { terms: ["peanut"] },
    nut: { terms: ["peanut", "almond", "walnut", "cashew", "hazelnut", "pecan", "pistachio"] },
    dairy: { terms: ["milk", "cheese", "cheddar", "mozzarella", "ricotta", "parmesan", "feta", "yogurt", "cream", "butter"], safe: ["peanut butter", "coconut milk", "oat milk"] },
    egg: { terms: ["egg", "omelette", "mayonnaise", "pancake"] },
    gluten: { terms: ["bread", "toast", "spaghetti", "penne", "linguine", "lasagne", "gnocchi", "ciabatta", "bun", "tortilla", "pita", "cracker", "granola", "oats", "flour", "muffin", "crouton", "soy sauce", "pancake"] },
    shellfish: { terms: ["shrimp"] },
    fish: { terms: ["salmon", "fish", "tuna"] },
    soy: { terms: ["soy", "tofu", "edamame"] },
  };
  const ALIASES = { nuts: "nut", peanuts: "peanut", eggs: "egg", wheat: "gluten", milk: "dairy", lactose: "dairy", shrimp: "shellfish", seafood: "shellfish" };

  function blockedTerms(prefs) {
    const out = [];
    (prefs.allergies || []).map((a) => a.toLowerCase().trim()).filter(Boolean).forEach((a) => {
      const key = ALIASES[a] || a;
      out.push(ALLERGENS[key] ? ALLERGENS[key] : { terms: [a] });
    });
    return out;
  }

  const hayOf = (r) => [r.name, ...r.tags, ...r.ing.map((i) => i[0])].join(" ").toLowerCase();

  function hitsAllergy(r, blocked) {
    return blocked.some((b) => r.ing.some(([name]) => {
      const n = name.toLowerCase();
      if ((b.safe || []).some((s) => n.includes(s))) return false;
      return b.terms.some((t) => n.includes(t));
    }) || b.terms.some((t) => r.name.toLowerCase().includes(t) && !(b.safe || []).some((s) => r.name.toLowerCase().includes(s))));
  }

  // prefs: {likes[], dislikes[], allergies[], diet, maxTime, budget, servings, days, calories}
  function eligible(recipes, prefs, pool) {
    const dislikes = (prefs.dislikes || []).map((d) => d.toLowerCase()).filter(Boolean);
    const blocked = blockedTerms(prefs);
    const limit = pool === "snack" ? Math.min(MAX_SNACK_MINUTES, prefs.maxTime) : prefs.maxTime;
    return recipes.filter((r) => {
      if (!r.slots.includes(pool) || r.time > limit) return false;
      if (prefs.diet === "vegan" && !r.tags.includes("vegan")) return false;
      if (prefs.diet === "vegetarian" && !r.tags.includes("vegetarian") && !r.tags.includes("vegan")) return false;
      if (hitsAllergy(r, blocked)) return false;
      const hay = hayOf(r);
      return !dislikes.some((d) => hay.includes(d));
    });
  }

  const slotTarget = (slot, prefs) => slot.share * (prefs.calories || 2000);

  // Liked foods raise the score; being far from the slot's calorie share lowers it.
  function score(r, prefs, slot, rng) {
    const likes = (prefs.likes || []).map((l) => l.toLowerCase()).filter(Boolean);
    const hay = hayOf(r);
    const target = slotTarget(slot, prefs);
    return likes.filter((l) => hay.includes(l)).length * 3 + rng() - (Math.abs(r.n[0] - target) / target) * 4;
  }

  const mealCost = (r, prefs) => r.cost * prefs.servings;
  const planCost = (plan, prefs) => plan.reduce((s, day) => s + day.reduce((t, r) => t + mealCost(r, prefs), 0), 0);

  // Per-person nutrition for a day (or any list of recipes).
  function totals(items) {
    return items.reduce((t, r) => ({ kcal: t.kcal + r.n[0], protein: t.protein + r.n[1], carbs: t.carbs + r.n[2], fat: t.fat + r.n[3] }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 });
  }

  // Throws unless the plan has `days` days of exactly 3 meals + 2 snacks in order.
  function validatePlan(plan, days) {
    if (!Array.isArray(plan) || plan.length !== days) throw new Error(`Plan should have ${days} days.`);
    plan.forEach((day, d) => {
      if (!Array.isArray(day) || day.length !== SLOTS.length) throw new Error(`Day ${d + 1} should have 5 items.`);
      let meals = 0, snacks = 0;
      day.forEach((r, i) => {
        if (!r || !r.slots || !r.slots.includes(SLOTS[i].pool)) throw new Error(`Day ${d + 1}: item ${i + 1} is not valid for ${SLOTS[i].label}.`);
        if (SLOTS[i].type === "snack") { snacks++; if (r.time > MAX_SNACK_MINUTES) throw new Error(`Day ${d + 1}: ${SLOTS[i].label} takes too long.`); } else meals++;
      });
      if (meals !== 3 || snacks !== 2) throw new Error(`Day ${d + 1} must have exactly 3 meals and 2 snacks.`);
    });
    return plan;
  }

  const proteinOf = (r) => r.tags.find((t) => MEAT_TAGS.includes(t));

  function poolsFor(recipes, prefs) {
    const pools = {};
    ["breakfast", "lunch", "dinner", "snack"].forEach((p) => { pools[p] = eligible(recipes, prefs, p); });
    const empty = SLOTS.find((s) => !pools[s.pool].length);
    if (empty) throw new Error(`No ${empty.label.toLowerCase()} options match your settings. Try a longer cook time or fewer dislikes.`);
    return pools;
  }

  function build(pools, prefs, rng) {
    const plan = Array.from({ length: prefs.days }, () => new Array(SLOTS.length));
    const counts = new Map();
    // Fill the most constrained slots first so repeats are avoided where they matter.
    const order = [4, 2, 0, 1, 3];
    order.forEach((si) => {
      const slot = SLOTS[si];
      const ranked = pools[slot.pool].map((r) => ({ r, s: score(r, prefs, slot, rng) })).sort((a, b) => b.s - a.s).map((x) => x.r);
      for (let d = 0; d < prefs.days; d++) {
        // Prefer least-used recipes, then no repeat of the previous day's / same day's main protein.
        const avoid = [plan[d - 1] && plan[d - 1][si], si === 2 && plan[d][4]].filter(Boolean).map(proteinOf).filter(Boolean);
        let best = null, bestKey = null;
        ranked.forEach((r, rank) => {
          const key = [counts.get(r.id) || 0, avoid.includes(proteinOf(r)) ? 1 : 0, rank];
          if (!bestKey || key[0] < bestKey[0] || (key[0] === bestKey[0] && (key[1] < bestKey[1] || (key[1] === bestKey[1] && key[2] < bestKey[2])))) { best = r; bestKey = key; }
        });
        plan[d][si] = best;
        counts.set(best.id, (counts.get(best.id) || 0) + 1);
      }
    });
    return plan;
  }

  // Swap the priciest items for cheaper ones in the same slot until under budget.
  function fitBudget(plan, pools, prefs) {
    if (!prefs.budget) return plan;
    plan = plan.map((d) => d.slice());
    for (let guard = 0; guard < 200 && planCost(plan, prefs) > prefs.budget; guard++) {
      const ids = new Set(plan.flat().map((r) => r.id));
      let best = null;
      plan.forEach((day, d) => day.forEach((r, si) => {
        pools[SLOTS[si].pool].forEach((c) => {
          if (ids.has(c.id) || c.cost >= r.cost) return;
          const saving = r.cost - c.cost;
          if (!best || saving > best.saving) best = { d, si, c, saving };
        });
      }));
      if (!best) break;
      plan[best.d][best.si] = best.c;
    }
    return plan;
  }

  // Returns `days` days of 3 meals + 2 snacks. Retries if validation fails, then throws.
  function generate(recipes, prefs, rng = Math.random) {
    const pools = poolsFor(recipes, prefs);
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
      try { return validatePlan(fitBudget(build(pools, prefs, rng), pools, prefs), prefs.days); }
      catch (e) { lastErr = e; }
    }
    throw new Error("Could not build a valid plan: " + lastErr.message);
  }

  // Replace the item at plan[d][si] with another eligible one for that slot. Prefers recipes
  // not already in the week, then ones that keep the plan within budget, then best-liked.
  function regenerate(recipes, prefs, plan, d, si, rng = Math.random) {
    const slot = SLOTS[si], current = plan[d][si];
    const pool = eligible(recipes, prefs, slot.pool).filter((r) => r.id !== current.id);
    if (!pool.length) return current;
    const inWeek = new Set(plan.flat().map((r) => r.id));
    const fresh = pool.filter((r) => !inWeek.has(r.id));
    const others = planCost(plan, prefs) - mealCost(current, prefs);
    let cands = fresh.length ? fresh : pool;
    if (prefs.budget) {
      const ok = cands.filter((r) => others + mealCost(r, prefs) <= prefs.budget);
      cands = ok.length ? ok : cands.slice().sort((a, b) => a.cost - b.cost).slice(0, 1);
    }
    return cands.map((r) => ({ r, s: score(r, prefs, slot, rng) })).sort((a, b) => b.s - a.s)[0].r;
  }

  const round = (n) => Math.round(n * 100) / 100;

  // Combine ingredients across every meal and snack, grouped by aisle in walking order.
  function shoppingList(plan, servings) {
    const map = new Map();
    plan.flat().forEach((r) => r.ing.forEach(([name, qty, unit, aisle]) => {
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

  const api = { SLOTS, eligible, generate, regenerate, shoppingList, planCost, mealCost, totals, validatePlan, slotTarget };
  root.Planner = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
