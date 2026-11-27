"use client";

import { useMemo, useState } from "react";
import { expBetween, sumLevels } from "@/lib/cost-calc";
import type { CostBook } from "@/lib/costs";
import { clamp, invalid, NumberField, panel, result, Segmented, Select, Totals, type CostDict } from "./fields";

type Mode = "building" | "rooms";

const LEVEL_MIN = 1;
const LEVEL_MAX = 800;
const ROOM_MIN = 1;
const ROOM_MAX = 60;

export function HqPanel({ hq, C, format }: { hq: CostBook["hq"]; C: CostDict; format: (value: number) => string }) {
  const [mode, setMode] = useState<Mode>("building");
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

  return (
    <section aria-label={C.tabHq} className={panel}>
      <Segmented
        text={C.tabHq}
        value={mode}
        onChange={setMode}
        options={[
          { id: "building", label: C.hqBuilding },
          { id: "rooms", label: C.hqRooms },
        ]}
      />

      {mode === "building" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
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
            </div>
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
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
            </div>
          )}
        </>
      )}
    </section>
  );
}
