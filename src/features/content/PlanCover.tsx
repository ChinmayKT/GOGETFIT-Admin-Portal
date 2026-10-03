import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { resolveMediaUrl } from "../../api/media";
import type { PlanImage } from "../../types/gogetfitPlans";

/**
 * A GoGetFit Plan's cover at its fixed 3:1 ratio. With no image (or one that
 * fails to load) it shows a neutral placeholder of the same size - never a
 * broken-image icon and never another plan's picture.
 */
export function PlanCover({ image, name, width }: { image: PlanImage | null; name: string; width: number | string }) {
  const [failed, setFailed] = useState(false);
  const url = failed ? null : resolveMediaUrl(image?.url);
  const small = typeof width === "number" && width <= 200;

  return (
    <div
      style={{
        width,
        aspectRatio: "3 / 1",
        borderRadius: small ? 8 : "var(--radius-lg)",
        overflow: "hidden",
        border: "1px solid var(--glass-border)",
        background: "linear-gradient(135deg, rgba(255, 122, 0, 0.16), rgba(255, 122, 0, 0.03))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-muted)",
        flexShrink: 0,
      }}
    >
      {url ? (
        <img
          src={url}
          alt={`${name} cover`}
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <span role="img" aria-label={`${name}: no cover image`} style={{ display: "flex" }}>
          <ImageIcon size={small ? 18 : 28} />
        </span>
      )}
    </div>
  );
}
