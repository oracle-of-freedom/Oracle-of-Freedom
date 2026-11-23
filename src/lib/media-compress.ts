import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

export const PHOTO_MAX_EDGE = 2800;
/** Visually strong JPEG that stays small — studio uploads and site photos. */
export const PHOTO_JPEG_QUALITY = 82;

export type CompressedPhoto = {
  bytes: Buffer;
  width: number;
  height: number;
  contentType: "image/jpeg";
};

/** Resize and recompress a photo with sharp (mozjpeg). Orientation is applied; metadata is stripped. */
export async function compressPhoto(input: Buffer): Promise<CompressedPhoto> {
  const image = sharp(input, { failOn: "none" }).rotate();
  const meta = await image.metadata();
  const width = meta.width || 0;
  const height = meta.height || 0;
  if (!width || !height) throw new Error("image");

  const edge = Math.max(width, height);
  const pipeline =
    edge > PHOTO_MAX_EDGE
      ? image.resize({
          width: width >= height ? PHOTO_MAX_EDGE : undefined,
          height: height > width ? PHOTO_MAX_EDGE : undefined,
          fit: "inside",
          withoutEnlargement: true,
        })
      : image;

  const bytes = await pipeline
    .jpeg({
      quality: PHOTO_JPEG_QUALITY,
      mozjpeg: true,
      progressive: true,
      chromaSubsampling: "4:2:0",
    })
    .toBuffer();

  const out = await sharp(bytes).metadata();
  return {
    bytes,
    width: out.width || width,
    height: out.height || height,
    contentType: "image/jpeg",
  };
}

export type CompressedVideo = {
  bytes: Buffer;
  contentType: "video/mp4";
  compressed: boolean;
};

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    child.stderr.on("data", (chunk) => {
      err += String(chunk);
      if (err.length > 4000) err = err.slice(-4000);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(err.trim() || `ffmpeg exited ${code}`));
    });
  });
}

/** Re-encode to H.264 + AAC MP4 when ffmpeg is available; otherwise return the original bytes. */
export async function compressVideo(input: Buffer, contentType: string): Promise<CompressedVideo> {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "oof-video-"));
  const sourceExt = contentType.includes("webm") ? "webm" : "mp4";
  const source = path.join(tmp, `in.${sourceExt}`);
  const target = path.join(tmp, "out.mp4");
  try {
    await fs.writeFile(source, input);
    await runFfmpeg([
      "-y",
      "-i",
      source,
      "-c:v",
      "libx264",
      "-crf",
      "23",
      "-preset",
      "medium",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      target,
    ]);
    const bytes = await fs.readFile(target);
    if (bytes.length === 0) throw new Error("empty");
    return { bytes, contentType: "video/mp4", compressed: true };
  } catch (error) {
    console.warn("[media] video compress skipped", error instanceof Error ? error.message : error);
    return {
      bytes: input,
      contentType: contentType.startsWith("video/") ? (contentType as "video/mp4") : "video/mp4",
      compressed: false,
    };
  } finally {
    await fs.rm(tmp, { recursive: true, force: true }).catch(() => undefined);
  }
}

/** Guess a media content type from magic bytes. */
export function sniffMediaType(bytes: Uint8Array): string {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  if (bytes.length >= 8 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    return "video/mp4";
  }
  if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return "video/webm";
  }
  return "application/octet-stream";
}
