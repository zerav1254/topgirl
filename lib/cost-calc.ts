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

export type StatValues = { sing: number; dance: number; management: number; fan: number; speed: number };
// Baris stat dari DB: fan/speed hanya ada di tabel mod, bukan komponen.
export type LevelStat = { level: number } & Partial<StatValues>;

const ZERO_STAT: StatValues = { sing: 0, dance: 0, management: 0, fan: 0, speed: 0 };

// Komponen mobil menyimpan total kumulatif per level -> pakai selisih target - awal.
export function statDelta(rows: LevelStat[], from: number, to: number): StatValues {
  const at = (level: number) => rows.find((row) => row.level === level) ?? ZERO_STAT;
  const a = at(from);
  const b = at(to);
  return {
    sing: (b.sing ?? 0) - (a.sing ?? 0),
    dance: (b.dance ?? 0) - (a.dance ?? 0),
    management: (b.management ?? 0) - (a.management ?? 0),
    fan: (b.fan ?? 0) - (a.fan ?? 0),
    speed: (b.speed ?? 0) - (a.speed ?? 0),
  };
}

// Inti mobil menyimpan tambahan per level -> jumlahkan level dari + 1 sampai target.
export function statSum(rows: LevelStat[], from: number, to: number): StatValues {
  const total = { ...ZERO_STAT };
  if (to <= from) return total;
  for (const row of rows) {
    if (row.level <= from || row.level > to) continue;
    total.sing += row.sing ?? 0;
    total.dance += row.dance ?? 0;
    total.management += row.management ?? 0;
    total.fan += row.fan ?? 0;
    total.speed += row.speed ?? 0;
  }
  return total;
}

// Persen buff stage peak level bersifat ambang: semua baris dengan
// stageLevel <= level dijumlahkan. Nilai mentah (dibagi 100 untuk tampil persen).
export type PeakStageRow = { stageLevel: number; attributeType: number; allPercent: number; stylePercent: number };
export function peakStageBetween(rows: PeakStageRow[], from: number, to: number): StatValues {
  const total = { ...ZERO_STAT };
  if (to <= from) return total;
  for (const row of rows) {
    if (row.stageLevel <= from || row.stageLevel > to) continue;
    const key = row.attributeType === 1 ? "sing" : row.attributeType === 2 ? "dance" : row.attributeType === 3 ? "management" : null;
    if (key) total[key] += row.allPercent + row.stylePercent;
  }
  return total;
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
