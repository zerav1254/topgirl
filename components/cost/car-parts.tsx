"use client";

import { useMemo, useState } from "react";
import { statSum, sumLevels } from "@/lib/cost-calc";
import type { CostBook } from "@/lib/costs";
import { clamp, heading, invalid, NumberField, panel, result, Select, Stats, Totals, type CostDict } from "./fields";

const LEVEL_MIN = 1;
const LEVEL_MAX = 60;

type Slot = CostBook["parts"][number]["slot"];

export function CarPartsPanel({
  parts,
  partStats,
  costs,
  C,
  format,
  formatPct,
}: {
  parts: CostBook["parts"];
  partStats: CostBook["partStats"];
  costs: CostBook["costs"]["carPart"];
  C: CostDict;
  format: (value: number) => string;
  formatPct: (value: number) => string;
}) {
  const [tier, setTier] = useState(parts[0]?.tier ?? 1);
  // 0 = semua slot di tier ini; selain itu indeks slot + 1.
  const [slot, setSlot] = useState(0);
  const [from, setFrom] = useState(LEVEL_MIN);
  const [to, setTo] = useState(LEVEL_MAX);

  const tiers = useMemo(() => [...new Set(parts.map((part) => part.tier))].sort((a, b) => a - b), [parts]);
  const tierParts = parts.filter((part) => part.tier === tier);
  const slots = [...new Set(tierParts.map((part) => part.slot))];
  const slotCount = slot === 0 ? Math.max(slots.length, 1) : 1;
  const totals = useMemo(
    () =>
      sumLevels(costs[tier - 1] ?? [], from, to).map((item) => ({
        ...item,
        amount: item.amount * slotCount,
      })),
    [costs, tier, from, to, slotCount],
  );
  const bad = to <= from;

  // Inti: nilai tabel = tambahan per level, jadi stat dijumlahkan dalam rentang.
  const stats = useMemo(() => {
    const selected = slot === 0 ? tierParts : [tierParts[slot - 1]].filter(Boolean);
    const total = { sing: 0, dance: 0, management: 0 };
    for (const part of selected) {
      const sum = statSum(
        partStats.filter((row) => row.partId === part.id),
        from,
        to,
      );
      total.sing += sum.sing;
      total.dance += sum.dance;
      total.management += sum.management;
    }
    return total;
  }, [tierParts, slot, partStats, from, to]);

  const statRows = [
    { label: C.statSing, value: stats.sing },
    { label: C.statDance, value: stats.dance },
    { label: C.statManage, value: stats.management },
  ]
    .filter((row) => row.value > 0)
    .map((row) => ({ label: row.label, value: `+${formatPct(row.value)}%` }));

  // Tier huruf diambil dari nama game: "Setir (A+)" -> "A+".
  const tierLabel = (name: string) => name.match(/\(([^)]+)\)/)?.[1] ?? "";
  const slotLabels: Record<Slot, string> = {
    steering: C.slotSteering,
    chip: C.slotChip,
    sound: C.slotSound,
  };


  return (
    <section aria-label={C.tabParts} className={panel}>
      <h2 className={`${heading} mb-3`}>{C.tabParts}</h2>
      <div className="grid grid-cols-2 gap-3">
        <Select id="cost-part-tier" text={C.tier} value={tier} onChange={setTier}>
          {tiers.map((value) => (
            <option key={value} value={value}>
              {tierLabel(parts.find((part) => part.tier === value)?.name ?? "") || `${C.tier} ${value}`}
            </option>
          ))}
        </Select>
        <Select id="cost-part-slot" text={C.part} value={slot} onChange={setSlot}>
          <option value={0}>{C.partAll}</option>
          {slots.map((value, index) => (
            <option key={value} value={index + 1}>
              {slotLabels[value]}
            </option>
          ))}
        </Select>
        <NumberField id="cost-part-from" text={C.levelFrom} value={from} min={LEVEL_MIN} max={LEVEL_MAX} invalid={bad} describedBy={bad ? "cost-part-error" : undefined} onChange={(v) => setFrom(clamp(v, LEVEL_MIN, LEVEL_MAX))} />
        <NumberField id="cost-part-to" text={C.levelTo} value={to} min={LEVEL_MIN} max={LEVEL_MAX} invalid={bad} describedBy={bad ? "cost-part-error" : undefined} onChange={(v) => setTo(clamp(v, LEVEL_MIN, LEVEL_MAX))} />
      </div>

      {bad ? (
        <p id="cost-part-error" role="status" className={invalid}>
          {C.invalid}
        </p>
      ) : null}

      {bad ? null : (
        <div className={result}>
          <Totals totals={totals} note={C.partNote} empty={C.noCost} format={format} />
          <Stats title={C.statsTitle} rows={statRows} note={C.coreStatNote} />
        </div>
      )}
    </section>
  );
}
