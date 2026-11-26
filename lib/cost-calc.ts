export type CostItem = { itemId: number; itemName: string; amounts: Record<string, number> };
export type CostTotal = { name: string; amount: number };

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

// steps[level - 1] = EXP menuju level itu; level 1 bernilai 0.
export function expBetween(steps: number[], from: number, to: number): number {
  return to > from ? sum(steps.slice(from, to)) : 0;
}

// amounts[star] = item untuk naik dari star itu ke star + 1.
export function starBetween(amounts: number[], from: number, to: number): number {
  return to > from ? sum(amounts.slice(from, to)) : 0;
}

export function sumLevels(items: CostItem[], from: number, to: number): CostTotal[] {
  if (to <= from) return [];
  return items
    .map((item) => {
      let amount = 0;
      for (let level = from + 1; level <= to; level++) amount += item.amounts[level] ?? 0;
      return { name: item.itemName, amount };
    })
    .filter((item) => item.amount > 0);
}

export function modTotals({
  items,
  classCosts,
  classByLevel,
  from,
  to,
}: {
  items: CostItem[];
  classCosts: Record<number, CostItem[]>;
  classByLevel: number[];
  from: number;
  to: number;
}): CostTotal[] {
  if (to <= from) return [];
  const totals = new Map<string, number>();
  const add = (name: string, amount: number) => totals.set(name, (totals.get(name) ?? 0) + amount);

  for (const item of items) {
    let amount = 0;
    for (let level = from + 1; level <= to; level++) amount += item.amounts[level] ?? 0;
    if (amount > 0) add(item.itemName, amount);
  }

  // Tiap pindah kelas, biaya kelas baru (level 0) ikut dihitung sekali.
  for (let level = from + 1; level <= to; level++) {
    const classId = classByLevel[level];
    if (classId === classByLevel[level - 1]) continue;
    for (const item of classCosts[classId] ?? []) add(item.itemName, item.amounts[0] ?? 0);
  }

  return [...totals].map(([name, amount]) => ({ name, amount }));
}
