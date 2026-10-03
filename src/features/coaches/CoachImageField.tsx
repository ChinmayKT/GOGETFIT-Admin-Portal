import { useRef, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { COVER_ASPECT_RATIO } from "../../components/media/ProfileHeaderEditor";
import { ImageCropDialog } from "../../components/media/ImageCropDialog";
import { COACH_IMAGE_MAX_BYTES, COACH_IMAGE_TYPES } from "../../api/coaches";

export type CoachImageBusy = "uploading" | "removing" | null;

interface CoachImageFieldProps {
  label: string;
  /** "avatar" previews 1:1 (shown as a circle), "cover" at the header's 3:1. */
  shape: "avatar" | "cover";
  /** Already resolved for display, or null when there is no picture. */
  imageUrl: string | null;
  busy?: CoachImageBusy;
  /** Server-side error from the last attempt, shown under the control. */
  error?: string | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
  disabled?: boolean;
  /** Replaces the default size/format line under the control. */
  hint?: string;
}

/**
 * A picked original may be larger than the upload limit - cropping usually
 * shrinks it - so the original only has a generous sanity cap, and the 5 MB
 * limit is applied to the cropped result that is actually uploaded.
 */
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

/** Client-side check for fast feedback only; the backend re-checks the bytes. */
export function checkCoachImage(file: File): string | null {
  if (!COACH_IMAGE_TYPES.includes(file.type)) return "Use a JPEG, PNG or WEBP image.";
  if (file.size > MAX_SOURCE_BYTES) return "Image is larger than 25 MB.";
  return null;
}

/**
 * One coach picture: preview, Upload/Change and Remove. The profile picture and
 * the cover each get their own instance - they are never uploaded together.
 */
export function CoachImageField({
  label,
  shape,
  imageUrl,
  busy = null,
  error,
  onSelect,
  onRemove,
  disabled,
  hint,
}: CoachImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  // The picked file waits here while the admin positions it; only the crop is uploaded.
  const [cropping, setCropping] = useState<File | null>(null);
  const isAvatar = shape === "avatar";
  const shown = localError ?? error ?? null;

  return (
    <div>
      <p className="text-label" style={{ fontWeight: 600, marginBottom: 10 }}>{label}</p>
      <div
        style={{
          aspectRatio: isAvatar ? "1 / 1" : COVER_ASPECT_RATIO,
          width: isAvatar ? 120 : "100%",
          borderRadius: isAvatar ? "50%" : "var(--radius-lg)",
          overflow: "hidden",
          border: "1px solid var(--glass-border)",
          background: "linear-gradient(135deg, rgba(255, 122, 0, 0.16), rgba(255, 122, 0, 0.03))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          opacity: busy ? 0.6 : 1,
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${label} preview`}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <span role="img" aria-label={`No ${label.toLowerCase()}`} style={{ display: "flex" }}>
            <ImagePlus size={isAvatar ? 26 : 22} />
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <Button
          variant="secondary"
          size="sm"
          icon={<Upload size={14} />}
          loading={busy === "uploading"}
          disabled={disabled || busy !== null}
          onClick={() => inputRef.current?.click()}
          aria-label={`${imageUrl ? "Change" : "Upload"} ${label}`}
        >
          {busy === "uploading" ? "Uploading..." : imageUrl ? "Change" : "Upload"}
        </Button>
        {imageUrl && (
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 size={14} />}
            loading={busy === "removing"}
            disabled={disabled || busy !== null}
            onClick={() => {
              setLocalError(null);
              onRemove();
            }}
            aria-label={`Remove ${label}`}
          >
            {busy === "removing" ? "Removing..." : "Remove"}
          </Button>
        )}
      </div>
      <p className="text-caption" style={{ marginTop: 6 }}>
        {hint ?? `${isAvatar ? "Square (1:1). " : "Wide (3:1). "}JPEG, PNG or WEBP. You can position and zoom before saving.`}
      </p>
      {shown && (
        <p role="alert" className="text-caption" style={{ color: "var(--status-error, #e5484d)", marginTop: 4 }}>
          {shown}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={COACH_IMAGE_TYPES.join(",")}
        aria-label={`${label} file`}
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Cleared so choosing the same file again still fires a change.
          e.target.value = "";
          if (!file) return;
          const problem = checkCoachImage(file);
          setLocalError(problem);
          if (!problem) setCropping(file);
        }}
      />

      <ImageCropDialog
        file={cropping}
        title={`Adjust ${label}`}
        aspect={isAvatar ? 1 : 3}
        round={isAvatar}
        outputWidth={isAvatar ? 800 : 1500}
        onCancel={() => setCropping(null)}
        onApply={(cropped) => {
          setCropping(null);
          if (cropped.size > COACH_IMAGE_MAX_BYTES) {
            setLocalError("The cropped image is still larger than 5 MB. Zoom in or use a smaller image.");
            return;
          }
          onSelect(cropped);
        }}
      />
    </div>
  );
}
