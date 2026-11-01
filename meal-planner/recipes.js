// Recipe dataset. Ingredient quantities are PER SERVING: [name, qty, unit, aisle].
// cost = rough price per serving in USD; time = total minutes; n = [kcal, protein, carbs, fat, fibre] per serving.
// slots = which of breakfast / lunch / dinner / snack a recipe can fill.
(function (root) {
  const P = "Produce", M = "Meat & Fish", D = "Dairy & Eggs", B = "Bakery",
        K = "Pantry", F = "Frozen";
  const recipes = [
    { id: "chicken-stirfry", name: "Chicken veggie stir-fry", time: 25, cost: 3.2, tags: ["chicken", "asian", "quick"],
      ing: [["chicken breast", 120, "g", M], ["bell pepper", 0.5, "pc", P], ["broccoli", 80, "g", P], ["soy sauce", 1, "tbsp", K], ["rice", 75, "g", K]] },
    { id: "spag-bol", name: "Spaghetti bolognese", time: 40, cost: 2.9, tags: ["beef", "pasta", "italian"],
      ing: [["ground beef", 100, "g", M], ["spaghetti", 85, "g", K], ["canned tomatoes", 100, "g", K], ["onion", 0.5, "pc", P], ["garlic", 1, "clove", P]] },
    { id: "veg-curry", name: "Chickpea & spinach curry", time: 30, cost: 1.8, tags: ["vegan", "vegetarian", "indian", "legumes"],
      ing: [["chickpeas (canned)", 120, "g", K], ["spinach", 60, "g", P], ["coconut milk", 80, "ml", K], ["onion", 0.5, "pc", P], ["curry paste", 1, "tbsp", K], ["rice", 75, "g", K]] },
    { id: "salmon-veg", name: "Baked salmon with potatoes & green beans", time: 35, cost: 5.2, tags: ["fish", "salmon", "healthy"],
      ing: [["salmon fillet", 140, "g", M], ["potatoes", 200, "g", P], ["green beans", 100, "g", P], ["lemon", 0.25, "pc", P]] },
    { id: "veg-chili", name: "Three-bean chili", time: 45, cost: 1.6, tags: ["vegan", "vegetarian", "mexican", "legumes", "batch"],
      ing: [["kidney beans (canned)", 100, "g", K], ["black beans (canned)", 100, "g", K], ["canned tomatoes", 120, "g", K], ["onion", 0.5, "pc", P], ["bell pepper", 0.5, "pc", P], ["chili powder", 1, "tsp", K]] },
    { id: "omelette", name: "Cheese & mushroom omelette with salad", time: 15, cost: 2.0, tags: ["vegetarian", "eggs", "quick"],
      ing: [["eggs", 3, "pc", D], ["cheddar", 30, "g", D], ["mushrooms", 70, "g", P], ["salad leaves", 50, "g", P]] },
    { id: "tacos-beef", name: "Beef tacos", time: 25, cost: 3.4, tags: ["beef", "mexican", "quick"],
      ing: [["ground beef", 100, "g", M], ["taco shells", 3, "pc", K], ["lettuce", 40, "g", P], ["tomato", 1, "pc", P], ["cheddar", 25, "g", D], ["sour cream", 1, "tbsp", D]] },
    { id: "tacos-bean", name: "Black bean tacos", time: 20, cost: 1.7, tags: ["vegetarian", "vegan", "mexican", "legumes", "quick"],
      ing: [["black beans (canned)", 120, "g", K], ["taco shells", 3, "pc", K], ["lettuce", 40, "g", P], ["tomato", 1, "pc", P], ["avocado", 0.5, "pc", P]] },
    { id: "pasta-pesto", name: "Pesto pasta with cherry tomatoes", time: 15, cost: 2.0, tags: ["vegetarian", "pasta", "italian", "quick"],
      ing: [["penne", 90, "g", K], ["pesto", 2, "tbsp", K], ["cherry tomatoes", 80, "g", P], ["parmesan", 15, "g", D]] },
    { id: "chicken-traybake", name: "Lemon chicken & veg traybake", time: 50, cost: 3.0, tags: ["chicken", "healthy", "oven"],
      ing: [["chicken thighs", 150, "g", M], ["potatoes", 150, "g", P], ["carrots", 1, "pc", P], ["lemon", 0.25, "pc", P], ["onion", 0.5, "pc", P]] },
    { id: "lentil-soup", name: "Red lentil soup", time: 30, cost: 1.1, tags: ["vegan", "vegetarian", "legumes", "soup", "batch"],
      ing: [["red lentils", 60, "g", K], ["carrots", 1, "pc", P], ["onion", 0.5, "pc", P], ["canned tomatoes", 60, "g", K], ["bread", 1, "slice", B]] },
    { id: "fried-rice", name: "Egg fried rice", time: 20, cost: 1.5, tags: ["vegetarian", "eggs", "asian", "quick"],
      ing: [["rice", 75, "g", K], ["eggs", 2, "pc", D], ["frozen peas", 50, "g", F], ["soy sauce", 1, "tbsp", K], ["carrots", 0.5, "pc", P]] },
    { id: "shrimp-pasta", name: "Garlic shrimp linguine", time: 20, cost: 4.8, tags: ["fish", "shrimp", "pasta", "quick"],
      ing: [["shrimp", 120, "g", M], ["linguine", 85, "g", K], ["garlic", 2, "clove", P], ["lemon", 0.25, "pc", P], ["parsley", 5, "g", P]] },
    { id: "sausage-mash", name: "Sausages, mash & peas", time: 30, cost: 2.6, tags: ["pork", "comfort"],
      ing: [["pork sausages", 3, "pc", M], ["potatoes", 250, "g", P], ["frozen peas", 70, "g", F], ["butter", 10, "g", D]] },
    { id: "burrito-bowl", name: "Chicken burrito bowl", time: 30, cost: 3.5, tags: ["chicken", "mexican", "healthy"],
      ing: [["chicken breast", 120, "g", M], ["rice", 70, "g", K], ["black beans (canned)", 80, "g", K], ["corn (canned)", 50, "g", K], ["avocado", 0.5, "pc", P], ["salsa", 2, "tbsp", K]] },
    { id: "veg-lasagne", name: "Spinach & ricotta lasagne", time: 60, cost: 2.7, tags: ["vegetarian", "pasta", "italian", "oven", "batch"],
      ing: [["lasagne sheets", 60, "g", K], ["ricotta", 80, "g", D], ["spinach", 60, "g", P], ["canned tomatoes", 100, "g", K], ["mozzarella", 30, "g", D]] },
    { id: "beef-stirfry", name: "Beef & broccoli stir-fry", time: 25, cost: 4.4, tags: ["beef", "asian", "quick"],
      ing: [["beef strips", 120, "g", M], ["broccoli", 100, "g", P], ["soy sauce", 1, "tbsp", K], ["garlic", 1, "clove", P], ["rice", 75, "g", K]] },
    { id: "tofu-noodles", name: "Peanut tofu noodles", time: 25, cost: 2.4, tags: ["vegan", "vegetarian", "asian", "quick"],
      ing: [["firm tofu", 120, "g", D], ["rice noodles", 80, "g", K], ["peanut butter", 1.5, "tbsp", K], ["soy sauce", 1, "tbsp", K], ["bell pepper", 0.5, "pc", P], ["carrots", 0.5, "pc", P]] },
    { id: "fish-tacos", name: "Crispy fish tacos", time: 30, cost: 4.0, tags: ["fish", "mexican"],
      ing: [["white fish fillet", 130, "g", M], ["taco shells", 3, "pc", K], ["cabbage", 50, "g", P], ["lime", 0.5, "pc", P], ["sour cream", 1, "tbsp", D]] },
    { id: "jacket-potato", name: "Jacket potato with beans & cheese", time: 55, cost: 1.3, tags: ["vegetarian", "comfort", "oven"],
      ing: [["baking potato", 1, "pc", P], ["baked beans (canned)", 130, "g", K], ["cheddar", 30, "g", D]] },
    { id: "chicken-curry", name: "Chicken tikka masala", time: 40, cost: 3.6, tags: ["chicken", "indian"],
      ing: [["chicken breast", 120, "g", M], ["tikka masala paste", 2, "tbsp", K], ["canned tomatoes", 80, "g", K], ["cream", 30, "ml", D], ["rice", 75, "g", K], ["onion", 0.5, "pc", P]] },
    { id: "caprese-sandwich", name: "Caprese ciabatta & soup", time: 10, cost: 2.5, tags: ["vegetarian", "quick", "italian"],
      ing: [["ciabatta", 1, "pc", B], ["mozzarella", 60, "g", D], ["tomato", 1, "pc", P], ["basil", 3, "g", P], ["canned soup", 150, "g", K]] },
    { id: "pork-chops", name: "Pork chops with roast veg", time: 45, cost: 3.8, tags: ["pork", "oven"],
      ing: [["pork chop", 1, "pc", M], ["potatoes", 200, "g", P], ["carrots", 1, "pc", P], ["broccoli", 80, "g", P]] },
    { id: "shakshuka", name: "Shakshuka with bread", time: 30, cost: 1.9, tags: ["vegetarian", "eggs"],
      ing: [["eggs", 2, "pc", D], ["canned tomatoes", 150, "g", K], ["bell pepper", 0.5, "pc", P], ["onion", 0.5, "pc", P], ["bread", 2, "slice", B]] },
    { id: "gnocchi-sausage", name: "Sausage & kale gnocchi", time: 25, cost: 3.3, tags: ["pork", "pasta", "italian", "quick"],
      ing: [["gnocchi", 150, "g", K], ["pork sausages", 2, "pc", M], ["kale", 50, "g", P], ["garlic", 1, "clove", P], ["parmesan", 10, "g", D]] },
    { id: "veggie-burger", name: "Veggie burgers & wedges", time: 35, cost: 2.8, tags: ["vegetarian", "comfort", "oven"],
      ing: [["veggie patties", 1, "pc", F], ["burger buns", 1, "pc", B], ["potatoes", 200, "g", P], ["lettuce", 30, "g", P], ["tomato", 0.5, "pc", P]] },
  ];

  // Slots each original recipe can fill, nutrition per serving [kcal, protein g, carbs g, fat g], and short prep steps.
  const X = {
    "chicken-stirfry": [["dinner"], [520, 42, 55, 12], ["Slice the chicken and veg; start the rice.", "Stir-fry the chicken 6 min, add the veg for 4 more.", "Add soy sauce and serve over rice."]],
    "spag-bol": [["dinner"], [640, 35, 78, 18], ["Soften onion and garlic, brown the beef.", "Add tomatoes and simmer 20 min.", "Boil spaghetti and toss with the sauce."]],
    "veg-curry": [["lunch", "dinner"], [590, 20, 85, 18], ["Soften onion with the curry paste.", "Add chickpeas, coconut milk and simmer 12 min; stir in spinach.", "Serve with rice."]],
    "salmon-veg": [["dinner"], [560, 38, 40, 26], ["Roast diced potatoes 20 min at 200C.", "Add salmon and beans; roast 12 min more.", "Finish with lemon."]],
    "veg-chili": [["lunch", "dinner"], [430, 22, 68, 8], ["Soften onion and pepper with chili powder.", "Add tomatoes and beans; simmer 30 min."]],
    "omelette": [["breakfast", "lunch", "dinner"], [420, 28, 6, 32], ["Fry mushrooms 3 min.", "Pour in beaten eggs, add cheese, fold.", "Serve with salad leaves."]],
    "tacos-beef": [["dinner"], [610, 32, 45, 32], ["Brown the beef with spices.", "Warm the shells; chop lettuce and tomato.", "Fill and top with cheese and sour cream."]],
    "tacos-bean": [["lunch", "dinner"], [520, 18, 70, 19], ["Warm the beans with a splash of water.", "Chop lettuce, tomato and avocado.", "Fill the shells."]],
    "pasta-pesto": [["lunch", "dinner"], [560, 20, 75, 20], ["Boil the penne.", "Toss with pesto and halved tomatoes.", "Top with parmesan."]],
    "chicken-traybake": [["dinner"], [540, 38, 38, 25], ["Chop veg and put on a tray with the chicken.", "Squeeze over lemon, season.", "Roast 40 min at 200C."]],
    "lentil-soup": [["lunch", "dinner"], [430, 22, 70, 6], ["Soften onion and carrot.", "Add lentils, tomatoes and water; simmer 20 min.", "Blend if you like; serve with bread."]],
    "fried-rice": [["lunch", "dinner"], [520, 18, 78, 14], ["Stir-fry carrot and peas 3 min.", "Push aside, scramble the eggs.", "Add cooked rice and soy sauce; fry 4 min."]],
    "shrimp-pasta": [["dinner"], [520, 34, 70, 10], ["Boil the linguine.", "Fry garlic, then shrimp 3 min.", "Toss with pasta, lemon and parsley."]],
    "sausage-mash": [["dinner"], [700, 25, 60, 40], ["Boil potatoes 15 min, mash with butter.", "Pan-fry sausages 12 min.", "Cook the peas and serve."]],
    "burrito-bowl": [["lunch", "dinner"], [640, 40, 75, 18], ["Pan-fry sliced chicken 8 min.", "Warm rice, beans and corn.", "Build the bowl; top with avocado and salsa."]],
    "veg-lasagne": [["dinner"], [590, 28, 60, 26], ["Wilt the spinach and mix into the ricotta.", "Layer with sauce and sheets.", "Top with mozzarella; bake 35 min at 190C."]],
    "beef-stirfry": [["dinner"], [590, 40, 60, 18], ["Cook the rice.", "Stir-fry beef 3 min, then broccoli and garlic 4 min.", "Add soy sauce and serve."]],
    "tofu-noodles": [["lunch", "dinner"], [560, 24, 70, 20], ["Pan-fry cubed tofu until crisp.", "Cook noodles; slice pepper and carrot.", "Toss with peanut butter and soy sauce."]],
    "fish-tacos": [["dinner"], [520, 30, 48, 22], ["Pan-fry the fish 3 min a side.", "Shred cabbage with lime.", "Fill shells and add sour cream."]],
    "jacket-potato": [["lunch", "dinner"], [480, 18, 80, 10], ["Prick the potato; bake 50 min at 200C.", "Warm the beans.", "Split and fill; top with cheese."]],
    "chicken-curry": [["dinner"], [640, 40, 70, 22], ["Fry onion and chicken 6 min.", "Add paste and tomatoes; simmer 15 min.", "Stir in cream; serve with rice."]],
    "caprese-sandwich": [["lunch"], [560, 24, 62, 22], ["Slice the ciabatta, mozzarella and tomato.", "Layer with basil.", "Heat the soup and serve alongside."]],
    "pork-chops": [["dinner"], [560, 40, 35, 28], ["Roast potatoes and carrots 30 min at 200C.", "Pan-fry the chop 5 min a side.", "Steam broccoli and plate."]],
    "shakshuka": [["breakfast", "lunch", "dinner"], [400, 20, 40, 16], ["Soften onion and pepper.", "Add tomatoes, simmer 10 min.", "Crack in eggs, cover 6 min; serve with bread."]],
    "gnocchi-sausage": [["dinner"], [640, 22, 75, 26], ["Brown the sliced sausage with garlic.", "Add gnocchi and kale; fry 6 min.", "Finish with parmesan."]],
    "veggie-burger": [["dinner"], [640, 22, 80, 24], ["Bake wedges 25 min at 220C.", "Cook the patty as directed.", "Build the burger with lettuce and tomato."]],
  };
  recipes.forEach((r) => { const [slots, n, steps] = X[r.id]; r.slots = slots; r.n = n; r.steps = steps; });

  // New recipes: id, name, slots, minutes, cost per serving, tags, nutrition, ingredients, steps.
  const add = (id, name, slots, time, cost, tags, n, ing, steps) => recipes.push({ id, name, slots, time, cost, tags, n, ing, steps });
  const V = ["vegan", "vegetarian"], VG = ["vegetarian"];

  // Breakfasts
  add("porridge", "Banana & peanut butter porridge", ["breakfast"], 10, 0.9, V, [470, 14, 72, 14],
    [["rolled oats", 50, "g", K], ["oat milk", 200, "ml", K], ["banana", 1, "pc", P], ["peanut butter", 1, "tbsp", K]],
    ["Simmer oats with oat milk 5 min.", "Top with sliced banana and peanut butter."]);
  add("eggs-toast", "Scrambled eggs on toast", ["breakfast"], 12, 1.3, VG, [430, 22, 30, 24],
    [["eggs", 2, "pc", D], ["bread", 2, "slice", B], ["butter", 5, "g", D], ["tomato", 0.5, "pc", P]],
    ["Toast the bread.", "Scramble eggs in butter over low heat.", "Serve with sliced tomato."]);
  add("yogurt-granola", "Yogurt, granola & blueberries", ["breakfast"], 5, 1.5, VG, [400, 20, 48, 14],
    [["greek yogurt", 150, "g", D], ["granola", 40, "g", K], ["blueberries", 60, "g", P]],
    ["Spoon yogurt into a bowl.", "Top with granola and berries."]);
  add("avocado-toast", "Avocado toast with tomatoes", ["breakfast"], 8, 1.6, V, [380, 9, 38, 22],
    [["avocado", 1, "pc", P], ["bread", 2, "slice", B], ["cherry tomatoes", 40, "g", P]],
    ["Toast the bread.", "Mash avocado with salt and lemon.", "Spread and top with halved tomatoes."]);
  add("smoothie-bowl", "Berry smoothie bowl", ["breakfast"], 5, 1.6, V, [380, 9, 70, 6],
    [["banana", 1, "pc", P], ["frozen berries", 80, "g", F], ["oat milk", 150, "ml", K], ["rolled oats", 30, "g", K]],
    ["Blend banana, berries and oat milk until thick.", "Pour into a bowl and top with oats."]);
  add("pb-toast", "Peanut butter & banana toast", ["breakfast"], 5, 0.8, V, [450, 14, 62, 18],
    [["bread", 2, "slice", B], ["peanut butter", 1.5, "tbsp", K], ["banana", 1, "pc", P]],
    ["Toast the bread.", "Spread peanut butter and top with banana slices."]);
  add("tofu-scramble", "Spinach tofu scramble on toast", ["breakfast"], 15, 1.8, V, [400, 26, 32, 18],
    [["firm tofu", 150, "g", D], ["spinach", 40, "g", P], ["bell pepper", 0.5, "pc", P], ["bread", 2, "slice", B]],
    ["Crumble tofu into a hot pan with diced pepper; fry 6 min.", "Stir in spinach until wilted.", "Serve on toast."]);
  add("egg-muffin", "Egg & cheese muffin", ["breakfast"], 10, 1.4, VG, [360, 18, 30, 18],
    [["english muffin", 1, "pc", B], ["eggs", 1, "pc", D], ["cheddar", 20, "g", D]],
    ["Toast the muffin.", "Fry the egg 3 min.", "Stack with cheese."]);
  add("chia-pudding", "Berry chia pudding", ["breakfast"], 5, 1.7, V, [330, 10, 35, 16],
    [["chia seeds", 30, "g", K], ["oat milk", 200, "ml", K], ["frozen berries", 60, "g", F]],
    ["Stir chia into oat milk; rest 10 min (or overnight).", "Top with berries."]);
  add("pancakes", "Banana pancakes", ["breakfast"], 20, 1.2, VG, [520, 14, 86, 13],
    [["flour", 80, "g", K], ["eggs", 1, "pc", D], ["milk", 120, "ml", D], ["banana", 1, "pc", P], ["maple syrup", 1, "tbsp", K]],
    ["Whisk flour, egg and milk into a batter.", "Fry ladlefuls 2 min a side.", "Serve with banana and syrup."]);
  add("beans-toast", "Baked beans on toast", ["breakfast"], 8, 0.9, V, [380, 18, 64, 5],
    [["baked beans (canned)", 200, "g", K], ["bread", 2, "slice", B]],
    ["Warm the beans.", "Toast the bread and pour over."]);

  // Lunches
  add("chicken-wrap", "Chicken salad wrap", ["lunch"], 15, 2.6, ["chicken", "quick"], [480, 36, 45, 16],
    [["chicken breast", 100, "g", M], ["tortilla", 1, "pc", B], ["lettuce", 30, "g", P], ["tomato", 0.5, "pc", P], ["greek yogurt", 30, "g", D]],
    ["Pan-fry sliced chicken 6 min.", "Warm the tortilla; add lettuce, tomato and yogurt.", "Add chicken and roll."]);
  add("tuna-sandwich", "Tuna salad sandwich", ["lunch"], 10, 2.1, ["fish", "quick"], [450, 28, 38, 20],
    [["canned tuna", 80, "g", K], ["bread", 2, "slice", B], ["mayonnaise", 1, "tbsp", K], ["lettuce", 20, "g", P]],
    ["Mix tuna with mayonnaise.", "Fill the bread with tuna and lettuce."]);
  add("hummus-wrap", "Hummus & crunchy veg wrap", ["lunch"], 10, 1.7, V.concat("quick"), [430, 13, 56, 16],
    [["tortilla", 1, "pc", B], ["hummus", 3, "tbsp", K], ["cucumber", 0.5, "pc", P], ["carrots", 0.5, "pc", P], ["spinach", 30, "g", P]],
    ["Spread hummus on the tortilla.", "Add sliced cucumber, grated carrot and spinach; roll."]);
  add("greek-pitta", "Greek salad pitta", ["lunch"], 10, 2.0, VG.concat("quick"), [450, 16, 48, 22],
    [["pita bread", 1, "pc", B], ["feta", 50, "g", D], ["cucumber", 0.5, "pc", P], ["tomato", 1, "pc", P], ["olives", 20, "g", K]],
    ["Chop cucumber, tomato and feta.", "Toss with olives and stuff into the pita."]);
  add("quinoa-bowl", "Chickpea & quinoa bowl", ["lunch"], 20, 1.9, V.concat("healthy"), [520, 20, 76, 13],
    [["quinoa", 60, "g", K], ["chickpeas (canned)", 100, "g", K], ["cucumber", 0.5, "pc", P], ["cherry tomatoes", 60, "g", P], ["lemon", 0.25, "pc", P]],
    ["Simmer quinoa 15 min.", "Mix with chickpeas and chopped veg.", "Dress with lemon juice."]);
  add("grilled-cheese", "Grilled cheese & tomato soup", ["lunch"], 15, 1.9, VG, [560, 22, 58, 28],
    [["bread", 2, "slice", B], ["cheddar", 40, "g", D], ["butter", 5, "g", D], ["canned soup", 200, "g", K]],
    ["Warm the soup.", "Butter the bread, fill with cheese and fry 3 min a side."]);
  add("caesar-salad", "Chicken caesar salad", ["lunch"], 20, 3.0, ["chicken", "healthy"], [520, 40, 22, 28],
    [["chicken breast", 100, "g", M], ["romaine lettuce", 80, "g", P], ["parmesan", 15, "g", D], ["croutons", 20, "g", B], ["caesar dressing", 1.5, "tbsp", K]],
    ["Pan-fry the chicken 7 min and slice.", "Toss lettuce with dressing.", "Top with chicken, croutons and parmesan."]);
  add("pasta-salad", "Mozzarella pasta salad", ["lunch"], 20, 2.0, VG.concat("pasta"), [560, 20, 70, 22],
    [["penne", 80, "g", K], ["cherry tomatoes", 80, "g", P], ["mozzarella", 40, "g", D], ["pesto", 1, "tbsp", K]],
    ["Boil and cool the penne.", "Toss with tomatoes, torn mozzarella and pesto."]);

  // More dinners (vegan options)
  add("roast-chickpea", "Roasted sweet potato & chickpeas", ["dinner"], 45, 1.9, V.concat("oven"), [530, 17, 82, 14],
    [["sweet potato", 200, "g", P], ["chickpeas (canned)", 120, "g", K], ["bell pepper", 0.5, "pc", P], ["onion", 0.5, "pc", P], ["olive oil", 1, "tbsp", K]],
    ["Chop everything and toss with oil and spices.", "Roast 35 min at 200C."]);
  add("aglio-olio", "Garlic & broccoli spaghetti", ["dinner"], 25, 1.6, V.concat("pasta", "italian"), [560, 18, 82, 18],
    [["spaghetti", 90, "g", K], ["broccoli", 100, "g", P], ["garlic", 2, "clove", P], ["chili flakes", 0.5, "tsp", K], ["olive oil", 1, "tbsp", K]],
    ["Boil spaghetti, adding broccoli for the last 4 min.", "Warm garlic and chili in oil.", "Toss everything together."]);

  // Snacks: small, 10 minutes or less
  add("apple-pb", "Apple slices with peanut butter", ["snack"], 3, 0.7, V, [190, 5, 25, 9],
    [["apple", 1, "pc", P], ["peanut butter", 1, "tbsp", K]], ["Slice the apple.", "Serve with peanut butter."]);
  add("yogurt-berries", "Greek yogurt with berries", ["snack"], 3, 1.0, VG, [130, 12, 12, 4],
    [["greek yogurt", 120, "g", D], ["blueberries", 40, "g", P]], ["Spoon yogurt into a bowl and top with berries."]);
  add("hummus-carrots", "Hummus & carrot sticks", ["snack"], 5, 0.6, V, [150, 5, 16, 8],
    [["hummus", 3, "tbsp", K], ["carrots", 1, "pc", P]], ["Cut carrots into sticks.", "Serve with hummus."]);
  add("cheese-crackers", "Cheddar & crackers", ["snack"], 3, 0.8, VG, [200, 8, 14, 12],
    [["cheddar", 30, "g", D], ["crackers", 5, "pc", K]], ["Slice the cheese and serve on crackers."]);
  add("banana-almonds", "Banana & almonds", ["snack"], 2, 0.7, V, [160, 4, 28, 7],
    [["banana", 1, "pc", P], ["almonds", 15, "g", K]], ["Peel the banana and serve with almonds."]);
  add("boiled-egg", "Boiled egg & cherry tomatoes", ["snack"], 10, 0.6, VG, [110, 8, 3, 8],
    [["eggs", 1, "pc", D], ["cherry tomatoes", 50, "g", P]], ["Boil the egg 9 min; cool and peel.", "Serve with tomatoes."]);
  add("edamame", "Salted edamame", ["snack"], 5, 0.7, V, [120, 11, 9, 5],
    [["edamame (frozen)", 100, "g", F]], ["Boil edamame 4 min, drain and salt."]);
  add("cottage-cucumber", "Cottage cheese & cucumber", ["snack"], 3, 0.7, VG, [100, 12, 4, 4],
    [["cottage cheese", 100, "g", D], ["cucumber", 0.5, "pc", P]], ["Slice the cucumber and serve with cottage cheese."]);
  add("trail-mix", "Almond & raisin trail mix", ["snack"], 1, 0.6, V, [170, 4, 18, 10],
    [["almonds", 15, "g", K], ["raisins", 15, "g", K]], ["Mix and serve."]);
  add("rice-cake-avo", "Rice cakes with avocado", ["snack"], 5, 0.8, V, [140, 3, 17, 7],
    [["rice cakes", 2, "pc", K], ["avocado", 0.25, "pc", P]], ["Mash avocado with salt.", "Spread on rice cakes."]);
  add("pita-hummus", "Pita & hummus", ["snack"], 4, 0.7, V, [220, 7, 34, 6],
    [["pita bread", 1, "pc", B], ["hummus", 2, "tbsp", K]], ["Warm the pita and cut into strips.", "Serve with hummus."]);
  add("berry-smoothie", "Banana berry smoothie", ["snack"], 5, 0.9, V, [150, 3, 32, 2],
    [["banana", 1, "pc", P], ["oat milk", 150, "ml", K], ["frozen berries", 50, "g", F]], ["Blend everything until smooth."]);
  add("popcorn", "Stovetop popcorn", ["snack"], 8, 0.3, V, [140, 4, 22, 5],
    [["popcorn kernels", 30, "g", K], ["olive oil", 1, "tsp", K]], ["Heat oil in a lidded pan, add kernels.", "Shake until popping stops; salt."]);
  add("clementine-walnuts", "Clementines & walnuts", ["snack"], 2, 0.8, V, [150, 3, 15, 9],
    [["clementines", 2, "pc", P], ["walnuts", 15, "g", K]], ["Peel the clementines and serve with walnuts."]);
  add("cream-cheese-cuke", "Cucumber cream cheese bites", ["snack"], 5, 0.7, VG, [110, 3, 4, 9],
    [["cucumber", 0.5, "pc", P], ["cream cheese", 30, "g", D]], ["Slice the cucumber into rounds.", "Top each with cream cheese."]);
  add("choc-strawberries", "Strawberries & dark chocolate", ["snack"], 2, 1.0, V, [120, 2, 15, 7],
    [["strawberries", 100, "g", P], ["dark chocolate", 15, "g", K]], ["Wash the strawberries and serve with the chocolate."]);
  add("turkey-rollups", "Turkey & cheese roll-ups", ["snack"], 3, 1.2, ["turkey"], [150, 16, 1, 9],
    [["turkey slices", 60, "g", M], ["cheddar", 20, "g", D]], ["Lay cheese on turkey slices and roll."]);
  add("guac-chips", "Quick guacamole & tortilla chips", ["snack"], 8, 1.1, V, [190, 3, 20, 12],
    [["avocado", 0.5, "pc", P], ["tortilla chips", 25, "g", K], ["lime", 0.25, "pc", P]], ["Mash avocado with lime and salt.", "Serve with chips."]);
  add("grapes-cashews", "Grapes & cashews", ["snack"], 2, 0.9, V, [160, 3, 20, 8],
    [["grapes", 100, "g", P], ["cashews", 15, "g", K]], ["Wash the grapes and serve with cashews."]);
  add("celery-pb", "Celery with peanut butter", ["snack"], 3, 0.5, V, [130, 5, 6, 10],
    [["celery", 2, "pc", P], ["peanut butter", 1, "tbsp", K]], ["Fill celery sticks with peanut butter."]);

  // Fibre per serving (g), appended to each recipe's n as the 5th value.
  const FIBRE = {
    "chicken-stirfry": 5, "spag-bol": 6, "veg-curry": 12, "salmon-veg": 7, "veg-chili": 17, "omelette": 2, "tacos-beef": 5, "tacos-bean": 14,
    "pasta-pesto": 6, "chicken-traybake": 7, "lentil-soup": 14, "fried-rice": 5, "shrimp-pasta": 5, "sausage-mash": 8, "burrito-bowl": 12,
    "veg-lasagne": 6, "beef-stirfry": 6, "tofu-noodles": 7, "fish-tacos": 5, "jacket-potato": 13, "chicken-curry": 5, "caprese-sandwich": 5,
    "pork-chops": 8, "shakshuka": 8, "gnocchi-sausage": 5, "veggie-burger": 9,
    "porridge": 8, "eggs-toast": 3, "yogurt-granola": 4, "avocado-toast": 12, "smoothie-bowl": 10, "pb-toast": 8, "tofu-scramble": 7,
    "egg-muffin": 2, "chia-pudding": 12, "pancakes": 4, "beans-toast": 14,
    "chicken-wrap": 4, "tuna-sandwich": 4, "hummus-wrap": 8, "greek-pitta": 5, "quinoa-bowl": 13, "grilled-cheese": 4, "caesar-salad": 3, "pasta-salad": 5,
    "roast-chickpea": 15, "aglio-olio": 8,
    "apple-pb": 5, "yogurt-berries": 1, "hummus-carrots": 5, "cheese-crackers": 1, "banana-almonds": 5, "boiled-egg": 1, "edamame": 5,
    "cottage-cucumber": 1, "trail-mix": 3, "rice-cake-avo": 3, "pita-hummus": 4, "berry-smoothie": 5, "popcorn": 4, "clementine-walnuts": 4,
    "cream-cheese-cuke": 1, "choc-strawberries": 3, "turkey-rollups": 0, "guac-chips": 5, "grapes-cashews": 2, "celery-pb": 3,
  };
  recipes.forEach((r) => r.n.push(FIBRE[r.id]));

  root.RECIPES = recipes;
  if (typeof module !== "undefined") module.exports = recipes;
})(typeof window !== "undefined" ? window : globalThis);
