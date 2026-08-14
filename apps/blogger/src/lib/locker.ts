import { del, get, list, put } from "@vercel/blob";
import { BlobNotFoundError } from "@vercel/blob";

export const LOCKER_PREFIX = "locker/";
export const MAX_FILES = 36;
export const MAX_FILE_SIZE = 4 * 1024 * 1024;
export const TTL_MS = 2 * 60 * 60 * 1000;

export interface LockerFile {
  code: string;
  pathname: string;
  fileName: string;
  size: number;
  uploadedAt: number;
  remainingMs: number;
}

export function isValidCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

export function randomCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function codePath(code: string): string {
  return `${LOCKER_PREFIX}${code}`;
}

function sanitizeFileName(name: string): string {
  const cleaned = name
    .replace(/[/\\%#?&=+]/g, "_")
    .split("")
    .filter((ch) => ch.charCodeAt(0) >= 0x20 && ch.charCodeAt(0) !== 0x7f)
    .join("")
    .trim()
    .slice(0, 80);
  return cleaned || "file";
}

function fileNameFromPathname(pathname: string): string {
  return pathname.split("/")[2] || "文件";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

async function listBlobs(): Promise<LockerFile[]> {
  const { blobs } = await list({ prefix: LOCKER_PREFIX, token: process.env.BLOB_READ_WRITE_TOKEN! });
  return blobs
    .map((b) => {
      const code = b.pathname.split("/")[1] || "";
      if (!isValidCode(code)) return null;
      const uploadedAt = b.uploadedAt.getTime();
      return {
        code,
        pathname: b.pathname,
        fileName: fileNameFromPathname(b.pathname),
        size: b.size,
        uploadedAt,
        remainingMs: uploadedAt + TTL_MS - Date.now(),
      };
    })
    .filter((f): f is LockerFile => f !== null);
}

export async function cleanupExpired(): Promise<number> {
  const files = await listBlobs();
  const expired = files.filter((f) => f.remainingMs <= 0);
  if (expired.length > 0) {
    await del(expired.map((f) => f.pathname), { token: process.env.BLOB_READ_WRITE_TOKEN! });
  }
  return expired.length;
}

export async function listActiveFiles(): Promise<LockerFile[]> {
  await cleanupExpired();
  const files = await listBlobs();
  return files.filter((f) => f.remainingMs > 0).sort((a, b) => a.uploadedAt - b.uploadedAt);
}

export async function getLockerFile(code: string): Promise<LockerFile | null> {
  if (!isValidCode(code)) return null;
  const prefix = codePath(code);
  try {
    const { blobs } = await list({ prefix, token: process.env.BLOB_READ_WRITE_TOKEN! });
    const blob = blobs.find((b) => b.pathname.split("/")[1] === code);
    if (!blob) return null;
    const uploadedAt = blob.uploadedAt.getTime();
    const remainingMs = uploadedAt + TTL_MS - Date.now();
    if (remainingMs <= 0) {
      await del(blob.pathname, { token: process.env.BLOB_READ_WRITE_TOKEN! });
      return null;
    }
    return {
      code,
      pathname: blob.pathname,
      fileName: fileNameFromPathname(blob.pathname),
      size: blob.size,
      uploadedAt,
      remainingMs,
    };
  } catch (e) {
    if (e instanceof BlobNotFoundError) return null;
    throw e;
  }
}

export async function uploadLockerFile(file: File): Promise<LockerFile> {
  await cleanupExpired();
  const active = await listBlobs();
  if (active.length >= MAX_FILES) {
    throw new Error("柜子已满，请稍后再试");
  }
  let code = randomCode();
  let tries = 0;
  while (active.some((f) => f.code === code) && tries < 20) {
    code = randomCode();
    tries += 1;
  }
  const fileName = sanitizeFileName(file.name);
  const pathname = `${codePath(code)}/${fileName}`;
  await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
    token: process.env.BLOB_READ_WRITE_TOKEN!,
    contentType: file.type || "application/octet-stream",
  });
  const uploadedAt = Date.now();
  return {
    code,
    pathname,
    fileName,
    size: file.size,
    uploadedAt,
    remainingMs: TTL_MS,
  };
}

export interface LockerContent {
  bytes: Uint8Array;
  info: LockerFile;
  contentType: string;
  size: number;
}

export async function consumeLockerFile(code: string): Promise<LockerContent | null> {
  const info = await getLockerFile(code);
  if (!info) return null;
  const result = await get(info.pathname, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN!,
  });
  if (!result || !result.stream) return null;
  const chunks: Uint8Array[] = [];
  const reader = result.stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  await del(info.pathname, { token: process.env.BLOB_READ_WRITE_TOKEN! }).catch(() => {});
  return {
    bytes,
    info,
    contentType: result.blob.contentType,
    size: result.blob.size,
  };
}

export async function deleteLockerFile(code: string): Promise<boolean> {
  if (!isValidCode(code)) return false;
  try {
    const { blobs } = await list({ prefix: codePath(code), token: process.env.BLOB_READ_WRITE_TOKEN! });
    const blob = blobs.find((b) => b.pathname.split("/")[1] === code);
    if (!blob) return false;
    await del(blob.pathname, { token: process.env.BLOB_READ_WRITE_TOKEN! });
    return true;
  } catch {
    return false;
  }
}