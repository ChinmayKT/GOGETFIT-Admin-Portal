import { useRef } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { cn } from "../../utils/cn";
import styles from "./ProfileHeaderEditor.module.css";

/** The cover is always shown at this ratio, so an upload preview matches the header. */
export const COVER_ASPECT_RATIO = "3 / 1";

const ACCEPT = "image/jpeg,image/png,image/webp";

interface ProfileHeaderEditorProps {
  name: string;
  coverUrl: string | null;
  avatarUrl: string | null;
  onCoverChange?: (file: File) => void;
  onAvatarChange?: (file: File) => void;
  /** Renders the exact same cover+avatar layout with no upload affordances — used on view/detail pages so the look matches Create/Edit exactly. */
  readOnly?: boolean;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/** Facebook/YouTube-style cover banner + overlapping circular avatar. In edit mode, picking a
 * file shows an immediate live preview (not just a filename in an upload list); in `readOnly`
 * mode it's the exact same layout with the upload affordances hidden, so View/Edit/Create all
 * present a profile identically. */
export function ProfileHeaderEditor({ name, coverUrl, avatarUrl, onCoverChange, onAvatarChange, readOnly }: ProfileHeaderEditorProps) {
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.root}>
      <div
        className={cn(styles.cover, !coverUrl && styles.coverEmpty, readOnly && styles.readOnly)}
        onClick={readOnly ? undefined : () => coverInputRef.current?.click()}
        role={readOnly ? (coverUrl ? undefined : "img") : "button"}
        aria-label={readOnly && !coverUrl ? "No cover picture" : undefined}
        tabIndex={readOnly ? undefined : 0}
      >
        {coverUrl && <img src={coverUrl} alt={`${name} cover picture`} className={styles.coverImg} />}
        {!coverUrl && !readOnly && (
          <div className={styles.coverEmptyHint}>
            <ImagePlus size={22} />
            <span>Add a cover photo</span>
          </div>
        )}
        {!readOnly && (
          <>
            <button type="button" className={styles.coverEditBtn} onClick={(e) => { e.stopPropagation(); coverInputRef.current?.click(); }}>
              <Camera size={14} /> Change Cover
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept={ACCEPT}
              className={styles.hiddenInput}
              onChange={(e) => e.target.files?.[0] && onCoverChange?.(e.target.files[0])}
            />
          </>
        )}
      </div>

      <div className={styles.avatarWrap}>
        <div
          className={cn(styles.avatar, readOnly && styles.readOnly)}
          onClick={readOnly ? undefined : () => avatarInputRef.current?.click()}
          role={readOnly ? undefined : "button"}
          tabIndex={readOnly ? undefined : 0}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={`${name} profile picture`} className={styles.avatarImg} />
          ) : (
            <span className={styles.avatarInitials} role="img" aria-label="No profile picture">{initials(name)}</span>
          )}
          {!readOnly && (
            <span className={styles.avatarEditBadge}>
              <Camera size={13} />
            </span>
          )}
        </div>
        {!readOnly && (
          <input
            ref={avatarInputRef}
            type="file"
            accept={ACCEPT}
            className={styles.hiddenInput}
            onChange={(e) => e.target.files?.[0] && onAvatarChange?.(e.target.files[0])}
          />
        )}
      </div>
    </div>
  );
}
