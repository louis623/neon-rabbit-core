export const studioImageAcceptedTypes = ["image/jpeg", "image/png", "image/webp"] as const;

const acceptedTypeSet = new Set<string>(studioImageAcceptedTypes);
const defaultMaxSourceBytes = 10 * 1024 * 1024;
const defaultMaxOutputBytes = 1_500_000;
const defaultMaxDimension = 2_048;
const minimumDimension = 640;

export type PreparedStudioImage = {
  file: File;
  height: number;
  originalHeight: number;
  originalWidth: number;
  width: number;
};

export type StudioImagePreparationOptions = {
  maxDimension?: number;
  maxOutputBytes?: number;
  maxSourceBytes?: number;
};

export function calculateStudioImageDimensions(
  width: number,
  height: number,
  maxDimension = defaultMaxDimension,
): { width: number; height: number } {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error("The photo dimensions could not be read.");
  }

  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export async function prepareShowcaseStudioImage(
  file: File,
  options: StudioImagePreparationOptions = {},
): Promise<PreparedStudioImage> {
  const maxSourceBytes = options.maxSourceBytes ?? defaultMaxSourceBytes;
  const maxOutputBytes = options.maxOutputBytes ?? defaultMaxOutputBytes;
  const maxDimension = options.maxDimension ?? defaultMaxDimension;

  if (!acceptedTypeSet.has(file.type)) {
    throw new Error("Choose a JPG, PNG, or WebP photo.");
  }
  if (file.size <= 0 || file.size > maxSourceBytes) {
    throw new Error("Choose a photo that is 10 MB or smaller.");
  }
  if (!("createImageBitmap" in window)) {
    throw new Error("This browser cannot prepare the photo. Try a current browser or a smaller JPG.");
  }

  const bitmap = await window.createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const originalWidth = bitmap.width;
    const originalHeight = bitmap.height;
    let dimensions = calculateStudioImageDimensions(originalWidth, originalHeight, maxDimension);

    while (Math.max(dimensions.width, dimensions.height) >= minimumDimension) {
      const canvas = document.createElement("canvas");
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("The photo could not be prepared in this browser.");
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.86, 0.78, 0.7, 0.62]) {
        const blob = await canvasToBlob(canvas, quality);
        if (blob.size <= maxOutputBytes) {
          return {
            file: new File([blob], replaceExtension(file.name, "jpg"), {
              lastModified: file.lastModified,
              type: "image/jpeg",
            }),
            height: canvas.height,
            originalHeight,
            originalWidth,
            width: canvas.width,
          };
        }
      }

      dimensions = calculateStudioImageDimensions(
        Math.round(dimensions.width * 0.8),
        Math.round(dimensions.height * 0.8),
        maxDimension,
      );
    }
  } finally {
    bitmap.close();
  }

  throw new Error("The photo is still too large after resizing. Try a smaller image.");
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The photo could not be encoded."));
    }, "image/jpeg", quality);
  });
}

function replaceExtension(fileName: string, extension: string): string {
  const stem = fileName.trim().replace(/\.[^.]+$/, "") || "studio-photo";
  return `${stem}.${extension}`;
}
