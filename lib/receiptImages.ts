// Receipt photos, saved so a treasurer can look at them when something is unclear.
// Stored next to the other data files (data/receipt-images). Free hosting may wipe them on restart, like everything else.
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { read, update } from "./db";

type Row = { id: string; userId: string; mime: string; createdAt: string };
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const dir = () => path.join(process.cwd(), "data", "receipt-images");
const SAFE_ID = /^[0-9a-f-]{36}$/;

export async function saveReceiptImage(userId: string, bytes: Buffer, mime: string): Promise<string | undefined> {
  const ext = EXT[mime];
  if (!ext) return undefined;
  const id = randomUUID();
  try {
    await fs.mkdir(dir(), { recursive: true });
    await fs.writeFile(path.join(dir(), `${id}.${ext}`), bytes);
    await update<Row>("receipt_images", (rows) => void rows.push({ id, userId, mime, createdAt: new Date().toISOString() }));
    return id;
  } catch (err) {
    console.error("Couldn't save the receipt photo:", err); // the claim still works without it
    return undefined;
  }
}

/** True only if this photo was uploaded by this member. */
export async function ownsImage(id: unknown, userId: string): Promise<boolean> {
  if (typeof id !== "string" || !SAFE_ID.test(id)) return false;
  return (await read<Row>("receipt_images")).some((r) => r.id === id && r.userId === userId);
}

export async function loadReceiptImage(id: string): Promise<{ bytes: Buffer; mime: string } | null> {
  if (!SAFE_ID.test(id)) return null;
  const row = (await read<Row>("receipt_images")).find((r) => r.id === id);
  if (!row) return null;
  try {
    return { bytes: await fs.readFile(path.join(dir(), `${id}.${EXT[row.mime]}`)), mime: row.mime };
  } catch {
    return null;
  }
}
