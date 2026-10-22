import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2, RotateCcw, X } from "lucide-react";
import { Button } from "../ui/Button";
import styles from "./VideoPlayerModal.module.css";

/**
 * A full-screen player for an ordered list of videos, with Previous / Next.
 *
 * It knows nothing about workouts: the caller passes the playable items in the
 * order it shows them and a resolver that returns each item's real media URL
 * (or null when there is none). Playback is the browser's own <video>, so play,
 * pause, seek, volume and fullscreen are the native controls.
 *
 * Previous / Next never wrap. Closing (button, Esc, backdrop) stops playback
 * and drops the source so no audio or download carries on behind the page.
 */

export interface PlayableVideo {
  id: string;
  title: string;
  subtitle?: string | null;
}

interface VideoPlayerModalProps<T extends PlayableVideo> {
  /** Playable items, in the order the caller displays them. */
  items: T[];
  /** The item being played; the player is closed when null. */
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  /** The item's media URL, ready for <video src>; null when it has none. */
  resolveSource: (item: T, signal: AbortSignal) => Promise<string | null>;
  /** A line under the controls, e.g. why Next stops at the end of a page. */
  note?: (position: { atStart: boolean; atEnd: boolean }) => string | null;
}

type Phase =
  | { kind: "resolving" }
  | { kind: "loading"; src: string }
  | { kind: "ready"; src: string }
  | { kind: "error"; message: string; src: string | null };

/** What a MediaError means to the person watching. */
function mediaErrorMessage(error: MediaError | null): string {
  switch (error?.code) {
    case 2: // MEDIA_ERR_NETWORK
      return "The video stopped downloading. Check the connection and try again.";
    case 3: // MEDIA_ERR_DECODE
      return "The video file is damaged or uses an encoding this browser cannot play.";
    case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED - also what a 404 or a blocked request looks like
      return "The video file could not be loaded: it may be missing on the media server, blocked, or in a format this browser cannot play.";
    default:
      return "The video could not be played.";
  }
}

export function VideoPlayerModal<T extends PlayableVideo>({ items, index, onIndexChange, onClose, resolveSource, note }: VideoPlayerModalProps<T>) {
  const item = index !== null ? items[index] : undefined;
  if (index === null || !item) return null;
  return (
    <Player
      items={items}
      index={index}
      item={item}
      onIndexChange={onIndexChange}
      onClose={onClose}
      resolveSource={resolveSource}
      note={note}
    />
  );
}

function Player<T extends PlayableVideo>({
  items,
  index,
  item,
  onIndexChange,
  onClose,
  resolveSource,
  note,
}: Omit<VideoPlayerModalProps<T>, "index"> & { index: number; item: T }) {
  const [phase, setPhase] = useState<Phase>({ kind: "resolving" });
  const [attempt, setAttempt] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const resolveRef = useRef(resolveSource);
  useEffect(() => {
    resolveRef.current = resolveSource;
  }, [resolveSource]);

  // Resolve the item's source afresh for every item and every retry, so a
  // retry also picks up a URL that changed on the server.
  useEffect(() => {
    const controller = new AbortController();
    setPhase({ kind: "resolving" });
    resolveRef
      .current(item, controller.signal)
      .then((src) => {
        if (controller.signal.aborted) return;
        setPhase(src ? { kind: "loading", src } : { kind: "error", message: "No video is stored for this workout.", src: null });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setPhase({ kind: "error", message: "Could not fetch this video's details. Check the connection and try again.", src: null });
      });
    return () => controller.abort();
  }, [item, attempt]);

  // Esc closes; the page behind does not scroll.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const src = phase.kind === "resolving" ? null : phase.src;

  // Leaving a video (next, previous, retry, close) stops it and drops its
  // source, so the old one cannot keep playing or downloading.
  useEffect(() => {
    const video = videoRef.current;
    return () => {
      if (!video) return;
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [src, attempt]);

  const atStart = index === 0;
  const atEnd = index === items.length - 1;
  const caption = note?.({ atStart, atEnd }) ?? null;
  const loading = phase.kind === "resolving" || phase.kind === "loading";

  const onVideoError = (e: SyntheticEvent<HTMLVideoElement>) =>
    setPhase({ kind: "error", message: mediaErrorMessage(e.currentTarget.error), src });

  return createPortal(
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-player-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.heading}>
            <h2 id="video-player-title" className={styles.title} title={item.title}>
              {item.title}
            </h2>
            <span className="text-caption">
              {[item.subtitle, `Video ${index + 1} of ${items.length}`].filter(Boolean).join(" · ")}
            </span>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close player" autoFocus>
            <X size={20} />
          </button>
        </div>

        <div className={styles.stage}>
          {src && phase.kind !== "error" && (
            <video
              key={`${item.id}-${attempt}`}
              ref={videoRef}
              className={styles.video}
              src={src}
              controls
              autoPlay
              playsInline
              preload="auto"
              aria-label={`${item.title} video`}
              onLoadedData={() => setPhase({ kind: "ready", src })}
              onPlaying={() => setPhase({ kind: "ready", src })}
              onWaiting={() => setPhase({ kind: "loading", src })}
              onError={onVideoError}
            />
          )}
          {loading && (
            <div className={styles.overlay} role="status">
              <Loader2 size={28} className={styles.spin} aria-hidden />
              <span>Loading video…</span>
            </div>
          )}
          {phase.kind === "error" && (
            <div className={styles.overlay} role="alert">
              <AlertTriangle size={28} aria-hidden />
              <span className={styles.errorText}>{phase.message}</span>
              <Button size="sm" icon={<RotateCcw size={14} />} onClick={() => setAttempt((n) => n + 1)}>
                Try Again
              </Button>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <Button size="sm" icon={<ChevronLeft size={15} />} disabled={atStart} onClick={() => onIndexChange(index - 1)}>
            Previous
          </Button>
          <span className={`text-caption ${styles.note}`}>{caption}</span>
          <Button size="sm" iconRight={<ChevronRight size={15} />} disabled={atEnd} onClick={() => onIndexChange(index + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
