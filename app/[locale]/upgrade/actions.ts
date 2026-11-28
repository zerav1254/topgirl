"use server";

import { requireUser } from "@/lib/auth";
import { modTotals, stagePromotionCost, statDelta, statSum, sumLevels, type CostTotal, type StatValues } from "@/lib/cost-calc";
import type { PrivateCostError, PrivateCostResponse, PrivateCostResult } from "@/lib/cost-private";
import { addStageStats, multiplyTotals, museumStats, percentStats, sumCurveRange } from "@/lib/cost-private-calc";
import { getCostBook } from "@/lib/costs";
import { isLocale, type Locale } from "@/lib/i18n";
import { allow } from "@/lib/rate-limit";

const ZERO = { sing: 0, dance: 0, management: 0, fan: 0, speed: 0 };
const LIMITS = { domain: 120, daily: 500 } as const;
type Domain = "car" | "hq" | "villa" | "collection" | "ceo";
type Range = { from: number; to: number };
type StageInput = Range & { stageFrom: number; stageTo: number; itemId: number; itemFrom: number; itemTo: number };

export type CarCostInput = { locale: Locale } & ({ kind: "part"; tier: number; slot: 0 | 1 | 2 | 3 } & Range | { kind: "mod"; part: -1 | 0 | 1 | 2 | 3 } & Range);
export type HqCostInput = { locale: Locale } & ({ kind: "building" } & Range | { kind: "room"; tier: number; slot: number; buildingLevel: number } & Range);
export type VillaCostInput = { locale: Locale } & ({ kind: "suite" } & StageInput | { kind: "staff"; tier: number; staffType: number; base: Pick<StatValues, "sing" | "dance" | "management"> } & Range);
export type CollectionCostInput = { locale: Locale } & ({ kind: "item"; itemId: number } & Range | { kind: "museum"; tier: number; part: "all" | "case" | "wall" | "floor" } & Range);
export type CeoCostInput = { locale: Locale } & ({ kind: "appearance" } & StageInput | { kind: "sport"; tier: number; base: Pick<StatValues, "sing" | "dance" | "management"> } & Range);

function integer(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}
function range(value: Range, min: number, max: number): boolean {
  return integer(value.from, min, max) && integer(value.to, min, max) && value.to > value.from;
}
function cleanStats(value: StatValues): PrivateCostResult["stats"] {
  return { sing: value.sing, dance: value.dance, management: value.management, ...(value.fan ? { fan: value.fan } : {}), ...(value.speed ? { speed: value.speed } : {}) };
}
function safeBase(value: Pick<StatValues, "sing" | "dance" | "management">): boolean {
  return [value.sing, value.dance, value.management].every((item) => integer(item, 0, 1_000_000_000));
}
async function context(domain: Domain, locale: string) {
  if (!isLocale(locale)) throw new Error("invalid_request");
  const user = await requireUser();
  const day = new Date().toISOString().slice(0, 10);
  const [domainAllowed, dailyAllowed] = await Promise.all([
    allow(`cost:${user.id}:${domain}`, LIMITS.domain, 60_000),
    allow(`cost:${user.id}:daily:${day}`, LIMITS.daily, 86_400_000),
  ]);
  if (!domainAllowed || !dailyAllowed) throw new Error("rate_limited");
  return getCostBook(locale);
}

async function carCost(input: CarCostInput): Promise<PrivateCostResult> {
  const book = await context("car", input.locale);
  if (input.kind === "part") {
    if (!range(input, 1, 60) || !integer(input.tier, 1, book.costs.carPart.length) || !integer(input.slot, 0, 3)) throw new Error("invalid_request");
    const selected = book.parts.filter((item) => item.tier === input.tier && (input.slot === 0 || item.slot === ["", "steering", "chip", "sound"][input.slot]));
    if (!selected.length) throw new Error("invalid_request");
    const total = selected.reduce((sum, part) => {
      const value = statSum(book.partStats.filter((row) => row.partId === part.id), input.from, input.to);
      return { ...sum, sing: sum.sing + value.sing, dance: sum.dance + value.dance, management: sum.management + value.management };
    }, { ...ZERO });
    return { totals: multiplyTotals(sumLevels(book.costs.carPart[input.tier - 1] ?? [], input.from, input.to), selected.length), stats: cleanStats(total) };
  }
  if (!range(input, 0, 219) || !integer(input.part, -1, 3)) throw new Error("invalid_request");
  const parts = input.part === -1 ? [0, 1, 2, 3] : [input.part];
  const total = parts.reduce((sum, part) => {
    const value = statSum(book.modStats.filter((row) => row.part === part), input.from, input.to);
    for (const key of Object.keys(sum) as (keyof StatValues)[]) sum[key] += value[key];
    return sum;
  }, { ...ZERO });
  return { totals: modTotals({ items: book.costs.carMod[input.part === -1 ? 0 : input.part] ?? [], classCosts: book.costs.carModClass, classByLevel: book.classByLevel, from: input.from, to: input.to, count: parts.length }), stats: cleanStats(total) };
}

async function hqCost(input: HqCostInput): Promise<PrivateCostResult> {
  const book = await context("hq", input.locale);
  if (input.kind === "building") {
    if (!range(input, 1, 800)) throw new Error("invalid_request");
    const sum = (values: number[]) => sumCurveRange(values, input.from, input.to);
    return { totals: [{ name: book.hq.curve.itemName, amount: sum(book.hq.curve.amounts) }], stats: { sing: sum(book.hq.curve.sing), dance: sum(book.hq.curve.dance), management: sum(book.hq.curve.management) } };
  }
  if (!range(input, 1, 60) || !integer(input.buildingLevel, 1, 800)) throw new Error("invalid_request");
  const rooms = book.hq.rooms.filter((room) => room.tier === input.tier && (input.slot === 0 || room.slot === input.slot));
  if (!rooms.length) throw new Error("invalid_request");
  const percent = statSum(book.hq.roomStats.filter((row) => row.tier === input.tier), 0, input.to);
  for (const key of ["sing", "dance", "management"] as const) percent[key] *= rooms.length;
  const renovation = { sing: book.hq.curve.sing.slice(0, input.buildingLevel).reduce((a, b) => a + b, 0), dance: book.hq.curve.dance.slice(0, input.buildingLevel).reduce((a, b) => a + b, 0), management: book.hq.curve.management.slice(0, input.buildingLevel).reduce((a, b) => a + b, 0) };
  const totals = sumLevels(book.hq.roomCosts[input.tier - 1] ?? [], input.from, input.to).map((item) => ({ ...item, amount: item.amount * (item.itemId !== undefined && book.hq.planItemIds.includes(item.itemId) ? 1 : rooms.length) }));
  return { totals, stats: cleanStats(percent), secondaryStats: percentStats(renovation, percent, "round") };
}

function stageResult(stages: { stage: number; amount: number; advanceMax: number; itemName: string; sing: number; dance: number; management: number }[], children: { stage: number; id: number; levelMax: number; amount: number; itemName: string; sing: number; dance: number; management: number }[], input: StageInput): PrivateCostResult {
  const validFrom = input.stageFrom === 0 || stages.some((item) => item.stage === input.stageFrom);
  const validTo = stages.some((item) => item.stage === input.stageTo);
  if (!validFrom || !validTo || input.stageTo <= input.stageFrom) throw new Error("invalid_request");
  const target = children.filter((item) => item.stage === input.stageTo && item.levelMax > 0);
  const picked = input.itemId === 0 ? target : target.filter((item) => item.id === input.itemId);
  const advance = Math.max(stages.find((item) => item.stage === input.stageTo)?.advanceMax ?? 1, 1);
  const max = (picked[0]?.levelMax ?? 0) * advance;
  if (target.length && (!picked.length || !range({ from: input.itemFrom, to: input.itemTo }, 0, max))) throw new Error("invalid_request");
  const promo = stagePromotionCost(stages, input.stageFrom, input.stageTo);
  const totals: CostTotal[] = promo ? [{ name: stages.find((item) => item.itemName)?.itemName ?? "", amount: promo }] : [];
  const child = picked[0];
  if (child) totals.push({ name: child.itemName, amount: child.amount * (input.itemTo - input.itemFrom) * picked.length });
  const stacked = stages.filter((item) => item.stage >= input.stageFrom && item.stage < input.stageTo).reduce((sum, item) => {
    const rows = children.filter((row) => row.stage === item.stage && row.levelMax > 0);
    for (const key of ["sing", "dance", "management"] as const) sum[key] += Math.max(item.advanceMax, 1) * (item[key] + rows.reduce((n, row) => n + row[key] * row.levelMax, 0));
    return sum;
  }, { sing: 0, dance: 0, management: 0 });
  const levels = Math.max(input.itemTo - input.itemFrom, 0);
  const withLevels = picked.reduce((sum, item) => addStageStats(sum, item, levels), stacked);
  const stars = target.length && input.itemId === 0 && input.itemFrom === 0 && child ? Math.min(Math.floor(input.itemTo / child.levelMax), advance) : 0;
  const targetStage = stages.find((item) => item.stage === input.stageTo) ?? ZERO;
  return { totals, stats: addStageStats(withLevels, targetStage, stars) };
}

async function villaCost(input: VillaCostInput): Promise<PrivateCostResult> {
  const book = await context("villa", input.locale);
  if (input.kind === "suite") return stageResult(book.villa.stages, book.villa.suites.map((item) => ({ ...item, id: item.suite })), input);
  if (!range(input, 1, 60) || !safeBase(input.base)) throw new Error("invalid_request");
  const members = book.villa.staff.filter((item) => item.tier === input.tier && (input.staffType === 0 || item.staffType === input.staffType));
  if (!members.length) throw new Error("invalid_request");
  const percent = statSum(book.villa.staffStats.filter((row) => row.tier === input.tier && (input.staffType === 0 || row.staffType === input.staffType)), input.from, input.to);
  const totals = members.flatMap((item, index) => index ? [] : [{ name: item.itemName, amount: item.amount * members.length }, ...sumLevels(book.villa.staffCosts[item.tier - 1] ?? [], input.from, input.to).map((cost) => ({ ...cost, amount: cost.amount * members.length }))]);
  return { totals, stats: cleanStats(percent), secondaryStats: percentStats(input.base, percent) };
}

async function ceoCost(input: CeoCostInput): Promise<PrivateCostResult> {
  const book = await context("ceo", input.locale);
  if (input.kind === "appearance") return stageResult(book.ceo.stages, book.ceo.outfits.map((item) => ({ ...item, id: item.outfit })), input);
  if (!range(input, 1, 60) || !safeBase(input.base) || !integer(input.tier, 1, book.ceo.sportCosts.length)) throw new Error("invalid_request");
  const sports = book.ceo.sports.filter((item) => item.tier === input.tier);
  if (!sports.length) throw new Error("invalid_request");
  const percent = statSum(book.ceo.sportStats.filter((row) => row.tier === input.tier), input.from, input.to);
  const recruit = sports[0];
  const totals = [{ name: recruit.itemName, amount: recruit.amount * sports.length }, ...sumLevels(book.ceo.sportCosts[input.tier - 1] ?? [], input.from, input.to).map((item) => ({ ...item, amount: item.amount * sports.length }))];
  return { totals, stats: cleanStats(percent), secondaryStats: percentStats(input.base, percent) };
}

async function collectionCost(input: CollectionCostInput): Promise<PrivateCostResult> {
  const book = await context("collection", input.locale);
  if (!range(input, 1, input.kind === "item" ? 65 : 60)) throw new Error("invalid_request");
  if (input.kind === "item") {
    const item = book.collection.items.find((row) => row.id === input.itemId);
    if (!item) throw new Error("invalid_request");
    return { totals: sumLevels([item.cost], input.from, input.to), stats: cleanStats(statDelta(book.collectionStats.filter((row) => row.itemId === item.id), input.from, input.to)) };
  }
  if (!integer(input.tier, 1, book.museum.length) || !["all", "case", "wall", "floor"].includes(input.part)) throw new Error("invalid_request");
  const count = input.part === "all" ? 3 : 1;
  const value = statSum(book.museumStats.filter((row) => row.tier === input.tier).map((row) => ({ level: row.level, sing: row.percent })), input.from, input.to).sing;
  return { totals: multiplyTotals(sumLevels(book.museum[input.tier - 1] ?? [], input.from, input.to), count), stats: museumStats(value, input.part) };
}

function errorCode(error: unknown): PrivateCostError {
  if (error instanceof Error && ["unauthenticated", "invalid_request", "rate_limited"].includes(error.message)) return error.message as PrivateCostError;
  return "server_error";
}

// Ringkasan agregat untuk Vercel logs; input pengguna dan identitas tidak dicatat.
async function run(domain: Domain, calculate: () => Promise<PrivateCostResult>): Promise<PrivateCostResponse> {
  const started = performance.now();
  try {
    const data = await calculate();
    console.info("private_cost_calculation", { domain, outcome: "success", durationMs: Math.round(performance.now() - started) });
    return { ok: true, data };
  } catch (error) {
    const code = errorCode(error);
    console[code === "server_error" ? "error" : "info"]("private_cost_calculation", { domain, outcome: code, durationMs: Math.round(performance.now() - started) });
    return { ok: false, error: code };
  }
}

export async function calculateCarCost(input: CarCostInput): Promise<PrivateCostResponse> {
  return run("car", () => carCost(input));
}
export async function calculateHqCost(input: HqCostInput): Promise<PrivateCostResponse> {
  return run("hq", () => hqCost(input));
}
export async function calculateVillaCost(input: VillaCostInput): Promise<PrivateCostResponse> {
  return run("villa", () => villaCost(input));
}
export async function calculateCollectionCost(input: CollectionCostInput): Promise<PrivateCostResponse> {
  return run("collection", () => collectionCost(input));
}
export async function calculateCeoCost(input: CeoCostInput): Promise<PrivateCostResponse> {
  return run("ceo", () => ceoCost(input));
}
