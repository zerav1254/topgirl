"use client";

import { useMemo, useState } from "react";
import { expBetween, sumLevels } from "@/lib/cost-calc";
import type { CostBook } from "@/lib/costs";
import { clamp, invalid, NumberField, panel, result, Segmented, Select, Totals, type CostDict, type Total } from "./fields";

type Mode = "villa" | "staff";

const STAFF_MIN = 1;
const STAFF_MAX = 60;

export function VillaPanel({ villa, C, format }: { villa: CostBook["villa"]; C: CostDict; format: (value: number) => string }) {
  const [mode, setMode] = useState<Mode>("villa");
  // Helper stage: pakai nama stage dari game. 0 = belum punya vila.
  const [stageFrom, setStageFrom] = useState(0);
  const [stageTo, setStageTo] = useState(villa.stages.at(-1)?.stage ?? 0);
  const [staffId, setStaffId] = useState(villa.staff[0]?.id ?? 0);
  const [staffFrom, setStaffFrom] = useState(STAFF_MIN);
  const [staffTo, setStaffTo] = useState(STAFF_MAX);

  const stageBad = stageTo <= stageFrom;
  const staffBad = staffTo <= staffFrom;

  // Naik stage = jumlah biaya stage yang dilewati (stage > from dan <= to).
  const stageAmount = useMemo(
    () => (stageBad ? 0 : expBetween(villa.stages.map((item) => item.amount), stageFrom, stageTo)),
    [stageBad, villa.stages, stageFrom, stageTo],
  );
  const stageItem = villa.stages.find((item) => item.itemName)?.itemName ?? "";
  // Empat suite pada stage target berbagi biaya buka yang sama.
  const targetSuites = villa.suites.filter((item) => item.stage === stageTo);
  const suiteAmount = targetSuites.reduce((total, item) => total + item.amount, 0);
  const suiteItem = targetSuites.find((item) => item.itemName)?.itemName ?? "";
  const totals = [
    stageAmount > 0 && stageItem ? { name: stageItem, amount: stageAmount } : null,
    suiteAmount > 0 && suiteItem ? { name: suiteItem, amount: suiteAmount } : null,
  ].filter((item): item is Total => item !== null);

  const staff = villa.staff.find((item) => item.id === staffId) ?? villa.staff[0];
  const staffTotals = useMemo(() => {
    if (!staff) return [];
    const totals: Total[] = staff.amount > 0 && staff.itemName ? [{ name: staff.itemName, amount: staff.amount }] : [];
    return totals.concat(sumLevels(villa.staffCosts[staff.tier - 1] ?? [], staffFrom - 1, staffTo));
  }, [staff, villa.staffCosts, staffFrom, staffTo]);

  return (
    <section aria-label={C.tabVilla} className={panel}>
      <Segmented
        text={C.tabVilla}
        value={mode}
        onChange={setMode}
        options={[
          { id: "villa", label: C.tabVilla },
          { id: "staff", label: C.villaStaff },
        ]}
      />

      {mode === "villa" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Select id="cost-villa-from" text={C.stageFrom} value={stageFrom} onChange={setStageFrom}>
              <option value={0}>{C.stageNone}</option>
              {villa.stages.map((item) => (
                <option key={item.stage} value={item.stage}>
                  {item.name}
                </option>
              ))}
            </Select>
            <Select id="cost-villa-to" text={C.stageTo} value={stageTo} onChange={setStageTo}>
              {villa.stages.map((item) => (
                <option key={item.stage} value={item.stage}>
                  {item.name}
                </option>
              ))}
            </Select>
          </div>

          {stageBad ? (
            <p id="cost-villa-stage-error" role="status" className={invalid}>
              {C.invalid}
            </p>
          ) : (
            <div className={result}>
              <Totals
                totals={totals}
                note={`${C.villaStageNote} ${C.villaSuiteNote}`}
                empty={C.noCost}
                format={format}
              />
            </div>
          )}
        </>
      ) : (
        <>
          <Select id="cost-villa-staff" text={C.villaStaff} value={staffId} onChange={setStaffId}>
            {villa.staff.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} (T{item.tier})
              </option>
            ))}
          </Select>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <NumberField id="cost-villa-staff-from" text={C.levelFrom} value={staffFrom} min={STAFF_MIN} max={STAFF_MAX} invalid={staffBad} describedBy={staffBad ? "cost-villa-staff-error" : undefined} onChange={(v) => setStaffFrom(clamp(v, STAFF_MIN, STAFF_MAX))} />
            <NumberField id="cost-villa-staff-to" text={C.levelTo} value={staffTo} min={STAFF_MIN} max={STAFF_MAX} invalid={staffBad} describedBy={staffBad ? "cost-villa-staff-error" : undefined} onChange={(v) => setStaffTo(clamp(v, STAFF_MIN, STAFF_MAX))} />
          </div>

          {staffBad ? (
            <p id="cost-villa-staff-error" role="status" className={invalid}>
              {C.invalid}
            </p>
          ) : null}

          {staffBad ? null : (
            <div className={result}>
              <Totals totals={staffTotals} note={C.villaStaffNote} empty={C.noCost} format={format} />
            </div>
          )}
        </>
      )}
    </section>
  );
}
