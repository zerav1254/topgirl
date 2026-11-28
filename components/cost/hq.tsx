"use client";

import { useMemo, useState } from "react";
import { expBetween, statSum, sumLevels } from "@/lib/cost-calc";
import type { CostBook } from "@/lib/costs";
import { t } from "@/lib/i18n";
import { clamp, heading, invalid, NumberField, panel, result, Select, Stats, Totals, type CostDict } from "./fields";

const LEVEL_MIN = 1;
const LEVEL_MAX = 800;
const ROOM_MIN = 1;
const ROOM_MAX = 60;

export function HqPanel({
  hq,
  C,
  format,
  formatPct,
}: {
  hq: CostBook["hq"];
  C: CostDict;
  format: (value: number) => string;
  formatPct: (value: number) => string;
}) {
  const [levelFrom, setLevelFrom] = useState(LEVEL_MIN);
  const [levelTo, setLevelTo] = useState(LEVEL_MAX);
  const [tier, setTier] = useState(1);
  const [slot, setSlot] = useState(0);
  const [roomFrom, setRoomFrom] = useState(ROOM_MIN);
  const [roomTo, setRoomTo] = useState(ROOM_MAX);

  const tiers = useMemo(() => [...new Set(hq.rooms.map((room) => room.tier))].sort((a, b) => a - b), [hq.rooms]);
  const buildingTotal = expBetween(hq.curve.amounts, levelFrom, levelTo);
  const tierRooms = hq.rooms.filter((room) => room.tier === tier);
  // Slot 0 = semua ruangan di tier ini; jumlahnya ikut data, bukan angka tetap.
  const slotCount = slot === 0 ? Math.max(tierRooms.length, 1) : 1;
  // Rencana renovasi lantai dibayar sekali per kelas; kayu/baja tetap per slot.
  const roomTotals = useMemo(
    () =>
      sumLevels(hq.roomCosts[tier - 1] ?? [], roomFrom, roomTo).map((item) => ({
        ...item,
        amount: item.amount * (item.itemId !== undefined && hq.planItemIds.includes(item.itemId) ? 1 : slotCount),
      })),
    [hq.roomCosts, hq.planItemIds, tier, roomFrom, roomTo, slotCount],
  );
  const buildingBad = levelTo <= levelFrom;
  const roomBad = roomTo <= roomFrom;

  // Gedung: nilai tabel = tambahan per level, jadi jumlahkan level awal+1 .. target.
  const buildingStats = useMemo(
    () => ({
      sing: expBetween(hq.curve.sing, levelFrom, levelTo),
      dance: expBetween(hq.curve.dance, levelFrom, levelTo),
      management: expBetween(hq.curve.management, levelFrom, levelTo),
    }),
    [hq.curve, levelFrom, levelTo],
  );

  // Ruangan: nilai tabel = tambahan per level; 4 slot berbagi nilai yang sama.
  // Nilai ini persen (mis. 1.500 = 15,00%), bukan flat. Persen total = akumulasi
  // level 1..target (level 1 sudah bernilai), sesuai angka di UI game.
  const roomStats = useMemo(() => {
    const sum = statSum(
      hq.roomStats.filter((row) => row.tier === tier),
      0,
      roomTo,
    );
    return { sing: sum.sing * slotCount, dance: sum.dance * slotCount, management: sum.management * slotCount };
  }, [hq.roomStats, tier, roomTo, slotCount]);

  // Renovasi kumulatif level 1..target; dasar pengali persen dekorasi.
  const renovationTotal = useMemo(
    () => ({
      sing: expBetween(hq.curve.sing, 0, levelTo),
      dance: expBetween(hq.curve.dance, 0, levelTo),
      management: expBetween(hq.curve.management, 0, levelTo),
    }),
    [hq.curve, levelTo],
  );
  // Persen dekorasi hanya mengalikan stat renovasi markas, bukan total artis.
  const floorContribution = useMemo(
    () => ({
      sing: Math.round((renovationTotal.sing * roomStats.sing) / 10000),
      dance: Math.round((renovationTotal.dance * roomStats.dance) / 10000),
      management: Math.round((renovationTotal.management * roomStats.management) / 10000),
    }),
    [renovationTotal, roomStats],
  );

  const statRows = (stats: { sing: number; dance: number; management: number }) =>
    [
      { label: C.statSing, value: stats.sing },
      { label: C.statDance, value: stats.dance },
      { label: C.statManage, value: stats.management },
    ]
      .filter((row) => row.value > 0)
      .map((row) => ({ label: row.label, value: `+${format(row.value)}` }));

  const pctRows = (stats: { sing: number; dance: number; management: number }) =>
    [
      { label: C.statSing, value: stats.sing },
      { label: C.statDance, value: stats.dance },
      { label: C.statManage, value: stats.management },
    ]
      .filter((row) => row.value > 0)
      .map((row) => ({ label: row.label, value: `+${formatPct(row.value)}%` }));

  return (
    <section aria-label={C.tabHq} className={panel}>
      <h2 className="sr-only">{C.tabHq}</h2>
      <h2 className={heading}>{C.hqBuilding}</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <NumberField id="cost-hq-from" text={C.levelFrom} value={levelFrom} min={LEVEL_MIN} max={LEVEL_MAX} invalid={buildingBad} describedBy={buildingBad ? "cost-hq-error" : undefined} onChange={(v) => setLevelFrom(clamp(v, LEVEL_MIN, LEVEL_MAX))} />
        <NumberField id="cost-hq-to" text={C.levelTo} value={levelTo} min={LEVEL_MIN} max={LEVEL_MAX} invalid={buildingBad} describedBy={buildingBad ? "cost-hq-error" : undefined} onChange={(v) => setLevelTo(clamp(v, LEVEL_MIN, LEVEL_MAX))} />
      </div>

      {buildingBad ? (
        <p id="cost-hq-error" role="status" className={invalid}>
          {C.invalid}
        </p>
      ) : null}

      {buildingBad ? null : (
        <div className={result}>
          <Totals
            totals={buildingTotal > 0 ? [{ name: hq.curve.itemName, amount: buildingTotal }] : []}
            note={C.hqNote}
            empty={C.noCost}
            format={format}
          />
          <Stats title={C.statsTitle} rows={statRows(buildingStats)} note={C.statsNote} />
        </div>
      )}

      <h2 className={`${heading} mt-6`}>{C.hqRooms}</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Select
          id="cost-hq-tier"
          text={C.hqRooms}
          value={tier}
          onChange={(value) => {
            setTier(value);
            setSlot(0);
          }}
        >
          {tiers.map((value) => (
            <option key={value} value={value}>
              {hq.rooms.find((room) => room.tier === value)?.room ?? `${C.tier} ${value}`}
            </option>
          ))}
        </Select>
        <Select id="cost-hq-slot" text={C.hqRoom} value={slot} onChange={setSlot}>
          <option value={0}>{C.hqAllSlots}</option>
          {tierRooms.map((room) => (
            <option key={room.slot} value={room.slot}>
              {room.name}
            </option>
          ))}
        </Select>
        <NumberField id="cost-hq-room-from" text={C.levelFrom} value={roomFrom} min={ROOM_MIN} max={ROOM_MAX} invalid={roomBad} describedBy={roomBad ? "cost-hq-room-error" : undefined} onChange={(v) => setRoomFrom(clamp(v, ROOM_MIN, ROOM_MAX))} />
        <NumberField id="cost-hq-room-to" text={C.levelTo} value={roomTo} min={ROOM_MIN} max={ROOM_MAX} invalid={roomBad} describedBy={roomBad ? "cost-hq-room-error" : undefined} onChange={(v) => setRoomTo(clamp(v, ROOM_MIN, ROOM_MAX))} />
      </div>

      {roomBad ? (
        <p id="cost-hq-room-error" role="status" className={invalid}>
          {C.invalid}
        </p>
      ) : null}

      {roomBad ? null : (
        <div className={result}>
          <Totals totals={roomTotals} note={C.hqRoomNote} empty={C.noCost} format={format} />
          <Stats title={C.statsTitle} rows={pctRows(roomStats)} note={C.hqRoomStatNote} />
          <Stats
            title={t(C.hqFloorGain, { level: levelTo })}
            rows={statRows(floorContribution)}
            note={C.hqFloorGainNote}
          />
        </div>
      )}
    </section>
  );
}
