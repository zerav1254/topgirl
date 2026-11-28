"use client";

import { useMemo, useState } from "react";
import { stagePromotionCost, statSum, sumLevels } from "@/lib/cost-calc";
import type { CostBook } from "@/lib/costs";
import { clamp, heading, invalid, NumberField, panel, result, Select, Stats, Totals, type CostDict, type Total } from "./fields";

const SPORT_MIN = 1;
const SPORT_MAX = 60;

export function CeoPanel({
  ceo,
  C,
  format,
  formatPct,
}: {
  ceo: CostBook["ceo"];
  C: CostDict;
  format: (value: number) => string;
  formatPct: (value: number) => string;
}) {
  // Helper tampilan: pakai nama stage dari game, bukan nomor. 0 = belum punya.
  const [stageFrom, setStageFrom] = useState(0);
  const [stageTo, setStageTo] = useState(ceo.stages.at(-1)?.stage ?? 0);
  const [outfitId, setOutfitId] = useState(1);
  const [outfitFrom, setOutfitFrom] = useState(0);
  const [outfitTo, setOutfitTo] = useState(10);
  const [tier, setTier] = useState(1);
  const [sportFrom, setSportFrom] = useState(SPORT_MIN);
  const [sportTo, setSportTo] = useState(SPORT_MAX);

  const appearanceBad = stageTo <= stageFrom;
  const sportBad = sportTo <= sportFrom;

  // Promosi: tiap stage butuh advanceMax bintang; amount = biaya per bintang.
  // Stage A -> B memakai stage A..B-1 (bintang terakhir A menaikkan ke A+1).
  const promoAmount = useMemo(
    () => (appearanceBad ? 0 : stagePromotionCost(ceo.stages, stageFrom, stageTo)),
    [appearanceBad, ceo.stages, stageFrom, stageTo],
  );
  const promoItem = ceo.stages.find((item) => item.itemName)?.itemName ?? "";
  // Stage 6 ("Tertinggi") tidak punya outfit yang bisa di-upgrade (level_max 0).
  const targetOutfits = ceo.outfits.filter((item) => item.stage === stageTo && item.levelMax > 0);
  const hasOutfits = targetOutfits.length > 0;
  const selectedOutfitId = outfitId === 0 || targetOutfits.some((item) => item.outfit === outfitId) ? outfitId : 0;
  const outfit = (selectedOutfitId === 0 ? targetOutfits[0] : targetOutfits.find((item) => item.outfit === selectedOutfitId)) ?? targetOutfits[0];
  const outfitCount = selectedOutfitId === 0 ? Math.max(targetOutfits.length, 1) : 1;
  // LevelMax = level per peningkatan; AdvanceMax = berapa kali peningkatan
  // diulang sebelum naik stage. Total level outfit = LevelMax × AdvanceMax.
  const advanceOf = (stage: number) => Math.max(ceo.stages.find((item) => item.stage === stage)?.advanceMax ?? 1, 1);
  const outfitMax = (outfit?.levelMax ?? 0) * advanceOf(stageTo);
  const outfitBad = hasOutfits && (outfitTo <= outfitFrom || outfitTo > outfitMax);
  // Biaya aksesori konstan per level (ClassUpgradeCost), jadi amount x jumlah level x jumlah outfit.
  const outfitAmount = outfitBad || !outfit ? 0 : outfit.amount * (outfitTo - outfitFrom) * outfitCount;
  const outfitItem = outfit?.itemName ?? "";
  const totals = [
    promoAmount > 0 && promoItem ? { name: promoItem, amount: promoAmount } : null,
    outfitAmount > 0 && outfitItem ? { name: outfitItem, amount: outfitAmount } : null,
  ].filter((item): item is Total => item !== null);

  // Stat CEO menumpuk per bintang (peningkatan): tiap bintang memberi stat
  // stage + 4 outfit sampai LevelMax, diulang AdvanceMax kali.
  const stackStats = ceo.stages
    .filter((item) => item.stage >= stageFrom && item.stage < stageTo)
    .reduce(
      (sum, item) => {
        const advance = Math.max(item.advanceMax, 1);
        const outfits = ceo.outfits.filter((row) => row.stage === item.stage && row.levelMax > 0);
        const perStar = (key: "sing" | "dance" | "management") =>
          outfits.reduce((acc, row) => acc + row[key] * row.levelMax, 0);
        return {
          sing: sum.sing + advance * (item.sing + perStar("sing")),
          dance: sum.dance + advance * (item.dance + perStar("dance")),
          management: sum.management + advance * (item.management + perStar("management")),
        };
      },
      { sing: 0, dance: 0, management: 0 },
    );
  const outfitLevels = Math.max(outfitTo - outfitFrom, 0);
  const pickedOutfits = selectedOutfitId === 0 ? targetOutfits : outfit ? [outfit] : [];
  const outfitStats = pickedOutfits.reduce(
    (sum, item) => ({
      sing: sum.sing + item.sing * outfitLevels,
      dance: sum.dance + item.dance * outfitLevels,
      management: sum.management + item.management * outfitLevels,
    }),
    { sing: 0, dance: 0, management: 0 },
  );
  // Bintang stage terpilih baru selesai kalau 4 outfit dituntaskan sampai LevelMax.
  const outfitLevelMax = outfit?.levelMax ?? 0;
  const stars =
    hasOutfits && selectedOutfitId === 0 && outfitFrom === 0 && outfitLevelMax > 0
      ? Math.min(Math.floor(outfitTo / outfitLevelMax), advanceOf(stageTo))
      : 0;
  const targetStage = ceo.stages.find((item) => item.stage === stageTo);
  const appearanceTotal = {
    sing: stackStats.sing + outfitStats.sing + (targetStage?.sing ?? 0) * stars,
    dance: stackStats.dance + outfitStats.dance + (targetStage?.dance ?? 0) * stars,
    management: stackStats.management + outfitStats.management + (targetStage?.management ?? 0) * stars,
  };

  const statRows = (stats: { sing: number; dance: number; management: number }) =>
    [
      { label: C.statSing, value: stats.sing },
      { label: C.statDance, value: stats.dance },
      { label: C.statManage, value: stats.management },
    ]
      .filter((row) => row.value > 0)
      .map((row) => ({ label: row.label, value: `+${format(row.value)}` }));

  // Olahraga CEO menambah persen (SingingPer dkk), bukan flat.
  const pctRows = (stats: { sing: number; dance: number; management: number }) =>
    [
      { label: C.statSing, value: stats.sing },
      { label: C.statDance, value: stats.dance },
      { label: C.statManage, value: stats.management },
    ]
      .filter((row) => row.value > 0)
      .map((row) => ({ label: row.label, value: `+${formatPct(row.value)}%` }));

  // Tiga jenis olahraga per tier berbagi tabel biaya; stat digabung per jenis,
  // jadi biaya level & rekrut dihitung per jenis.
  const tierSports = ceo.sports.filter((item) => item.tier === tier);
  const sportCount = Math.max(tierSports.length, 1);
  const recruit = tierSports[0];
  const sportTotals: Total[] = [
    ...(recruit && recruit.amount > 0 && recruit.itemName ? [{ name: recruit.itemName, amount: recruit.amount * sportCount }] : []),
    ...sumLevels(ceo.sportCosts[tier - 1] ?? [], sportFrom, sportTo).map((item) => ({
      ...item,
      amount: item.amount * sportCount,
    })),
  ];

  // Jenis olahraga dalam satu tier berbagi biaya; tiap jenis menambah satu stat.
  const sportStats = statSum(
    ceo.sportStats.filter((row) => row.tier === tier),
    sportFrom,
    sportTo,
  );
  // Persen olahraga mengalikan stat outfit CEO (pilihan Stage/Outfit); game
  // menampilkan hasil flat-nya (dibulatkan ke bawah).
  const sportFlat = {
    sing: Math.floor((appearanceTotal.sing * sportStats.sing) / 10000),
    dance: Math.floor((appearanceTotal.dance * sportStats.dance) / 10000),
    management: Math.floor((appearanceTotal.management * sportStats.management) / 10000),
  };

  return (
    <section aria-label={C.tabCeo} className={panel}>
      <h2 className="sr-only">{C.tabCeo}</h2>
      <h2 className={heading}>{C.ceoAppearance}</h2>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Select id="cost-ceo-from" text={C.appearanceFrom} value={stageFrom} onChange={setStageFrom}>
          <option value={0}>{C.stageNone}</option>
          {ceo.stages.map((item) => (
            <option key={item.stage} value={item.stage}>
              {item.name}
            </option>
          ))}
        </Select>
        <Select
          id="cost-ceo-to"
          text={C.appearanceTo}
          value={stageTo}
          onChange={(value) => {
            setStageTo(value);
            const target = ceo.outfits.find((item) => item.stage === value && item.levelMax > 0);
            const advance = Math.max(ceo.stages.find((item) => item.stage === value)?.advanceMax ?? 1, 1);
            // Default tampil sampai total level (LevelMax × peningkatan) stage terpilih.
            const max = target ? target.levelMax * advance : 0;
            if (max > 0) {
              setOutfitFrom(0);
              setOutfitTo(max);
            }
          }}
        >
          {ceo.stages.map((item) => (
            <option key={item.stage} value={item.stage}>
              {item.name}
            </option>
          ))}
        </Select>
      </div>

      {hasOutfits ? (
        <>
          <div className="mt-3">
            <Select id="cost-ceo-outfit" text={C.ceoAppearance} value={selectedOutfitId} onChange={setOutfitId}>
              <option value={0}>{C.ceoAllOutfits}</option>
              {targetOutfits.map((item) => (
                <option key={item.outfit} value={item.outfit}>
                  {item.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <NumberField id="cost-ceo-outfit-from" text={C.levelFrom} value={outfitFrom} min={0} max={outfitMax} invalid={outfitBad} describedBy={outfitBad ? "cost-ceo-error" : undefined} onChange={(v) => setOutfitFrom(clamp(v, 0, outfitMax))} />
            <NumberField id="cost-ceo-outfit-to" text={C.levelTo} value={outfitTo} min={0} max={outfitMax} invalid={outfitBad} describedBy={outfitBad ? "cost-ceo-error" : undefined} onChange={(v) => setOutfitTo(clamp(v, 0, outfitMax))} />
          </div>
        </>
      ) : null}

      {appearanceBad || outfitBad ? (
        <p id="cost-ceo-error" role="status" className={invalid}>
          {C.invalid}
        </p>
      ) : (
        <div className={result}>
          <Totals totals={totals} note={hasOutfits ? C.ceoAppearanceNote : undefined} empty={C.noCost} format={format} />
          <Stats title={C.statsTitle} rows={statRows(appearanceTotal)} note={C.statsNote} />
        </div>
      )}

      <h2 className={`${heading} mt-6`}>{C.ceoSport}</h2>

      <Select id="cost-ceo-sport-tier" text={C.tier} value={tier} onChange={setTier}>
        {ceo.sportCosts.map((_, index) => (
          <option key={index} value={index + 1}>
            {C.tier} {index + 1}
          </option>
        ))}
      </Select>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <NumberField id="cost-ceo-sport-from" text={C.levelFrom} value={sportFrom} min={SPORT_MIN} max={SPORT_MAX} invalid={sportBad} describedBy={sportBad ? "cost-ceo-sport-error" : undefined} onChange={(v) => setSportFrom(clamp(v, SPORT_MIN, SPORT_MAX))} />
        <NumberField id="cost-ceo-sport-to" text={C.levelTo} value={sportTo} min={SPORT_MIN} max={SPORT_MAX} invalid={sportBad} describedBy={sportBad ? "cost-ceo-sport-error" : undefined} onChange={(v) => setSportTo(clamp(v, SPORT_MIN, SPORT_MAX))} />
      </div>

      {sportBad ? (
        <p id="cost-ceo-sport-error" role="status" className={invalid}>
          {C.invalid}
        </p>
      ) : null}

      {sportBad ? null : (
        <div className={result}>
          <Totals totals={sportTotals} note={C.ceoSportNote} empty={C.noCost} format={format} />
          <Stats title={C.statsTitle} rows={pctRows(sportStats)} note={C.ceoSportStatNote} />
          <Stats title={C.ceoSportGain} rows={statRows(sportFlat)} note={C.ceoSportGainNote} />
        </div>
      )}
    </section>
  );
}
