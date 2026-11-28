import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { tabIcon } from "../lib/cost-icons.ts";

const files = {
  page: await readFile("app/[locale]/upgrade/page.tsx", "utf8"),
  calculator: await readFile("components/cost-calculator.tsx", "utf8"),
  privateCalculator: await readFile("components/cost/private-calculator.tsx", "utf8"),
};

assert.doesNotMatch(files.page, /\bgetCostBook\b/, "upgrade page tidak boleh memuat CostBook private");
assert.match(files.page, /\bgetArtistCostBook\b/, "upgrade page harus memuat data artist publik");
assert.match(files.page, /\bgetPrivateCostOptions\b/, "upgrade page hanya boleh mengirim opsi private minimum");

for (const [name, source] of Object.entries({ calculator: files.calculator, privateCalculator: files.privateCalculator })) {
  assert.doesNotMatch(source, /import(?:\s+type)?\s*\{[^}]*\bCostBook\b[^}]*\}\s*from/, `${name} tidak boleh mengimpor CostBook private`);
  assert.doesNotMatch(source, /\bgetCostBook\b|\bloadCostBook\b|\badminClient\b/, `${name} tidak boleh membaca data private`);
}

// Setiap ikon tab yang dirender harus ada di public; page 404 tidak boleh lolos.
for (const tab of ["artist", "car", "hq", "villa", "collection", "ceo"]) {
  const icon = tabIcon(tab);
  if (icon) await access(`public${icon}`);
}

console.log("check-cost-boundary ok");