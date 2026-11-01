// Nutrition maths. Pure functions; works in the browser (window.Nutrition) and Node.
// All inputs are metric: heightCm, weightKg. Use the unit helpers to convert for display.
(function (root) {
  const ACTIVITY = {
    sedentary: { mult: 1.2, label: "sedentary" },
    light: { mult: 1.375, label: "lightly active" },
    moderate: { mult: 1.55, label: "moderately active" },
    active: { mult: 1.725, label: "very active" },
    very_active: { mult: 1.9, label: "extremely active" },
  };
  // pct = share of maintenance calories added (+) or removed (-); protein in g per kg bodyweight.
  const GOALS = {
    fat_loss: { pct: -0.2, protein: 2.0, label: "fat loss" },
    maintenance: { pct: 0, protein: 1.6, label: "maintenance" },
    muscle_gain: { pct: 0.1, protein: 1.8, label: "muscle gain" },
    recomposition: { pct: 0, protein: 2.0, label: "recomposition" },
  };
  const FLOOR = { male: 1500, female: 1200 };
  const KCAL_PER_KG = 7700;
  const MAX_LOSS_PCT = 0.01;  // of bodyweight per week
  const MAX_GAIN_PCT = 0.005;
  const MIN_PROTEIN_G_PER_KG = 1.2, HIGH_PROTEIN_G_PER_KG = 2.5, MIN_FAT_G_PER_KG = 0.5;

  const round = (n, step = 1) => Math.round(n / step) * step;
  const fmt = (n) => Math.round(n).toLocaleString("en-US");

  // Unit helpers
  const kgToLb = (kg) => kg * 2.20462262;
  const lbToKg = (lb) => lb / 2.20462262;
  const cmToFtIn = (cm) => {
    const total = cm / 2.54; let ft = Math.floor(total / 12); let inch = Math.round(total - ft * 12);
    if (inch === 12) { ft += 1; inch = 0; }
    return { ft, inch };
  };
  const ftInToCm = (ft, inch) => (ft * 12 + inch) * 2.54;

  function validateProfile(p) {
    const errs = [];
    const num = (v, lo, hi, name) => { if (!(v >= lo && v <= hi)) errs.push(`${name} should be between ${lo} and ${hi}.`); };
    num(p.age, 14, 100, "Age");
    num(p.heightCm, 120, 230, "Height (cm)");
    num(p.weightKg, 35, 250, "Weight (kg)");
    num(p.trainingDays, 0, 7, "Training days");
    if (!FLOOR[p.sex]) errs.push("Choose a sex for the formula.");
    if (!ACTIVITY[p.activity]) errs.push("Choose an activity level.");
    if (!GOALS[p.goal]) errs.push("Choose a goal.");
    if (!["strength", "cardio", "mixed"].includes(p.trainingType)) errs.push("Choose a training type.");
    return errs;
  }

  const isMinor = (p) => p.age < 18;
  const floorFor = (p) => FLOOR[p.sex] || FLOOR.male;
  const maxLossKg = (p) => Math.min(MAX_LOSS_PCT * p.weightKg, 1);
  const maxGainKg = (p) => MAX_GAIN_PCT * p.weightKg;
  const bmr = (p) => 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === "male" ? 5 : -161);

  // Protein by goal (capped at 2.2 g/kg and 35% of calories), fat at least 0.6 g/kg and 25% of calories,
  // carbs fill the rest (never under about 50 g where possible), fibre 14 g per 1000 kcal within 20-40 g.
  function macrosFor(p, kcal) {
    const w = p.weightKg;
    const protein = Math.min(GOALS[p.goal].protein * w, 2.2 * w, (0.35 * kcal) / 4);
    let fat = Math.max(0.6 * w, (0.25 * kcal) / 9);
    if (kcal - 4 * protein - 9 * fat < 200) fat = Math.max(0.6 * w, (kcal - 4 * protein - 200) / 9);
    const carbs = Math.max(0, (kcal - 4 * protein - 9 * fat) / 4);
    const fibre = Math.min(40, Math.max(20, round((14 * kcal) / 1000)));
    return { protein: round(protein), carbs: round(carbs), fat: round(fat), fibre };
  }

  // opts.goalPct overrides the goal's default adjustment (used by weekly adaptation).
  function calcTargets(p, opts = {}) {
    const goal = GOALS[p.goal], act = ACTIVITY[p.activity], notes = [];
    const b = bmr(p), tdee = b * act.mult;
    const goalPct = opts.goalPct !== undefined ? opts.goalPct : goal.pct;
    let adjust = tdee * goalPct, capped = false, floored = false, minorLimited = false;
    if (isMinor(p) && adjust !== 0) { adjust = 0; minorLimited = true; notes.push("Under 18: we set your target to maintenance with no deficit or surplus. Please talk to a doctor or dietitian before changing your weight."); }
    if ((adjust * 7) / KCAL_PER_KG < -maxLossKg(p)) { adjust = (-maxLossKg(p) * KCAL_PER_KG) / 7; capped = true; notes.push("Capped to a moderate loss rate (up to 1% of bodyweight per week)."); }
    if ((adjust * 7) / KCAL_PER_KG > maxGainKg(p)) { adjust = (maxGainKg(p) * KCAL_PER_KG) / 7; capped = true; notes.push("Capped to a moderate gain rate (up to 0.5% of bodyweight per week)."); }
    let target = tdee + adjust;
    const floor = floorFor(p);
    if (target < floor) { target = floor; floored = true; notes.push(`Raised to the ${fmt(floor)} kcal minimum we allow.`); }
    target = round(target, 10);
    const weeklyChangeKg = ((target - tdee) * 7) / KCAL_PER_KG;
    return { bmr: round(b), multiplier: act.mult, activityLabel: act.label, tdee: round(tdee), goalPct, adjust: target - round(tdee),
      target, floor, capped, floored, minorLimited, weeklyChangeKg: Math.round(weeklyChangeKg * 100) / 100,
      weeklyChangePct: Math.round((weeklyChangeKg / p.weightKg) * 1000) / 10, macros: macrosFor(p, target), notes };
  }

  // Plain-language steps showing how the target was worked out.
  function explain(p, r) {
    const sign = (n) => (n > 0 ? "+" : n < 0 ? "−" : "±") + fmt(Math.abs(n));
    const m = r.macros, w = p.weightKg;
    const lines = [
      `Basal metabolic rate (Mifflin-St Jeor): 10 × ${w} kg + 6.25 × ${p.heightCm} cm − 5 × ${p.age} ${p.sex === "male" ? "+ 5" : "− 161"} = ${fmt(r.bmr)} kcal.`,
      `Maintenance: ${fmt(r.bmr)} × ${r.multiplier} (${r.activityLabel}) = ${fmt(r.tdee)} kcal a day.`,
      `Goal (${GOALS[p.goal].label}): ${sign(r.adjust)} kcal gives a target of ${fmt(r.target)} kcal, about ${r.weeklyChangeKg >= 0 ? "+" : "−"}${Math.abs(r.weeklyChangeKg)} kg per week (${Math.abs(r.weeklyChangePct)}% of bodyweight).`,
      ...r.notes,
      `Protein: ${GOALS[p.goal].protein} g per kg × ${w} kg, limited to 2.2 g/kg and 35% of calories, gives ${m.protein} g.`,
      `Fat: at least 0.6 g per kg and 25% of calories gives ${m.fat} g.`,
      `Carbs: the remaining calories give ${m.carbs} g.`,
      `Fibre: about 14 g per 1,000 kcal gives ${m.fibre} g.`,
    ];
    return lines;
  }

  // Validates manual overrides. Calories never go below the floor; everything else only warns.
  function checkTargets(p, calc, input = {}) {
    const warnings = [], w = p.weightKg;
    let kcal = input.kcal !== undefined ? input.kcal : calc.target;
    const floor = floorFor(p);
    if (!(kcal >= floor)) { kcal = floor; warnings.push({ level: "limit", text: `Calories can't go below ${fmt(floor)} kcal, so we set it to that.` }); }
    const auto = macrosFor(p, kcal);
    const t = { kcal, protein: input.protein !== undefined ? input.protein : auto.protein, carbs: input.carbs !== undefined ? input.carbs : auto.carbs,
      fat: input.fat !== undefined ? input.fat : auto.fat, fibre: input.fibre !== undefined ? input.fibre : auto.fibre };
    const warn = (text) => warnings.push({ level: "warn", text });
    const weekly = ((kcal - calc.tdee) * 7) / KCAL_PER_KG;
    if (weekly < -maxLossKg(p)) warn(`This would lose about ${Math.abs(Math.round(weekly * 100) / 100)} kg a week, faster than the 1% of bodyweight we recommend. A slower pace is easier to keep and protects muscle.`);
    if (weekly > maxGainKg(p)) warn(`This would gain about ${Math.round(weekly * 100) / 100} kg a week, faster than the 0.5% of bodyweight we recommend. Faster gains are mostly fat.`);
    if (isMinor(p) && kcal < calc.tdee - 50) warn("You're under 18, so we suggest eating at maintenance. Please talk to a doctor or dietitian first.");
    if (t.protein < MIN_PROTEIN_G_PER_KG * w) warn(`Protein is under ${MIN_PROTEIN_G_PER_KG} g per kg. That may make it hard to keep muscle.`);
    if (t.protein > HIGH_PROTEIN_G_PER_KG * w) warn(`Protein is over ${HIGH_PROTEIN_G_PER_KG} g per kg. More than this rarely helps.`);
    if (t.fat < MIN_FAT_G_PER_KG * w) warn(`Fat is under ${MIN_FAT_G_PER_KG} g per kg. Very low fat can affect hormones and vitamin absorption.`);
    if (t.fat * 9 > 0.45 * kcal) warn("Fat is over 45% of your calories, which leaves little room for carbs.");
    if (t.carbs < 50) warn("Carbs are under 50 g, which can make training harder.");
    if (t.fibre > 60) warn("Fibre over 60 g is a lot and may upset digestion.");
    const macroKcal = 4 * t.protein + 4 * t.carbs + 9 * t.fat;
    if (Math.abs(macroKcal - kcal) / kcal > 0.1) warn(`Your macros add up to ${fmt(macroKcal)} kcal, which doesn't match your ${fmt(kcal)} kcal target.`);
    return { targets: t, warnings, macroKcal: Math.round(macroKcal) };
  }

  const api = { ACTIVITY, GOALS, FLOOR, KCAL_PER_KG, kgToLb, lbToKg, cmToFtIn, ftInToCm, validateProfile, bmr, macrosFor, calcTargets, explain, checkTargets, floorFor, maxLossKg, maxGainKg };
  root.Nutrition = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
