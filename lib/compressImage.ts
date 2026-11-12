// Phone photos are often 5 to 10 MB, which is more than the receipt reader accepts.
// This shrinks big photos in the browser before they are uploaded. Small files are left alone.
const MAX_SIDE = 1800; // pixels on the longest side, plenty to read a receipt
const SKIP_UNDER = 1.2 * 1024 * 1024;
const TARGET = 3.5 * 1024 * 1024;

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

export async function prepareReceiptImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size <= SKIP_UNDER) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    let best: Blob | null = null;
    for (const quality of [0.85, 0.7, 0.55, 0.4]) {
      const blob = await toBlob(canvas, quality);
      if (!blob) continue;
      best = blob;
      if (blob.size <= TARGET) break;
    }
    if (!best || best.size >= file.size) return file;
    const base = file.name.replace(/\.[^.]+$/, "") || "receipt";
    return new File([best], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    return file; // if the browser can't shrink it, send the original
  }
}
