// Daftar frame avatar di public/assets/avatars/frames (dibuat dari aset game).
export const AVATAR_FRAMES = [
  "15112472", "15116104", "15116105", "15116106", "AvatarFrame01", "AvatarFrame02",
  "AvatarFrame03", "AvatarFrame04", "AvatarFrame05", "AvatarFrame06", "AvatarFrame07", "AvatarFrame08",
  "AvatarFrame09", "AvatarFrame10", "AvatarFrame11", "AvatarFrame12", "AvatarFrame13", "AvatarFrame14",
  "AvatarFrame15", "AvatarFrame16", "AvatarFrame17", "AvatarFrame18", "AvatarFrame19", "AvatarFrame20",
  "AvatarFrame21", "AvatarFrame22", "AvatarFrame23", "AvatarFrame24", "AvatarFrame25", "AvatarFrame26",
  "AvatarFrame27", "AvatarFrame28", "AvatarFrame29", "AvatarFrame30", "AvatarFrame31", "AvatarFrame32",
  "AvatarFrame33", "AvatarFrame34", "AvatarFrame35", "AvatarFrame36", "AvatarFrame37", "AvatarFrame38",
  "AvatarFrame39", "AvatarFrame40", "AvatarFrame41", "AvatarFrame42", "AvatarFrame43", "AvatarFrame44",
  "AvatarFrame45", "AvatarFrame46", "AvatarFrame47", "AvatarFrame48", "AvatarFrame49", "AvatarFrame50",
  "AvatarFrame51", "AvatarFrame52", "AvatarFrame53", "AvatarFrame54", "AvatarFrame55", "AvatarFrame56",
  "AvatarFrame57", "AvatarFrame58", "AvatarFrame59", "AvatarFrame60", "AvatarFrame61", "AvatarFrame62",
  "AvatarFrame63", "AvatarFrame64", "AvatarFrame65", "AvatarFrame66", "AvatarFrame67", "AvatarFrame68",
  "AvatarFrame69", "AvatarFrame70", "AvatarFrame71", "AvatarFrame72", "AvatarFrame73", "AvatarFrame74",
  "AvatarFrame75", "AvatarFrame76", "AvatarFrame77", "AvatarFrame78", "AvatarFrame79", "AvatarFrame80",
  "AvatarFrame81", "AvatarFrame82", "AvatarFrame83", "AvatarFrame84", "AvatarFrame85", "AvatarFrame86",
  "AvatarFrame87", "AvatarFrame88", "AvatarFrame89", "AvatarFrame90", "AvatarFrame91",
] as const;

export type AvatarFrame = (typeof AVATAR_FRAMES)[number];

// Nilai dari form adalah string bebas; hanya id di daftar ini yang diterima.
export const isAvatarFrame = (value: string): value is AvatarFrame => (AVATAR_FRAMES as readonly string[]).includes(value);

export const avatarFrameSrc = (frame: AvatarFrame) => `/assets/avatars/frames/${frame}.webp`;
