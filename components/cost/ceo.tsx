"use client";

import { useMemo, useState } from "react";
import { expBetween, sumLevels } from "@/lib/cost-calc";
import type { CostBook } from "@/lib/costs";
import { clamp, invalid, NumberField, panel, result, Segmented, Select, Totals, type CostDict } from "./fields";

type Mode = "stage" | "outfit" | "sport";

const SPORT_MIN = 1;
const SPORT_MAX = 60;

export function CeoPanel({ ceo, C, format }: { ceo: CostBook["ceo"]; C: CostDict; format: (value: number) => string }) {
  const [mode, setMode] = useState<Mode>("stage");
  const [stageFrom, setStageFrom] = useState(0);
  const [stageTo, setStageTo] = useState(ceo.stages.length - 1);
  const [outfitStage, setOutfitStage] = useState(1);
  const [outfit, setOutfit] = useState(1);
  const [tier, setTier] = useState(1);
  const [sportFrom, setSportFrom] = useState(SPORT_MIN);
  const [sportTo, setSportTo] = useState(SPORT_MAX);

  const stageAmounts = ceo.stages.map((item) => item.amount);
  const maxStage = stageAmounts.length - 1;
  // Opsi select outfit memakai semua stage (stage berbiaya 0 tetap punya outfit).
  const stageTotal = expBetween(stageAmounts, stageFrom, stageTo);
  const stageBad = stageTo <= stageFrom;
  const sportBad = sportTo <= sportFrom;

  const outfits = ceo.outfits.filter((item) => item.stage === outfitStage);
  const chosenOutfit = outfits.find((item) => item.outfit === outfit) ?? outfits[0];

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
          { id: "stage", label: C.ceoStage },
          { id: "outfit", label: C.ceoOutfit },
          { id: "sport", label: C.ceoSport },
        ]}
      />

      {mode === "stage" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <NumberField id="cost-ceo-from" text={C.stageFrom} value={stageFrom} min={0} max={maxStage} invalid={stageBad} describedBy={stageBad ? "cost-ceo-error" : undefined} onChange={(v) => setStageFrom(clamp(v, 0, maxStage))} />
            <NumberField id="cost-ceo-to" text={C.stageTo} value={stageTo} min={0} max={maxStage} invalid={stageBad} describedBy={stageBad ? "cost-ceo-error" : undefined} onChange={(v) => setStageTo(clamp(v, 0, maxStage))} />
          </div>

          {stageBad ? (
            <p id="cost-ceo-error" role="status" className={invalid}>
              {C.invalid}
            </p>
          ) : null}

          {stageBad ? null : (
            <div className={result}>
              <Totals
                totals={stageTotal > 0 ? [{ name: ceo.stages[0]?.itemName ?? "", amount: stageTotal }] : []}
                note={C.ceoStageNote}
                empty={C.noCost}
                format={format}
              />
            </div>
          )}
        </>
      ) : mode === "outfit" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Select id="cost-ceo-outfit-stage" text={C.ceoStage} value={outfitStage} onChange={setOutfitStage}>
              {ceo.stages.map((item) => (
                <option key={item.stage} value={item.stage}>
                  {item.name}
                </option>
              ))}
            </Select>
            <Select id="cost-ceo-outfit" text={C.outfit} value={outfit} onChange={setOutfit}>
              {outfits.map((item) => (
                <option key={item.outfit} value={item.outfit}>
                  {item.name}
                </option>
              ))}
            </Select>
          </div>

          <div className={result}>
            <Totals
              totals={chosenOutfit && chosenOutfit.amount > 0 ? [{ name: chosenOutfit.itemName, amount: chosenOutfit.amount }] : []}
              note={C.ceoOutfitNote}
              empty={C.noCost}
              format={format}
            />
          </div>
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
