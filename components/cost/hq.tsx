"use client";

import { useMemo, useState } from "react";
import { expBetween, sumLevels } from "@/lib/cost-calc";
import type { CostBook } from "@/lib/costs";
import { clamp, NumberField, Segmented, Select, Totals, type CostDict } from "./fields";

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

  const buildingTotal = expBetween(hq.curve.amounts, levelFrom, levelTo);
  const slotCount = slot === 0 ? 4 : 1;
  const roomTotals = useMemo(
    () =>
      sumLevels(hq.roomCosts[tier - 1] ?? [], roomFrom, roomTo).map((item) => ({
        ...item,
        amount: item.amount * slotCount,
      })),
    [hq.roomCosts, tier, roomFrom, roomTo, slotCount],
  );
  const tierRooms = hq.rooms.filter((room) => room.tier === tier);

  return (
    <section aria-label={C.tabHq} className="rounded-2xl border border-white/10 bg-panel/70 p-4 sm:p-5">
      <Segmented
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
            <NumberField id="cost-hq-from" text={C.levelFrom} value={levelFrom} min={LEVEL_MIN} max={LEVEL_MAX} onChange={(v) => setLevelFrom(clamp(v, LEVEL_MIN, LEVEL_MAX))} />
            <NumberField id="cost-hq-to" text={C.levelTo} value={levelTo} min={LEVEL_MIN} max={LEVEL_MAX} onChange={(v) => setLevelTo(clamp(v, LEVEL_MIN, LEVEL_MAX))} />
          </div>

          {levelTo <= levelFrom ? <p className="mt-3 text-sm text-red-300">{C.invalid}</p> : null}

          <div className="mt-4 rounded-xl border border-white/10 bg-panel-2/60 px-3 py-3">
            <Totals
              totals={buildingTotal > 0 ? [{ name: hq.curve.itemName, amount: buildingTotal }] : []}
              note={C.hqNote}
              empty={C.noCost}
              format={format}
            />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Select id="cost-hq-tier" text={C.tier} value={tier} onChange={setTier}>
              {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                <option key={value} value={value}>
                  {C.tier} {value}
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
            <NumberField id="cost-hq-room-from" text={C.levelFrom} value={roomFrom} min={ROOM_MIN} max={ROOM_MAX} onChange={(v) => setRoomFrom(clamp(v, ROOM_MIN, ROOM_MAX))} />
            <NumberField id="cost-hq-room-to" text={C.levelTo} value={roomTo} min={ROOM_MIN} max={ROOM_MAX} onChange={(v) => setRoomTo(clamp(v, ROOM_MIN, ROOM_MAX))} />
          </div>

          {roomTo <= roomFrom ? <p className="mt-3 text-sm text-red-300">{C.invalid}</p> : null}

          <div className="mt-4 rounded-xl border border-white/10 bg-panel-2/60 px-3 py-3">
            <Totals totals={roomTotals} note={C.hqRoomNote} empty={C.noCost} format={format} />
          </div>
        </>
      )}
    </section>
  );
}
