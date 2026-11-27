"use client";

import { useMemo, useState } from "react";
import { sumLevels } from "@/lib/cost-calc";
import type { CostItem } from "@/lib/costs";
import { clamp, invalid, label, NumberField, panel, result, Segmented, Select, Totals, type CostDict } from "./fields";

const MIN = 1;
const MAX = 60;
const PARTS = 3;

type Part = "all" | "case" | "wall" | "floor";

export function MuseumPanel({
  tiers,
  C,
  format,
}: {
  tiers: CostItem[][];
  C: CostDict;
  format: (value: number) => string;
}) {
  const [part, setPart] = useState<Part>("all");
  const [tier, setTier] = useState(1);
  const [from, setFrom] = useState(MIN);
  const [to, setTo] = useState(MAX);

  // Biaya tiap bagian identik di config; pilihan bagian hanya untuk kejelasan.
  const partName =
    part === "all" ? C.museumAllParts : part === "case" ? C.museumPart1 : part === "wall" ? C.museumPart2 : C.museumPart3;
  const totals = useMemo(() => {
    const count = part === "all" ? PARTS : 1;
    return sumLevels(tiers[tier - 1] ?? [], from, to).map((item) => ({ ...item, amount: item.amount * count }));
  }, [tiers, tier, from, to, part]);
  const bad = to <= from;

  return (
    <section aria-label={C.tabMuseum} className={panel}>
      <p className={`${label} mb-2`}>{C.tabMuseum}</p>
      <Segmented
        text={C.tabMuseum}
        value={part}
        onChange={setPart}
        options={[
          { id: "all", label: C.museumAllParts },
          { id: "case", label: C.museumPart1 },
          { id: "wall", label: C.museumPart2 },
          { id: "floor", label: C.museumPart3 },
        ]}
      />
      <Select id="cost-museum-tier" text={C.museumGallery} value={tier} onChange={setTier}>
        {tiers.map((_, index) => (
          <option key={index} value={index + 1}>
            {C.museumGallery} {index + 1}
          </option>
        ))}
      </Select>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <NumberField id="cost-museum-from" text={C.levelFrom} value={from} min={MIN} max={MAX} invalid={bad} describedBy={bad ? "cost-museum-error" : undefined} onChange={(v) => setFrom(clamp(v, MIN, MAX))} />
        <NumberField id="cost-museum-to" text={C.levelTo} value={to} min={MIN} max={MAX} invalid={bad} describedBy={bad ? "cost-museum-error" : undefined} onChange={(v) => setTo(clamp(v, MIN, MAX))} />
      </div>

      {bad ? (
        <p id="cost-museum-error" role="status" className={invalid}>
          {C.invalid}
        </p>
      ) : null}

      {bad ? null : (
        <div className={result}>
          <Totals totals={totals} note={`${partName} · ${C.museumNote}`} empty={C.noCost} format={format} />
        </div>
      )}
    </section>
  );
}
