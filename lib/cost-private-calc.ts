import type { CostTotal, StatValues } from "./cost-calc.ts";

const STAT_KEYS = ["sing", "dance", "management"] as const;

export function multiplyTotals(totals: CostTotal[], count: number): CostTotal[] {
  return totals.map((item) => ({ ...item, amount: item.amount * count }));
}

export function sumCurveRange(values: number[], from: number, to: number): number {
  return values.slice(from, to).reduce((sum, value) => sum + value, 0);
}

export function percentStats(base: Pick<StatValues, "sing" | "dance" | "management">, percent: Pick<StatValues, "sing" | "dance" | "management">, rounding: "floor" | "round" = "floor") {
  const apply = rounding === "round" ? Math.round : Math.floor;
  return {
    sing: apply(base.sing * percent.sing / 10000),
    dance: apply(base.dance * percent.dance / 10000),
    management: apply(base.management * percent.management / 10000),
  };
}

export function museumStats(value: number, part: "all" | "case" | "wall" | "floor") {
  return {
    sing: part === "all" || part === "case" ? value : 0,
    dance: part === "all" || part === "wall" ? value : 0,
    management: part === "all" || part === "floor" ? value : 0,
  };
}

export function addStageStats(
  stats: Pick<StatValues, "sing" | "dance" | "management">,
  addition: Pick<StatValues, "sing" | "dance" | "management">,
  count: number,
) {
  const result = { ...stats };
  for (const key of STAT_KEYS) result[key] += addition[key] * count;
  return result;
}
