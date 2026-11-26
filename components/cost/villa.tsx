"use client";

import { useMemo, useState } from "react";
import { expBetween, sumLevels } from "@/lib/cost-calc";
import type { CostBook } from "@/lib/costs";
import { clamp, NumberField, Segmented, Select, Totals, type CostDict, type Total } from "./fields";

type Mode = "stage" | "suite" | "staff";

const STAFF_MIN = 1;
const STAFF_MAX = 60;

export function VillaPanel({ villa, C, format }: { villa: CostBook["villa"]; C: CostDict; format: (value: number) => string }) {
  const [mode, setMode] = useState<Mode>("stage");
  const [stageFrom, setStageFrom] = useState(0);
  const [stageTo, setStageTo] = useState(villa.stages.length - 1);
  const [suiteStage, setSuiteStage] = useState(1);
  const [suite, setSuite] = useState(1);
  const [staffId, setStaffId] = useState(villa.staff[0]?.id ?? 0);
  const [staffFrom, setStaffFrom] = useState(STAFF_MIN);
  const [staffTo, setStaffTo] = useState(STAFF_MAX);

  const stageAmounts = villa.stages.map((item) => item.amount);
  const maxStage = stageAmounts.length - 1;
  const stageItems = villa.stages.filter((item) => item.amount > 0);
  const stageTotal = expBetween(stageAmounts, stageFrom, stageTo);

  const suites = villa.suites.filter((item) => item.stage === suiteStage);
  const chosenSuite = suites.find((item) => item.suite === suite) ?? suites[0];

  const staff = villa.staff.find((item) => item.id === staffId) ?? villa.staff[0];
  const staffTotals = useMemo(() => {
    if (!staff) return [];
    const totals: Total[] = staff.amount > 0 && staff.itemName ? [{ name: staff.itemName, amount: staff.amount }] : [];
    return totals.concat(sumLevels(villa.staffCosts[staff.tier - 1] ?? [], staffFrom - 1, staffTo));
  }, [staff, villa.staffCosts, staffFrom, staffTo]);

  return (
    <section aria-label={C.tabVilla} className="rounded-2xl border border-white/10 bg-panel/70 p-4 sm:p-5">
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { id: "stage", label: C.villaStage },
          { id: "suite", label: C.villaSuite },
          { id: "staff", label: C.villaStaff },
        ]}
      />

      {mode === "stage" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <NumberField id="cost-villa-from" text={C.stageFrom} value={stageFrom} min={0} max={maxStage} onChange={(v) => setStageFrom(clamp(v, 0, maxStage))} />
            <NumberField id="cost-villa-to" text={C.stageTo} value={stageTo} min={0} max={maxStage} onChange={(v) => setStageTo(clamp(v, 0, maxStage))} />
          </div>

          {stageTo <= stageFrom ? <p className="mt-3 text-sm text-red-300">{C.invalid}</p> : null}

          <p className="mt-3 text-xs text-zinc-400">
            {C.villaStageList}: <span className="font-semibold text-zinc-200">{stageItems.map((item) => item.name).join(", ")}</span>
          </p>

          <div className="mt-4 rounded-xl border border-white/10 bg-panel-2/60 px-3 py-3">
            <Totals
              totals={stageTotal > 0 ? [{ name: villa.stages[0]?.itemName ?? "", amount: stageTotal }] : []}
              note={C.villaStageNote}
              empty={C.noCost}
              format={format}
            />
          </div>
        </>
      ) : mode === "suite" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Select id="cost-villa-suite-stage" text={C.villaStage} value={suiteStage} onChange={setSuiteStage}>
              {stageItems.map((item) => (
                <option key={item.stage} value={item.stage}>
                  {item.name}
                </option>
              ))}
            </Select>
            <Select id="cost-villa-suite" text={C.suite} value={suite} onChange={setSuite}>
              {suites.map((item) => (
                <option key={item.suite} value={item.suite}>
                  {item.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-panel-2/60 px-3 py-3">
            <Totals
              totals={chosenSuite && chosenSuite.amount > 0 ? [{ name: chosenSuite.itemName, amount: chosenSuite.amount }] : []}
              note={C.villaSuiteNote}
              empty={C.noCost}
              format={format}
            />
          </div>
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
            <NumberField id="cost-villa-staff-from" text={C.levelFrom} value={staffFrom} min={STAFF_MIN} max={STAFF_MAX} onChange={(v) => setStaffFrom(clamp(v, STAFF_MIN, STAFF_MAX))} />
            <NumberField id="cost-villa-staff-to" text={C.levelTo} value={staffTo} min={STAFF_MIN} max={STAFF_MAX} onChange={(v) => setStaffTo(clamp(v, STAFF_MIN, STAFF_MAX))} />
          </div>

          {staffTo <= staffFrom ? <p className="mt-3 text-sm text-red-300">{C.invalid}</p> : null}

          <div className="mt-4 rounded-xl border border-white/10 bg-panel-2/60 px-3 py-3">
            <Totals totals={staffTo > staffFrom ? staffTotals : []} note={C.villaStaffNote} empty={C.noCost} format={format} />
          </div>
        </>
      )}
    </section>
  );
}
