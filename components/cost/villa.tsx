"use client";

import { useMemo, useState } from "react";
import { expBetween, sumLevels } from "@/lib/cost-calc";
import type { CostBook } from "@/lib/costs";
import { clamp, invalid, NumberField, panel, result, Segmented, Select, Totals, type CostDict, type Total } from "./fields";

type Mode = "suite" | "staff";

const STAFF_MIN = 1;
const STAFF_MAX = 60;

export function VillaPanel({ villa, C, format }: { villa: CostBook["villa"]; C: CostDict; format: (value: number) => string }) {
  const [mode, setMode] = useState<Mode>("suite");
  // Helper stage: pakai nama stage dari game. 0 = belum punya vila.
  const [stageFrom, setStageFrom] = useState(0);
  const [stageTo, setStageTo] = useState(villa.stages.at(-1)?.stage ?? 0);
  const [suiteId, setSuiteId] = useState(1);
  const [suiteFrom, setSuiteFrom] = useState(0);
  const [suiteTo, setSuiteTo] = useState(5);
  const [staffTier, setStaffTier] = useState(villa.staff[0]?.tier ?? 1);
  // 0 = semua tipe staf di tier ini.
  const [staffSlot, setStaffSlot] = useState(0);
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
  const targetSuites = villa.suites.filter((item) => item.stage === stageTo);
  const suite = (suiteId === 0 ? targetSuites[0] : targetSuites.find((item) => item.suite === suiteId)) ?? targetSuites[0];
  const suiteCount = suiteId === 0 ? Math.max(targetSuites.length, 1) : 1;
  const suiteMax = suite?.levelMax ?? 5;
  const suiteLevelBad = suiteTo <= suiteFrom || suiteTo > suiteMax;
  // Biaya suite konstan per level (ClassUpgradeCost), jadi amount x jumlah level x jumlah suite.
  const suiteAmount = suiteLevelBad ? 0 : suite ? suite.amount * (suiteTo - suiteFrom) * suiteCount : 0;
  const suiteItem = suite?.itemName ?? "";
  const totals = [
    stageAmount > 0 && stageItem ? { name: stageItem, amount: stageAmount } : null,
    suiteAmount > 0 && suiteItem ? { name: suiteItem, amount: suiteAmount } : null,
  ].filter((item): item is Total => item !== null);

  const staffTiers = useMemo(() => [...new Set(villa.staff.map((item) => item.tier))].sort((a, b) => a - b), [villa.staff]);
  const tierStaff = villa.staff.filter((item) => item.tier === staffTier);
  const staffCount = staffSlot === 0 ? Math.max(tierStaff.length, 1) : 1;
  const staff = tierStaff.find((item) => item.staffType === staffSlot) ?? tierStaff[0];
  const staffTotals: Total[] = [];
  if (staff) {
    if (staff.amount > 0 && staff.itemName) staffTotals.push({ name: staff.itemName, amount: staff.amount * staffCount });
    staffTotals.push(
      ...sumLevels(villa.staffCosts[staff.tier - 1] ?? [], staffFrom - 1, staffTo).map((item) => ({
        ...item,
        amount: item.amount * staffCount,
      })),
    );
  }

  return (
    <section aria-label={C.tabVilla} className={panel}>
      <Segmented
        text={C.tabVilla}
        value={mode}
        onChange={setMode}
        options={[
          { id: "suite", label: C.villaSuite },
          { id: "staff", label: C.villaStaff },
        ]}
      />

      {mode === "suite" ? (
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
            <Select
              id="cost-villa-to"
              text={C.stageTo}
              value={stageTo}
              onChange={(value) => {
                setStageTo(value);
                const max = villa.suites.find((item) => item.stage === value && item.suite === (suiteId === 0 ? 1 : suiteId))?.levelMax ?? 5;
                setSuiteTo((current) => Math.min(current, max));
              }}
            >
              {villa.stages.map((item) => (
                <option key={item.stage} value={item.stage}>
                  {item.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-3">
            <Select id="cost-villa-suite" text={C.villaSuite} value={suiteId} onChange={setSuiteId}>
              <option value={0}>{C.villaAllSuites}</option>
              {targetSuites.map((item) => (
                <option key={item.suite} value={item.suite}>
                  {item.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <NumberField id="cost-villa-suite-from" text={C.levelFrom} value={suiteFrom} min={0} max={suiteMax} invalid={suiteLevelBad} describedBy={suiteLevelBad ? "cost-villa-suite-error" : undefined} onChange={(v) => setSuiteFrom(clamp(v, 0, suiteMax))} />
            <NumberField id="cost-villa-suite-to" text={C.levelTo} value={suiteTo} min={0} max={suiteMax} invalid={suiteLevelBad} describedBy={suiteLevelBad ? "cost-villa-suite-error" : undefined} onChange={(v) => setSuiteTo(clamp(v, 0, suiteMax))} />
          </div>

          {stageBad || suiteLevelBad ? (
            <p id="cost-villa-suite-error" role="status" className={invalid}>
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
          <div className="grid grid-cols-2 gap-3">
            <Select
              id="cost-villa-staff-tier"
              text={C.tier}
              value={staffTier}
              onChange={(value) => {
                setStaffTier(value);
                setStaffSlot(0);
              }}
            >
              {staffTiers.map((value) => (
                <option key={value} value={value}>
                  {`${C.tier} ${value}`}
                </option>
              ))}
            </Select>
            <Select id="cost-villa-staff" text={C.villaStaff} value={staffSlot} onChange={setStaffSlot}>
              <option value={0}>{C.villaAllStaff}</option>
              {tierStaff.map((item) => (
                <option key={item.id} value={item.staffType}>
                  {item.name}
                </option>
              ))}
            </Select>
          </div>

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
