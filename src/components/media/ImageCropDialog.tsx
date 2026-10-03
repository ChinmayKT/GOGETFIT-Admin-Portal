import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { GlassModal } from "../ui/GlassModal";
import { Button } from "../ui/Button";
import { cropToBlob, loadImage, type LoadedImage } from "./cropImage";
import styles from "./ImageCropDialog.module.css";

interface ImageCropDialogProps {
  /** The picked file; the dialog is open while this is set. */
  file: File | null;
  title: string;
  /** Width / height of the result - 1 for a profile picture, 3 for the 3:1 cover. */
  aspect: number;
  /** Shows a round mask; the stored image is still the square behind it. */
  round?: boolean;
  /** Largest width the result is encoded at (never upscaled beyond the source). */
  outputWidth: number;
  onCancel: () => void;
  onApply: (cropped: File) => void;
}

const MAX_ZOOM = 4;

/** 0% = image just fills the frame, 100% = maximum zoom. */
export const zoomPercent = (zoom: number) => Math.round(((zoom - 1) / (MAX_ZOOM - 1)) * 100);
const KEY_STEP = 10;

interface Offset {
  x: number;
  y: number;
}

/**
 * Lets the admin position an image inside the exact frame it is displayed in:
 * drag (or arrow keys) to move it, the slider (or mouse wheel) to zoom. The
 * image always covers the whole frame, so there are never empty edges. Only the
 * framed area is uploaded.
 */
export function ImageCropDialog({ file, title, aspect, round, outputWidth, onCancel, onApply }: ImageCropDialogProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [frameWidth, setFrameWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  /** Image top-left within the frame; null means "centred" (the default). */
  const [offsetState, setOffset] = useState<Offset | null>(null);
  const [applying, setApplying] = useState(false);
  const drag = useRef<{ pointerId: number; startX: number; startY: number; origin: Offset } | null>(null);

  const frameHeight = frameWidth / aspect;

  // Load the picked file.
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    let cancelled = false;
    setSrc(url);
    setImage(null);
    setLoadError(null);
    setZoom(1);
    setOffset(null);
    loadImage(url)
      .then((loaded) => !cancelled && setImage(loaded))
      .catch((error: Error) => !cancelled && setLoadError(error.message));
    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // The frame fills the dialog width (capped so a square frame stays on screen).
  useLayoutEffect(() => {
    const element = frameRef.current;
    if (!element) return;
    const measure = () => {
      const parent = element.parentElement;
      let available = 480;
      if (parent && parent.clientWidth) {
        const style = getComputedStyle(parent);
        available = parent.clientWidth - parseFloat(style.paddingLeft || "0") - parseFloat(style.paddingRight || "0");
      }
      setFrameWidth(Math.min(available, aspect <= 1 ? 360 : 720));
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(element.parentElement ?? element);
    return () => observer?.disconnect();
  }, [aspect, file]);

  /** Scale at which the image exactly covers the frame. */
  const baseScale = image && frameWidth ? Math.max(frameWidth / image.width, frameHeight / image.height) : 1;
  const scale = baseScale * zoom;
  const offset: Offset = offsetState ?? {
    x: image ? (frameWidth - image.width * scale) / 2 : 0,
    y: image ? (frameHeight - image.height * scale) / 2 : 0,
  };

  const clamp = useCallback(
    (next: Offset, atScale: number): Offset => {
      if (!image) return next;
      const minX = frameWidth - image.width * atScale;
      const minY = frameHeight - image.height * atScale;
      return {
        x: Math.min(0, Math.max(minX, next.x)),
        y: Math.min(0, Math.max(minY, next.y)),
      };
    },
    [image, frameWidth, frameHeight],
  );

  // A resized frame (window resize) re-centres rather than leaving a stale offset.
  useEffect(() => {
    setOffset(null);
  }, [frameWidth]);

  /** Zooms about the frame centre, so the point being looked at stays put. */
  function applyZoom(nextZoom: number) {
    const bounded = Math.min(MAX_ZOOM, Math.max(1, nextZoom));
    const nextScale = baseScale * bounded;
    const centreX = (frameWidth / 2 - offset.x) / scale;
    const centreY = (frameHeight / 2 - offset.y) / scale;
    setZoom(bounded);
    setOffset(clamp({ x: frameWidth / 2 - centreX * nextScale, y: frameHeight / 2 - centreY * nextScale }, nextScale));
  }

  function reset() {
    setZoom(1);
    setOffset(null);
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (!image) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, origin: offset };
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.pointerId !== e.pointerId) return;
    setOffset(clamp({ x: current.origin.x + e.clientX - current.startX, y: current.origin.y + e.clientY - current.startY }, scale));
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId === e.pointerId) drag.current = null;
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, Offset> = {
      ArrowUp: { x: 0, y: -KEY_STEP },
      ArrowDown: { x: 0, y: KEY_STEP },
      ArrowLeft: { x: -KEY_STEP, y: 0 },
      ArrowRight: { x: KEY_STEP, y: 0 },
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    setOffset(clamp({ x: offset.x + move.x, y: offset.y + move.y }, scale));
  }

  async function apply() {
    if (!image || !file) return;
    setApplying(true);
    try {
      // The frame, mapped back into the source image's own pixels.
      // "+ 0" turns -0 into 0; the rest keeps the rectangle inside the image.
      const width = Math.min(image.width, frameWidth / scale);
      const height = Math.min(image.height, frameHeight / scale);
      const area = {
        x: Math.min(image.width - width, Math.max(0, -offset.x / scale)) + 0,
        y: Math.min(image.height - height, Math.max(0, -offset.y / scale)) + 0,
        width,
        height,
      };
      const blob = await cropToBlob(image, area, outputWidth, file.type);
      const extension = blob.type === "image/png" ? "png" : "jpg";
      const name = file.name.replace(/\.[^.]+$/, "") + `-cropped.${extension}`;
      onApply(new File([blob], name, { type: blob.type }));
    } catch (error) {
      setLoadError((error as Error).message);
    } finally {
      setApplying(false);
    }
  }

  return (
    <GlassModal
      open={Boolean(file)}
      onClose={onCancel}
      title={title}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={applying}>Cancel</Button>
          <Button variant="primary" onClick={apply} loading={applying} disabled={!image}>
            {applying ? "Applying..." : "Apply"}
          </Button>
        </>
      }
    >
      <p className="text-caption" style={{ marginBottom: 12 }}>
        Drag the image (or use the arrow keys) to position it, and zoom to fit. Only the area inside the frame is saved.
      </p>

      <div className={styles.stage}>
        <div
          ref={frameRef}
          className={styles.frame}
          style={{ width: frameWidth || undefined, aspectRatio: String(aspect), borderRadius: round ? "50%" : undefined }}
          role="application"
          aria-label="Crop area. Drag or use arrow keys to move the image."
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          onWheel={(e) => image && applyZoom(zoom - e.deltaY * 0.002)}
        >
          {src && image && (
            <img
              src={src}
              alt="Image being cropped"
              draggable={false}
              className={styles.image}
              style={{
                width: image.width * scale,
                height: image.height * scale,
                transform: `translate(${offset.x}px, ${offset.y}px)`,
              }}
            />
          )}
          {!image && !loadError && <span className={styles.status}>Loading image...</span>}
        </div>
      </div>

      {loadError && (
        <p role="alert" className="text-caption" style={{ color: "var(--status-error, #e5484d)", marginTop: 10 }}>
          {loadError}
        </p>
      )}

      <div className={styles.controls}>
        <ZoomOut size={16} aria-hidden />
        <input
          type="range"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          disabled={!image}
          aria-label="Zoom"
          aria-valuetext={`${zoomPercent(zoom)}%`}
          onChange={(e) => applyZoom(Number(e.target.value))}
          className={styles.slider}
        />
        <ZoomIn size={16} aria-hidden />
        <output className={styles.zoomValue} aria-live="polite" aria-label="Zoom level">
          {zoomPercent(zoom)}%
        </output>
        <Button variant="ghost" size="sm" icon={<RotateCcw size={14} />} onClick={reset} disabled={!image}>
          Reset
        </Button>
      </div>
    </GlassModal>
  );
}
