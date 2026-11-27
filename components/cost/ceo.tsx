"use client";

import { useMemo, useState } from "react";
import { expBetween, sumLevels } from "@/lib/cost-calc";
import type { CostBook } from "@/lib/costs";
import { clamp, invalid, NumberField, panel, result, Segmented, Select, Totals, type CostDict, type Total } from "./fields";

type Mode = "appearance" | "sport";

const SPORT_MIN = 1;
const SPORT_MAX = 60;

export function CeoPanel({ ceo, C, format }: { ceo: CostBook["ceo"]; C: CostDict; format: (value: number) => string }) {
  const [mode, setMode] = useState<Mode>("appearance");
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

  // Promosi = jumlah biaya stage yang dilewati (stage > from dan <= to).
  const promoAmount = useMemo(
    () => (appearanceBad ? 0 : expBetween(ceo.stages.map((item) => item.amount), stageFrom, stageTo)),
    [appearanceBad, ceo.stages, stageFrom, stageTo],
  );
  const promoItem = ceo.stages.find((item) => item.itemName)?.itemName ?? "";
  const targetOutfits = ceo.outfits.filter((item) => item.stage === stageTo);
  const outfit = (outfitId === 0 ? targetOutfits[0] : targetOutfits.find((item) => item.outfit === outfitId)) ?? targetOutfits[0];
  const outfitCount = outfitId === 0 ? Math.max(targetOutfits.length, 1) : 1;
  const outfitMax = outfit?.levelMax ?? 10;
  const outfitBad = outfitTo <= outfitFrom || outfitTo > outfitMax;
  // Biaya aksesori konstan per level (ClassUpgradeCost), jadi amount x jumlah level x jumlah outfit.
  const outfitAmount = outfitBad ? 0 : outfit ? outfit.amount * (outfitTo - outfitFrom) * outfitCount : 0;
  const outfitItem = outfit?.itemName ?? "";
  const totals = [
    promoAmount > 0 && promoItem ? { name: promoItem, amount: promoAmount } : null,
    outfitAmount > 0 && outfitItem ? { name: outfitItem, amount: outfitAmount } : null,
  ].filter((item): item is Total => item !== null);

  const sportTotals = useMemo(
    () => sumLevels(ceo.sportCosts[tier - 1] ?? [], sportFrom, sportTo),
    [ceo.sportCosts, tier, sportFrom, sportTo],
  );

  return (
    <section aria-label={C.tabCeo} className={panel}>
      <Segmented
        text={C.tabCeo}
        value={mode}
        onChange={setMode}
        options={[
          { id: "appearance", label: C.ceoAppearance },
          { id: "sport", label: C.ceoSport },
        ]}
      />

      {mode === "appearance" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
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
                const max = ceo.outfits.find((item) => item.stage === value && item.outfit === (outfitId === 0 ? 1 : outfitId))?.levelMax ?? 10;
                setOutfitTo((current) => Math.min(current, max));
              }}
            >
              {ceo.stages.map((item) => (
                <option key={item.stage} value={item.stage}>
                  {item.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-3">
            <Select id="cost-ceo-outfit" text={C.ceoAppearance} value={outfitId} onChange={setOutfitId}>
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

          {appearanceBad || outfitBad ? (
            <p id="cost-ceo-error" role="status" className={invalid}>
              {C.invalid}
            </p>
          ) : (
            <div className={result}>
              <Totals totals={totals} note={C.ceoAppearanceNote} empty={C.noCost} format={format} />
            </div>
          )}
        </>
      ) : (
        <>
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
            </div>
          )}
        </>
      )}
    </section>
  );
}
