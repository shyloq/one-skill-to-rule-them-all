const assert = require("assert");
const S = require("./store.js");
let n = 0; const t = (name, fn) => { fn(); n++; console.log("ok -", name); };
const fake = (init = {}) => { const d = { ...init }; return { d, getItem: (k) => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = v; } }; };
const v2 = { prefs: { likes: ["pasta"], calories: 2000, days: 7 }, ids: [["porridge", "apple-pb", "chicken-wrap", "popcorn", "spag-bol"]], checked: ["Produce|banana|pc"] };

t("fresh install gives defaults", () => {
  const s = S.create(fake()).load();
  assert.strictEqual(s.version, 3); assert.strictEqual(s.profile, null); assert.deepStrictEqual(s.overrides, {});
});
t("v2 data migrates to v3 and keeps the old key", () => {
  const b = fake({ "meal-planner-v2": JSON.stringify(v2) });
  const s = S.create(b).load();
  assert.deepStrictEqual(s.ids, v2.ids); assert.deepStrictEqual(s.prefs, v2.prefs); assert.deepStrictEqual(s.checked, v2.checked);
  assert.strictEqual(s.version, 3); assert.strictEqual(s.profile, null);
  assert.ok(b.d["meal-planner-v2"]); assert.ok(b.d["meal-planner-v3"]);
});
t("v3 wins over v2 and round-trips", () => {
  const b = fake({ "meal-planner-v2": JSON.stringify(v2) });
  const store = S.create(b); const s = store.load();
  store.save({ ...s, profile: { age: 30 } });
  assert.deepStrictEqual(S.create(b).load().profile, { age: 30 });
});
t("corrupt or old-shape data falls back to defaults", () => {
  assert.strictEqual(S.create(fake({ "meal-planner-v3": "{bad json" })).load().prefs, null);
  assert.strictEqual(S.migrate({ prefs: {}, ids: ["flat", "ids"] }).ids, null);
});
t("a throwing backend still works in memory", () => {
  const boom = { getItem() { throw new Error("no"); }, setItem() { throw new Error("no"); } };
  const store = S.create(boom); store.save({ ...S.defaults(), profile: { age: 40 } });
  assert.deepStrictEqual(store.load().profile, { age: 40 });
});
console.log(n + " storage tests passed");
