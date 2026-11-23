/** Browser-side picture handling for the studio: shrink a photo, then upload it. */

export type PreparedImage = { blob: Blob; width: number; height: number; blur: string };
export type UploadedImage = { id: string; width: number; height: number };

/** Keep the original large enough for the server to compress well. */
const MAX_EDGE = 4200;
const MAX_BYTES = 12 * 1024 * 1024;

function toBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode"))), "image/jpeg", quality);
  });
}

/** Turn any photo into a JPEG the studio can upload. The server compresses it again for the site. */
export async function prepareImage(file: File): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);

    let quality = 0.92;
    let blob = await toBlob(canvas, quality);
    while (blob.size > MAX_BYTES && quality > 0.6) {
      quality -= 0.08;
      blob = await toBlob(canvas, quality);
    }
    if (blob.size > MAX_BYTES) throw new Error("size");

    const small = document.createElement("canvas");
    small.width = 12;
    small.height = Math.max(1, Math.round((12 * height) / width));
    small.getContext("2d")?.drawImage(canvas, 0, 0, small.width, small.height);
    return { blob, width, height, blur: small.toDataURL("image/jpeg", 0.5) };
  } finally {
    bitmap.close();
  }
}

export async function uploadImage(blob: Blob): Promise<UploadedImage> {
  const form = new FormData();
  form.append("file", blob, "photo.jpg");
  const response = await fetch("/api/admin/media", { method: "POST", body: form });
  const data = (await response.json().catch(() => null)) as
    | { ok?: boolean; id?: string; width?: number; height?: number }
    | null;
  if (!response.ok || !data?.ok || !data.id || !data.width || !data.height) {
    throw new Error("upload");
  }
  return { id: data.id, width: data.width, height: data.height };
}
