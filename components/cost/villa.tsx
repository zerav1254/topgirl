"use client";

import { useMemo, useState } from "react";
import { stagePromotionCost, statSum, sumLevels } from "@/lib/cost-calc";
import type { CostBook } from "@/lib/costs";
import { clamp, heading, invalid, NumberField, panel, result, Select, Stats, Totals, type CostDict, type Total } from "./fields";

const STAFF_MIN = 1;
const STAFF_MAX = 60;

export function VillaPanel({
  villa,
  C,
  format,
  formatPct,
}: {
  villa: CostBook["villa"];
  C: CostDict;
  format: (value: number) => string;
  formatPct: (value: number) => string;
}) {
  // Helper stage: pakai nama stage dari game. 0 = belum punya vila.
  const [stageFrom, setStageFrom] = useState(0);
  const [stageTo, setStageTo] = useState(villa.stages.at(-1)?.stage ?? 0);
  const [suiteId, setSuiteId] = useState(1);
  const [suiteFrom, setSuiteFrom] = useState(0);
  const [suiteTo, setSuiteTo] = useState(10);
  const [staffTier, setStaffTier] = useState(villa.staff[0]?.tier ?? 1);
  // 0 = semua tipe staf di tier ini.
  const [staffSlot, setStaffSlot] = useState(0);
  const [staffFrom, setStaffFrom] = useState(STAFF_MIN);
  const [staffTo, setStaffTo] = useState(STAFF_MAX);

  const stageBad = stageTo <= stageFrom;
  const staffBad = staffTo <= staffFrom;

  // Promosi: tiap stage butuh advanceMax bintang; amount = biaya per bintang.
  // Stage A -> B memakai stage A..B-1 (bintang terakhir A menaikkan ke A+1).
  const stageAmount = useMemo(
    () => (stageBad ? 0 : stagePromotionCost(villa.stages, stageFrom, stageTo)),
    [stageBad, villa.stages, stageFrom, stageTo],
  );
  const stageItem = villa.stages.find((item) => item.itemName)?.itemName ?? "";
  // Stage 10 ("Istana Cahaya Bintang") tidak punya suite yang bisa di-upgrade (level_max 0).
  const targetSuites = villa.suites.filter((item) => item.stage === stageTo && item.levelMax > 0);
  const hasSuites = targetSuites.length > 0;
  const selectedSuiteId = suiteId === 0 || targetSuites.some((item) => item.suite === suiteId) ? suiteId : 0;
  const suite = (selectedSuiteId === 0 ? targetSuites[0] : targetSuites.find((item) => item.suite === selectedSuiteId)) ?? targetSuites[0];
  const suiteCount = selectedSuiteId === 0 ? Math.max(targetSuites.length, 1) : 1;
  // LevelMax = level per peningkatan; AdvanceMax = berapa kali peningkatan harus
  // diulang sebelum naik stage. Total level suite = LevelMax × AdvanceMax.
  const advanceOf = (stage: number) => Math.max(villa.stages.find((item) => item.stage === stage)?.advanceMax ?? 1, 1);
  const suiteMax = (suite?.levelMax ?? 0) * advanceOf(stageTo);
  const suiteLevelBad = hasSuites && (suiteTo <= suiteFrom || suiteTo > suiteMax);
  // Biaya suite konstan per level (ClassUpgradeCost), jadi amount x jumlah level x jumlah suite.
  const suiteAmount = suiteLevelBad || !suite ? 0 : suite.amount * (suiteTo - suiteFrom) * suiteCount;
  const suiteItem = suite?.itemName ?? "";
  const totals = [
    stageAmount > 0 && stageItem ? { name: stageItem, amount: stageAmount } : null,
    suiteAmount > 0 && suiteItem ? { name: suiteItem, amount: suiteAmount } : null,
  ].filter((item): item is Total => item !== null);

  // Stat vila menumpuk per bintang (peningkatan): tiap bintang memberi stat
  // stage + 4 suite sampai LevelMax. AdvanceMax = jumlah bintang sebelum naik
  // stage, jadi stat stage sebelumnya dikali AdvanceMax.
  const stackStats = villa.stages
    .filter((item) => item.stage >= stageFrom && item.stage < stageTo)
    .reduce(
      (sum, item) => {
        const advance = Math.max(item.advanceMax, 1);
        const suites = villa.suites.filter((row) => row.stage === item.stage && row.levelMax > 0);
        const perStar = (key: "sing" | "dance" | "management") =>
          suites.reduce((acc, row) => acc + row[key] * row.levelMax, 0);
        return {
          sing: sum.sing + advance * (item.sing + perStar("sing")),
          dance: sum.dance + advance * (item.dance + perStar("dance")),
          management: sum.management + advance * (item.management + perStar("management")),
        };
      },
      { sing: 0, dance: 0, management: 0 },
    );
  const suiteLevels = Math.max(suiteTo - suiteFrom, 0);
  const pickedSuites = selectedSuiteId === 0 ? targetSuites : suite ? [suite] : [];
  const suiteStats = pickedSuites.reduce(
    (sum, item) => ({
      sing: sum.sing + item.sing * suiteLevels,
      dance: sum.dance + item.dance * suiteLevels,
      management: sum.management + item.management * suiteLevels,
    }),
    { sing: 0, dance: 0, management: 0 },
  );
  // Bintang stage terpilih baru selesai kalau 4 suite dituntaskan sampai LevelMax.
  const levelMax = suite?.levelMax ?? 0;
  const stars =
    hasSuites && selectedSuiteId === 0 && suiteFrom === 0 && levelMax > 0
      ? Math.min(Math.floor(suiteTo / levelMax), advanceOf(stageTo))
      : 0;
  const targetStage = villa.stages.find((item) => item.stage === stageTo);
  const suiteTotal = {
    sing: stackStats.sing + suiteStats.sing + (targetStage?.sing ?? 0) * stars,
    dance: stackStats.dance + suiteStats.dance + (targetStage?.dance ?? 0) * stars,
    management: stackStats.management + suiteStats.management + (targetStage?.management ?? 0) * stars,
  };

  const statRows = (stats: { sing: number; dance: number; management: number }) =>
    [
      { label: C.statSing, value: stats.sing },
      { label: C.statDance, value: stats.dance },
      { label: C.statManage, value: stats.management },
    ]
      .filter((row) => row.value > 0)
      .map((row) => ({ label: row.label, value: `+${format(row.value)}` }));

  // Staf vila menambah persen (SingingPer dkk), bukan flat.
  const pctRows = (stats: { sing: number; dance: number; management: number }) =>
    [
      { label: C.statSing, value: stats.sing },
      { label: C.statDance, value: stats.dance },
      { label: C.statManage, value: stats.management },
    ]
      .filter((row) => row.value > 0)
      .map((row) => ({ label: row.label, value: `+${formatPct(row.value)}%` }));

  const staffTiers = useMemo(() => [...new Set(villa.staff.map((item) => item.tier))].sort((a, b) => a - b), [villa.staff]);
  const tierStaff = villa.staff.filter((item) => item.tier === staffTier);
  const staffCount = staffSlot === 0 ? Math.max(tierStaff.length, 1) : 1;
  const staff = tierStaff.find((item) => item.staffType === staffSlot) ?? tierStaff[0];
  const staffTotals: Total[] = [];
  if (staff) {
    if (staff.amount > 0 && staff.itemName) staffTotals.push({ name: staff.itemName, amount: staff.amount * staffCount });
    staffTotals.push(
      ...sumLevels(villa.staffCosts[staff.tier - 1] ?? [], staffFrom, staffTo).map((item) => ({
        ...item,
        amount: item.amount * staffCount,
      })),
    );
  }

  const staffStats = statSum(
    villa.staffStats.filter((row) => row.tier === staffTier && (staffSlot === 0 || row.staffType === staffSlot)),
    staffFrom,
    staffTo,
  );
  // Persen staf (mis. 6.020 = 60,2%) mengalikan stat vila dari pilihan
  // Stage/Suite; game menampilkan hasil flat-nya (dibulatkan ke bawah).
  const staffFlat = {
    sing: Math.floor((suiteTotal.sing * staffStats.sing) / 10000),
    dance: Math.floor((suiteTotal.dance * staffStats.dance) / 10000),
    management: Math.floor((suiteTotal.management * staffStats.management) / 10000),
  };

  return (
    <section aria-label={C.tabVilla} className={panel}>
      <h2 className="sr-only">{C.tabVilla}</h2>
      <h2 className={heading}>{C.villaSuite}</h2>

      <div className="mt-3 grid grid-cols-2 gap-3">
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
            const target = villa.suites.find((item) => item.stage === value && item.levelMax > 0);
            const advance = Math.max(villa.stages.find((item) => item.stage === value)?.advanceMax ?? 1, 1);
            // Default tampil sampai total level (LevelMax × peningkatan) stage terpilih.
            const max = target ? target.levelMax * advance : 0;
            if (max > 0) {
              setSuiteFrom(0);
              setSuiteTo(max);
            }
          }}
        >
          {villa.stages.map((item) => (
            <option key={item.stage} value={item.stage}>
              {item.name}
            </option>
          ))}
        </Select>
      </div>

      {hasSuites ? (
        <>
          <div className="mt-3">
            <Select id="cost-villa-suite" text={C.villaSuite} value={selectedSuiteId} onChange={setSuiteId}>
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
        </>
      ) : null}

      {stageBad || suiteLevelBad ? (
        <p id="cost-villa-suite-error" role="status" className={invalid}>
          {C.invalid}
        </p>
      ) : (
        <div className={result}>
          <Totals
            totals={totals}
            note={hasSuites ? `${C.villaStageNote} ${C.villaSuiteNote}` : C.villaStageNote}
            empty={C.noCost}
            format={format}
          />
          <Stats title={C.statsTitle} rows={statRows(suiteTotal)} note={C.statsNote} />
        </div>
      )}

      <h2 className={`${heading} mt-6`}>{C.villaStaff}</h2>

      <div className="mt-3 grid grid-cols-2 gap-3">
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
          <Stats title={C.statsTitle} rows={pctRows(staffStats)} note={C.villaStaffStatNote} />
          <Stats title={C.villaStaffGain} rows={statRows(staffFlat)} note={C.villaStaffGainNote} />
        </div>
      )}
    </section>
  );
}
