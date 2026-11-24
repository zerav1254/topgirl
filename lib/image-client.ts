// Util browser: kompres foto sebelum dikirim ke server action (batas body Vercel 4,5 MB).
// Jangan diimpor dari modul server — pakai createImageBitmap/canvas.

const MAX_SIDE = 1280;

export async function compressPhoto(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  if (!blob) throw new Error("compress");
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "photo"}.webp`, { type: "image/webp" });
}
