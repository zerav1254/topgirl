import assert from "node:assert/strict";
import { addStageStats, multiplyTotals, museumStats, percentStats, sumCurveRange } from "../lib/cost-private-calc.ts";

// Formula kalkulasi private tetap murni dan benar pada tepi rentang tiap domain.
assert.deepEqual(multiplyTotals([{ itemId: 1, name: "Part", amount: 7 }], 3), [{ itemId: 1, name: "Part", amount: 21 }]);
assert.equal(sumCurveRange([99, 2, 3, 5], 1, 4), 10);
assert.equal(sumCurveRange([99, 2, 3], 2, 2), 0);
assert.deepEqual(percentStats({ sing: 101, dance: 99, management: 1 }, { sing: 5000, dance: 5000, management: 9999 }), { sing: 50, dance: 49, management: 0 });
assert.deepEqual(percentStats({ sing: 101, dance: 99, management: 1 }, { sing: 5000, dance: 5000, management: 9999 }, "round"), { sing: 51, dance: 50, management: 1 });
assert.deepEqual(addStageStats({ sing: 10, dance: 20, management: 30 }, { sing: 2, dance: 3, management: 4 }, 0), { sing: 10, dance: 20, management: 30 });
assert.deepEqual(addStageStats({ sing: 10, dance: 20, management: 30 }, { sing: 2, dance: 3, management: 4 }, 3), { sing: 16, dance: 29, management: 42 });
assert.deepEqual(museumStats(25, "all"), { sing: 25, dance: 25, management: 25 });
assert.deepEqual(museumStats(25, "wall"), { sing: 0, dance: 25, management: 0 });

console.log("check-cost-private ok");
