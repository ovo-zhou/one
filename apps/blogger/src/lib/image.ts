import Compressor from "compressorjs";

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function cropToBlob(file: File | Blob, area: CropArea): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width);
  canvas.height = Math.round(area.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法创建 canvas 上下文");
  ctx.drawImage(
    bitmap,
    Math.round(area.x),
    Math.round(area.y),
    Math.round(area.width),
    Math.round(area.height),
    0,
    0,
    canvas.width,
    canvas.height,
  );
  bitmap.close?.();
  const type = file.type || "image/png";
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type));
  if (!blob) throw new Error("裁剪失败");
  return blob;
}

export function compress(file: File | Blob, options: CompressOptions = {}): Promise<Blob> {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.82 } = options;
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      maxWidth,
      maxHeight,
      quality,
      convertSize: Infinity,
      success: (result) => resolve(result as Blob),
      error: (err) => reject(err),
    });
  });
}

export function blobToFile(blob: Blob, name: string): File {
  const ext = name.match(/\.[a-zA-Z0-9]+$/)?.[0] ?? "";
  const base = name.replace(/\.[a-zA-Z0-9]+$/, "");
  const suffix = blob.type === "image/jpeg" ? ".jpg" : blob.type === "image/png" ? ".png" : ext;
  return new File([blob], `${base}${suffix}`, { type: blob.type, lastModified: Date.now() });
}

export async function processAndPack(
  file: File,
  cropArea: CropArea | null,
  options: CompressOptions = {},
): Promise<File> {
  const source = cropArea ? await cropToBlob(file, cropArea) : file;
  const compressed = await compress(source, options);
  return blobToFile(compressed, file.name);
}
