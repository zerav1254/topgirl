import { supabase } from "./supabase.ts";

export type Option = { id: string; label: string };

// "percent" = nilai persen (12, 24, ...). "flat" = angka mentah (DPS 200/240).
export type EffectOption = Option & { unit: "percent" | "flat" };

export type Lookups = {
  genres: Option[];
  origins: Option[];
  effects: EffectOption[];
};

async function options(table: "genres" | "origins"): Promise<Option[]> {
  const { data, error } = await supabase.from(table).select("id, label").order("sort");
  if (error) throw new Error(`Gagal memuat ${table}: ${error.message}`);
  return data as Option[];
}

export async function loadLookups(): Promise<Lookups> {
  const [genres, origins, effects] = await Promise.all([
    options("genres"),
    options("origins"),
    supabase.from("effects").select("id, label, unit").order("sort").then(({ data, error }) => {
      if (error) throw new Error(`Gagal memuat effects: ${error.message}`);
      return data as EffectOption[];
    }),
  ]);
  return { genres, origins, effects };
}
