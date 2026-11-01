const assert = require("assert");
const N = require("./nutrition.js");
let n = 0; const t = (name, fn) => { fn(); n++; console.log("ok -", name); };
const man = { age: 30, sex: "male", heightCm: 178, weightKg: 80, activity: "moderate", trainingDays: 4, trainingType: "mixed", goal: "fat_loss" };
const woman = { age: 30, sex: "female", heightCm: 165, weightKg: 60, activity: "moderate", trainingDays: 3, trainingType: "strength", goal: "maintenance" };

t("Mifflin-St Jeor known values", () => {
  assert.strictEqual(N.bmr(man), 1767.5);
  assert.strictEqual(N.bmr(woman), 1320.25);
});
t("maintenance = BMR x activity multiplier", () => {
  const r = N.calcTargets({ ...man, goal: "maintenance" });
  assert.strictEqual(r.tdee, Math.round(1767.5 * 1.55));
  assert.strictEqual(r.target, Math.round((1767.5 * 1.55) / 10) * 10);
});
t("goal adjusts calories in the right direction", () => {
  const base = N.calcTargets({ ...man, goal: "maintenance" }).target;
  assert.ok(N.calcTargets({ ...man, goal: "fat_loss" }).target < base * 0.85);
  assert.ok(N.calcTargets({ ...man, goal: "muscle_gain" }).target > base);
  assert.strictEqual(N.calcTargets({ ...man, goal: "recomposition" }).target, base);
});
t("calorie floor applies", () => {
  const small = { age: 50, sex: "female", heightCm: 150, weightKg: 45, activity: "sedentary", trainingDays: 0, trainingType: "cardio", goal: "fat_loss" };
  const r = N.calcTargets(small);
  assert.strictEqual(r.target, 1200); assert.ok(r.floored);
  assert.strictEqual(N.calcTargets({ ...small, sex: "male" }).target, 1500);
});
t("under 18 gets maintenance only", () => {
  const r = N.calcTargets({ ...man, age: 16 });
  assert.ok(Math.abs(r.adjust) <= 5 && r.minorLimited);
});
t("weekly rate is capped", () => {
  const loss = N.calcTargets(man, { goalPct: -0.5 });
  assert.ok(loss.capped && loss.weeklyChangePct >= -1.01);
  const gain = N.calcTargets(man, { goalPct: 0.5 });
  assert.ok(gain.capped && gain.weeklyChangePct <= 0.51);
});
t("default goals are within moderate rates", () => {
  ["fat_loss", "maintenance", "muscle_gain", "recomposition"].forEach((goal) => {
    const r = N.calcTargets({ ...man, goal }); assert.ok(!r.capped); assert.ok(Math.abs(r.weeklyChangePct) <= 1);
  });
});
t("macros: protein by goal, fat minimum, carbs fill the rest, fibre in range", () => {
  const r = N.calcTargets(man), m = r.macros;
  assert.strictEqual(m.protein, 160);
  assert.ok(m.fat >= 0.6 * 80);
  const kcal = 4 * m.protein + 4 * m.carbs + 9 * m.fat;
  assert.ok(Math.abs(kcal - r.target) / r.target < 0.03, `${kcal} vs ${r.target}`);
  assert.ok(m.fibre >= 20 && m.fibre <= 40);
});
t("protein is capped for heavy people on low calories", () => {
  const m = N.macrosFor({ ...man, weightKg: 150, goal: "fat_loss" }, 2000);
  assert.ok(m.protein <= 0.35 * 2000 / 4 + 1);
  assert.ok(m.carbs >= 0);
});
t("manual calories are clamped to the floor", () => {
  const calc = N.calcTargets(man);
  const out = N.checkTargets(man, calc, { kcal: 900 });
  assert.strictEqual(out.targets.kcal, 1500);
  assert.ok(out.warnings.some((w) => w.level === "limit"));
});
t("extreme manual values give gentle warnings, not errors", () => {
  const calc = N.calcTargets(man);
  const w = N.checkTargets(man, calc, { kcal: 1600, protein: 300, fat: 20, carbs: 30 }).warnings.map((x) => x.text).join(" | ");
  assert.match(w, /faster than the 1%/); assert.match(w, /Protein is over/); assert.match(w, /Fat is under/); assert.match(w, /Carbs are under/);
});
t("no warnings for the calculated defaults", () => {
  const calc = N.calcTargets(man);
  assert.deepStrictEqual(N.checkTargets(man, calc, {}).warnings, []);
});
t("changing calories rescales macros unless overridden", () => {
  const calc = N.calcTargets({ ...man, goal: "maintenance" });
  const a = N.checkTargets({ ...man, goal: "maintenance" }, calc, { kcal: calc.target + 300 }).targets;
  assert.ok(a.carbs > calc.macros.carbs);
  assert.strictEqual(N.checkTargets(man, calc, { protein: 170 }).targets.protein, 170);
});
t("validateProfile catches bad input", () => {
  assert.deepStrictEqual(N.validateProfile(man), []);
  assert.ok(N.validateProfile({ ...man, age: 10, weightKg: 20, sex: "x" }).length >= 3);
});
t("unit conversions round-trip", () => {
  assert.ok(Math.abs(N.lbToKg(N.kgToLb(80)) - 80) < 1e-9);
  assert.deepStrictEqual(N.cmToFtIn(178), { ft: 5, inch: 10 });
  assert.ok(Math.abs(N.ftInToCm(5, 10) - 177.8) < 0.01);
  assert.deepStrictEqual(N.cmToFtIn(182.8), { ft: 6, inch: 0 });
});
t("explain shows the working", () => {
  const text = N.explain(man, N.calcTargets(man)).join("\n");
  assert.match(text, /Mifflin-St Jeor/); assert.match(text, /1,768/); assert.match(text, /× 1.55/);
});
console.log(n + " nutrition tests passed");
