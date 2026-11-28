export type CostItem = { itemId: number; itemName: string; amounts: Record<string, number> };
export type CostTotal = { itemId?: number; name: string; amount: number };

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

// steps[level - 1] = EXP menuju level itu; level 1 bernilai 0.
export function expBetween(steps: number[], from: number, to: number): number {
  return to > from ? sum(steps.slice(from, to)) : 0;
}

// amounts[star] = item untuk naik dari star itu ke star + 1.
export function starBetween(amounts: number[], from: number, to: number): number {
  return to > from ? sum(amounts.slice(from, to)) : 0;
}

// stars[level - 1] = star minimal untuk level itu. Rentang level butuh kartu
// dari star level awal sampai star level target (naik level hanya di batas star).
export function starCardsForLevels(stars: number[], amounts: number[], from: number, to: number): number {
  return starBetween(amounts, stars[from - 1] ?? 0, stars[to - 1] ?? 0);
}

// classByLevel[level] = id kelas mod. Helper: rentang level tiap kelas supaya
// pemain yang hanya tahu kelas di mod kendaraan tidak perlu tahu nomor level.
export function classLevels(classByLevel: number[]): Map<number, { from: number; to: number }> {
  const out = new Map<number, { from: number; to: number }>();
  classByLevel.forEach((id, level) => {
    const range = out.get(id);
    if (range) range.to = level;
    else out.set(id, { from: level, to: level });
  });
  return out;
}

// Stage vila/tampilan: amount = biaya per bintang, advanceMax = batas bintang.
// Stage A -> B memakai baris stage A..B-1; bintang terakhir A naik ke A+1.
export function stagePromotionCost(stages: { amount: number; advanceMax: number }[], from: number, to: number): number {
  if (to <= from) return 0;
  let amount = 0;
  for (let stage = Math.max(from, 1); stage < to; stage++) {
    const row = stages[stage - 1];
    if (row) amount += row.amount * row.advanceMax;
  }
  return amount;
}

export function sumLevels(items: CostItem[], from: number, to: number): CostTotal[] {
  if (to <= from) return [];
  return items
    .map((item) => {
      let amount = 0;
      for (let level = from + 1; level <= to; level++) amount += item.amounts[level] ?? 0;
      return { itemId: item.itemId, name: item.itemName, amount };
    })
    .filter((item) => item.amount > 0);
}

export function modTotals({
  items,
  classCosts,
  classByLevel,
  from,
  to,
  count = 1,
}: {
  items: CostItem[];
  classCosts: Record<number, CostItem[]>;
  classByLevel: number[];
  from: number;
  to: number;
  // Jumlah bagian yang diupgrade paralel (mis. 4 part mobil). Hanya biaya
  // level yang dikali; biaya kelas tetap sekali per naik kelas.
  count?: number;
}): CostTotal[] {
  if (to <= from) return [];
  const totals = new Map<number, CostTotal>();
  const add = (item: CostItem, amount: number) => {
    const current = totals.get(item.itemId);
    if (current) current.amount += amount;
    else totals.set(item.itemId, { itemId: item.itemId, name: item.itemName, amount });
  };

  for (const item of items) {
    let amount = 0;
    for (let level = from + 1; level <= to; level++) amount += item.amounts[level] ?? 0;
    if (amount > 0) add(item, amount * count);
  }

  // Tiap pindah kelas, biaya kelas baru (level 0) ikut dihitung sekali.
  for (let level = from + 1; level <= to; level++) {
    const classId = classByLevel[level];
    if (classId === classByLevel[level - 1]) continue;
    for (const item of classCosts[classId] ?? []) add(item, item.amounts[0] ?? 0);
  }

  return [...totals.values()];
}
