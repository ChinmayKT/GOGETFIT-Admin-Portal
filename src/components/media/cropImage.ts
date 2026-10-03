/**
 * Canvas helpers for ImageCropDialog, kept in their own module so tests (jsdom
 * has no image decoding or canvas) can replace them.
 */

export interface LoadedImage {
  element: HTMLImageElement;
  width: number;
  height: number;
}

export function loadImage(src: string): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve({ element, width: element.naturalWidth, height: element.naturalHeight });
    element.onerror = () => reject(new Error("This image could not be read."));
    element.src = src;
  });
}

/** A rectangle in the source image's own pixels. */
export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Draws [area] of [image] into a new image of at most [maxWidth] wide (never
 * upscaled past the source pixels) and encodes it. PNG stays PNG so
 * transparency survives; JPEG and WEBP become JPEG.
 */
export function cropToBlob(image: LoadedImage, area: CropArea, maxWidth: number, sourceType: string): Promise<Blob> {
  const outWidth = Math.max(1, Math.round(Math.min(maxWidth, area.width)));
  const outHeight = Math.max(1, Math.round(outWidth * (area.height / area.width)));

  const canvas = document.createElement("canvas");
  canvas.width = outWidth;
  canvas.height = outHeight;
  const context = canvas.getContext("2d");
  if (!context) return Promise.reject(new Error("Cropping is not supported in this browser."));

  context.imageSmoothingQuality = "high";
  context.drawImage(image.element, area.x, area.y, area.width, area.height, 0, 0, outWidth, outHeight);

  const type = sourceType === "image/png" ? "image/png" : "image/jpeg";
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("The cropped image could not be created."))), type, 0.92),
  );
}
