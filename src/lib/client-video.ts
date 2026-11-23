/** Browser-side film upload for the studio. The server compresses when it can. */

export type UploadedVideo = { id: string; contentType: string; compressed?: boolean };

const MAX_BYTES = 200 * 1024 * 1024;
const ALLOWED = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export async function uploadVideo(
  file: File,
  onProgress?: (ratio: number) => void,
): Promise<UploadedVideo> {
  if (!ALLOWED.has(file.type) && !/\.(mp4|webm|mov)$/i.test(file.name)) {
    throw new Error("type");
  }
  if (file.size === 0 || file.size > MAX_BYTES) throw new Error("size");

  const form = new FormData();
  form.append("file", file, file.name || "film.mp4");

  onProgress?.(0.05);
  const response = await fetch("/api/admin/media", { method: "POST", body: form });
  onProgress?.(1);
  const data = (await response.json().catch(() => null)) as
    | { ok?: boolean; id?: string; contentType?: string; kind?: string; compressed?: boolean }
    | null;
  if (!response.ok || !data?.ok || !data.id || data.kind !== "video") {
    throw new Error("upload");
  }
  return {
    id: data.id,
    contentType: data.contentType || "video/mp4",
    compressed: data.compressed,
  };
}

/** Grab a still from the film for the cover, then let the photo pipeline compress it. */
export async function posterFromVideo(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("video"));
    });
    const seekTo = Math.min(0.2, (video.duration || 1) * 0.1);
    video.currentTime = seekTo;
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, video.videoWidth || 1280);
    canvas.height = Math.max(1, video.videoHeight || 720);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("encode"))), "image/jpeg", 0.9);
    });
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}
