"use client";

import { useMemo, useState } from "react";
import { peakStageBetween } from "@/lib/cost-calc";
import type { CostBook } from "@/lib/costs";
import { clamp, heading, invalid, NumberField, panel, result, Stats, Totals, type CostDict } from "./fields";

const PEAK_MIN = 0;
const PEAK_MAX = 1000;
// Biaya tetap di game: 100 foto pribadi artis per level puncak.
const PHOTOS_PER_LEVEL = 100;

type PeakArtist = CostBook["artists"][number];

export function PeakPanel({
  peak,
  artist,
  C,
  format,
  formatPct,
}: {
  peak: CostBook["peak"];
  artist?: PeakArtist;
  C: CostDict;
  format: (value: number) => string;
  formatPct: (value: number) => string;
}) {
  const [from, setFrom] = useState(PEAK_MIN);
  const [to, setTo] = useState(PEAK_MAX);
  const bad = to <= from;

  const levels = Math.max(to - from, 0);
  // Posisi: flat per level (PeakLevel × nilai generasi + posisi).
  const boost = artist
    ? peak.positions.find((row) => row.generation === artist.generation && row.position === artist.position)
    : undefined;
  const flat = {
    sing: levels * (boost?.sing ?? 0),
    dance: levels * (boost?.dance ?? 0),
    management: levels * (boost?.management ?? 0),
  };
  // Stage: persen ambang, dijumlahkan dalam rentang level.
  const pct = useMemo(() => peakStageBetween(peak.stages, from, to), [peak.stages, from, to]);

  const statRows = [
    { label: C.statSing, stat: "sing" as const, value: flat.sing },
    { label: C.statDance, stat: "dance" as const, value: flat.dance },
    { label: C.statManage, stat: "manage" as const, value: flat.management },
  ]
    .filter((row) => row.value > 0)
    .map((row) => ({ ...row, value: `+${format(row.value)}` }));
  const pctRows = [
    { label: C.statSing, stat: "sing" as const, value: pct.sing },
    { label: C.statDance, stat: "dance" as const, value: pct.dance },
    { label: C.statManage, stat: "manage" as const, value: pct.management },
  ]
    .filter((row) => row.value > 0)
    .map((row) => ({ ...row, value: `+${formatPct(row.value)}%` }));

  const totals = artist?.photoItem && levels > 0
    ? [{ itemId: artist.photoItem, name: `${C.peakPhoto} ${artist.name}`, amount: levels * PHOTOS_PER_LEVEL }]
    : [];

  return (
    <section aria-label={C.peakTitle} className={panel}>
      <h2 className={heading}>{C.peakTitle}</h2>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <NumberField id="cost-peak-from" text={C.levelFrom} value={from} min={PEAK_MIN} max={PEAK_MAX} invalid={bad} describedBy={bad ? "cost-peak-error" : undefined} onChange={(v) => setFrom(clamp(v, PEAK_MIN, PEAK_MAX))} />
        <NumberField id="cost-peak-to" text={C.levelTo} value={to} min={PEAK_MIN} max={PEAK_MAX} invalid={bad} describedBy={bad ? "cost-peak-error" : undefined} onChange={(v) => setTo(clamp(v, PEAK_MIN, PEAK_MAX))} />
      </div>

      {bad ? (
        <p id="cost-peak-error" role="status" className={invalid}>
          {C.invalid}
        </p>
      ) : (
        <div className={result}>
          <Totals totals={totals} note={C.peakNote} empty={C.noCost} format={format} />
          <Stats title={C.statsTitle} rows={statRows} note={C.statsNote} />
          <Stats title={C.peakStage} rows={pctRows} note={C.peakStageNote} />
        </div>
      )}
    </section>
  );
}
