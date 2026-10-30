// Deterministic nutrient engine — ZERO LLM.
// All values come from the sourced SEA food DB (USDA FCD / Malaysian FCD / NKF);
// unknown stays unknown. Portion math is pure TypeScript.
import db from "../data/sea-food-db.json";

export type Dish = {
  id: string;
  name: string;
  name_bm: string;
  serving: string;
  source: string;
  nutrients: {
    sodium_mg: number | null;
    potassium_mg: number | null;
    phosphorus_mg: number | null;
    protein_g: number | null;
    fluid_ml: number | null;
    calories?: number | null;
  };
};

export const DISHES: Dish[] = db.dishes as Dish[];
export const DB_META = db.meta as {
  version: string;
  note: string;
  daily_context: string;
};

export type Nutrients = Dish["nutrients"];

export type Contribution = {
  dishId: string;
  name: string;
  nameBm: string;
  serving: string;
  portion: number;
  values: Nutrients;
  source: string;
  estimated: boolean;
};

const KEYS: (keyof Nutrients)[] = [
  "sodium_mg",
  "potassium_mg",
  "phosphorus_mg",
  "protein_g",
  "fluid_ml",
];

// portion = multiplier of one typical serving (e.g. 1.5 plates of nasi lemak)
export function computeIntake(items: Contribution[]): {
  totals: Record<string, number | null>;
  unknownKeys: string[];
} {
  const totals: Record<string, number | null> = {};
  const unknown = new Set<string>();
  for (const key of KEYS) {
    let sum = 0;
    let any = false;
    for (const item of items) {
      const v = item.values[key];
      if (v === null || v === undefined) {
        unknown.add(key);
        continue;
      }
      sum += v * item.portion;
      any = true;
    }
    totals[key] = any ? Math.round(sum) : null;
  }
  return { totals, unknownKeys: [...unknown] };
}

export function findDish(id: string): Dish | undefined {
  return DISHES.find((d) => d.id === id);
}

// Exact + containment match for dish names (EN + BM) used to reconcile model
// output against the verified DB. No fuzzy LLM guessing here.
export function matchDishByName(name: string): Dish | undefined {
  const q = name.trim().toLowerCase();
  if (!q) return undefined;
  return (
    DISHES.find((d) => d.name.toLowerCase() === q || d.name_bm.toLowerCase() === q) ??
    DISHES.find((d) => q.includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(q)) ??
    DISHES.find((d) => q.includes(d.name_bm.toLowerCase()) || d.name_bm.toLowerCase().includes(q))
  );
}
