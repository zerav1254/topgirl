import { unstable_cache } from "next/cache";
import { cache } from "react";
import { loadArtists } from "./artists.ts";

// Cache lintas request selama 300 dtk; script seed/check tetap memakai loadArtists() langsung.
export const getArtists = cache(unstable_cache(loadArtists, ["artists"], { revalidate: 300, tags: ["artists"] }));
