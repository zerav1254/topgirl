"use client";

import { useMemo, useState } from "react";
import { sumLevels } from "@/lib/cost-calc";
import type { CostItem } from "@/lib/costs";
import { clamp, invalid, NumberField, panel, result, Select, Totals, type CostDict } from "./fields";

const MIN = 1;
const MAX = 60;

export function MuseumPanel({
  tiers,
  C,
  format,
}: {
  tiers: CostItem[][];
  C: CostDict;
  format: (value: number) => string;
}) {
  const [tier, setTier] = useState(1);
  const [from, setFrom] = useState(MIN);
  const [to, setTo] = useState(MAX);

  const totals = useMemo(() => sumLevels(tiers[tier - 1] ?? [], from, to), [tiers, tier, from, to]);
  const bad = to <= from;

  return (
    <section aria-label={C.tabMuseum} className={panel}>
      <Select id="cost-museum-tier" text={C.tier} value={tier} onChange={setTier}>
        {tiers.map((_, index) => (
          <option key={index} value={index + 1}>
            {C.tier} {index + 1}
          </option>
        ))}
      </Select>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <NumberField id="cost-museum-from" text={C.levelFrom} value={from} min={MIN} max={MAX} invalid={bad} describedBy="cost-museum-error" onChange={(v) => setFrom(clamp(v, MIN, MAX))} />
        <NumberField id="cost-museum-to" text={C.levelTo} value={to} min={MIN} max={MAX} invalid={bad} describedBy="cost-museum-error" onChange={(v) => setTo(clamp(v, MIN, MAX))} />
      </div>

      {bad ? (
        <p id="cost-museum-error" role="status" className={invalid}>
          {C.invalid}
        </p>
      ) : null}

      <div className={result}>
        <Totals totals={totals} note={C.museumNote} empty={C.noCost} format={format} />
      </div>
    </section>
  );
}
