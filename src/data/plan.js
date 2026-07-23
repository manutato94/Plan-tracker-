// Datos del plan de Manuel — plan nutricional de Federico von Proschek
// Meals shown on Today (fixed daily structure)
export const MEAL_DEFS = [
  { key: "breakfast", label: "Desayuno", time: "8–10 AM", icon: "sun" },
  { key: "lunch",     label: "Almuerzo", time: "13–14",   icon: "bowl" },
  { key: "snack",     label: "Merienda", time: "17–18",   icon: "leaf" },
  { key: "dinner",    label: "Cena",     time: "21–22",   icon: "moon" },
];

// Off-plan severity scale (slider) — kcal is the *extra* over a planned meal (~550 avg)
export const OFFPLAN_SCALE = [
  { label: "Fruta/snack de más",      example: "Fruta extra, barrita, puñado de frutos secos", kcal: 120 },
  { label: "Picoteo moderado",         example: "Tostadas, queso, un alfajor", kcal: 300 },
  { label: "Plato casero libre",       example: "Pastas rellenas, milanesa con puré, tarta", kcal: 550 },
  { label: "Comida rápida",            example: "Hamburguesa completa, 3–4 porciones de pizza", kcal: 900 },
  { label: "Atracón / salida",         example: "Empanadas + pizza + postre, asado libre, cerveza", kcal: 1300 },
];

// Dessert scale — solo almuerzo/cena. 0=no comí, 1=en plan, 2+=transgresión
export const DESSERT_SCALE = [
  { label: "No comí",             kcal: 0,   onPlan: true },
  { label: "Fruta A o 2 dátiles", kcal: 90,  onPlan: true },
  { label: "Vauquita",            kcal: 93,  onPlan: false },
  { label: "Alfajor",             kcal: 230, onPlan: false },
  { label: "Porción de torta",    kcal: 350, onPlan: false },
  { label: "Helado ¼ kg",         kcal: 500, onPlan: false },
];
export const MEALS_WITH_DESSERT = ["lunch", "dinner"];

// Weekly workout plan — objetivo: caminata 5-6 días, gym 2, running 2
export const DEFAULT_WEEKLY_PLAN = [
  ["Caminata", "Gym"],     // Lun — gym + caminata
  ["Caminata", "Running"], // Mar — running + caminata
  ["Caminata", "Gym"],     // Mié — gym + caminata
  ["Caminata", "Running"], // Jue — running + caminata
  ["Caminata"],            // Vie — solo caminata
  ["Caminata"],            // Sáb — solo caminata
  [],                      // Dom — descanso
];
export const DEFAULT_EXERCISES = [
  { name: "Gym",       icon: "dumbbell" },
  { name: "Running",   icon: "run" },
  { name: "Caminata",  icon: "walk" },
  { name: "Bicicleta", icon: "bike" },
  { name: "Core",      icon: "core" },
  { name: "Movilidad", icon: "stretch" },
];

// Nutrition guide — Federico's plan, day by day with quantities
export const DAY_ACTIVITY = ["gym","run","gym","run","rest","gym","rest"];
export const DAY_NAMES = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
export const DAY_SHORT = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

// Fixed meals repeated across the week (breakfast/snack), from Federico's plan
export const GUIDE_FIXED = {
  breakfast: {
    kcal: 415,
    options: [
      "Infusión + 2 huevos revueltos o a la plancha + ¼ palta o 1 rebanada queso port salut light + 1 fruta A",
      "Infusión + 200g yogur descremado + 40g granola sin azúcar + 1 fruta A",
    ],
  },
  snack: {
    kcal: 350,
    options: [
      "Infusión + 1 fruta A o 1 banana chica + 2 discos de arroz con queso untable o palta pisada + puñadito de frutos secos",
      "150g yogur griego + 25g whey vainilla + 1 banana chica + 20g frutos secos",
    ],
  },
};

// Lunch/dinner per day (Menú 1). Días intercambiables.
export const GUIDE_MAIN = [
  { // Lunes
    lunch: "1 porción mediana (180g) de trucha a la plancha o brótola grillada + ½ papa mediana hervida con piel (200g)",
    dinner: "1½ taza de zapallo/calabaza en cubos al horno + 1 milanesa de pollo grande al horno",
  },
  { // Martes
    lunch: "1½ taza de zapallo/calabaza en cubos al horno + 1 milanesa de pollo grande al horno",
    dinner: "Wok de vegetales con bola de lomo de cerdo en tiras (200g) + 6 cdas soperas de arroz integral cocido (120g)",
  },
  { // Miércoles
    lunch: "Wok de vegetales con bola de lomo de cerdo en tiras (200g) + 6 cdas soperas de arroz integral cocido (120g)",
    dinner: "½ batata mediana al horno con piel (200g) + 1 pata-muslo de pollo al horno SIN piel",
  },
  { // Jueves
    lunch: "½ batata mediana al horno con piel (200g) + 1 pata-muslo de pollo al horno SIN piel",
    dinner: "6 papines al horno + 2 milanesas de peceto chicas al horno",
  },
  { // Viernes
    lunch: "6 papines al horno + 2 milanesas de peceto chicas al horno",
    dinner: "Tacos de 2 rapiditas integrales con pollo (pechuga) salteado con vegetales a elección",
  },
  { // Sábado
    lunch: "1 taza fideos tirabuzón integrales cocidos (135g) con rúcula, cherry, zanahoria y 1 lata de atún al natural",
    dinner: "LIBRE",
  },
  { // Domingo
    lunch: "1 bife grande a la plancha con ensalada",
    dinner: "Omelette de 2 huevos con atún al natural, tomates cherry y ½ taza de choclo en grano",
  },
];

export const RULES = [
  "Todo va con ensalada y/o vegetales cocidos libres y ABUNDANTES",
  "1 cucharada tamaño postre de aceite de oliva en crudo por comida",
  "Almidones medidos en cocido (taza 250cc / cuchara sopera / balanza)",
  "Postre almuerzo y cena: 1 fruta A o 2 dátiles",
  "Líquidos: 3,5 L mínimo por día (incluye infusiones)",
  "Masticar bien. Comer con atención y con intención.",
];
