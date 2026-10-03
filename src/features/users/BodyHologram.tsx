import { useId } from "react";
import hologram from "../../assets/body-metrics/pose_front.jpg";

/**
 * The app's Body Report hero, for the portal: the same glowing body
 * (pose_front.jpg, copied from the app), the same anatomical anchors, the same
 * left/right label columns and the same elbowed orange connector lines -
 * ported from the app's BodyMeasurementCanvas / measurement_point.dart so a
 * coach and an admin see one design.
 *
 * Drawn as a single SVG in a fixed coordinate space, so it scales to any width
 * without re-laying out.
 */

type Side = "left" | "right";

/**
 * Anchor points on pose_front.jpg in normalised image coordinates (0..1),
 * identical to the app's kBodyAnchors. Left/right is the SUBJECT's, so it
 * appears mirrored on the front-facing image.
 */
const ANCHORS: { key: string; name: string; x: number; y: number; side: Side }[] = [
  { key: "neck", name: "Neck", x: 0.47, y: 0.195, side: "left" },
  { key: "chest", name: "Chest", x: 0.56, y: 0.295, side: "right" },
  { key: "rightArm", name: "Right Arm", x: 0.322, y: 0.325, side: "left" },
  { key: "leftArm", name: "Left Arm", x: 0.678, y: 0.325, side: "right" },
  { key: "waist", name: "Waist", x: 0.44, y: 0.42, side: "left" },
  { key: "hips", name: "Hips", x: 0.57, y: 0.495, side: "right" },
  { key: "rightThigh", name: "Right Thigh", x: 0.425, y: 0.6, side: "left" },
  { key: "leftThigh", name: "Left Thigh", x: 0.575, y: 0.6, side: "right" },
];

// Geometry, as the app computes it for a phone-width canvas.
const W = 520;
const IMAGE_ASPECT = 941 / 1672;
const IMAGE_W = W * 0.8; // the figure is capped at 80% of the canvas width
const IMAGE_H = IMAGE_W / IMAGE_ASPECT;
const IMAGE_LEFT = (W - IMAGE_W) / 2;
const CROP_TOP = IMAGE_H * 0.09; // feathered dead space above the head
const H = IMAGE_H * (1 - 0.09 - 0.1); // ...and below the feet
const LABEL_COLUMN = W * 0.24;
const MIN_GAP = 46 + 26;

/** The app's value format: whole numbers without decimals, else one place. */
export const formatCm = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "—";
  return `${Number.isInteger(value) ? value : value.toFixed(1)} cm`;
};

/**
 * Label centre-Y per measurement, the app's algorithm: blend each anchor's
 * height with an even spread down the canvas (45 / 55), then sweep both ways
 * so labels on one side are never closer than MIN_GAP.
 */
function resolveSlots(): number[] {
  const ys = ANCHORS.map((a) => a.y * IMAGE_H - CROP_TOP);
  for (const side of ["left", "right"] as const) {
    const idx = ANCHORS.map((a, i) => (a.side === side ? i : -1))
      .filter((i) => i >= 0)
      .sort((a, b) => ys[a] - ys[b]);
    if (idx.length === 0) continue;
    const top = MIN_GAP * 0.8;
    const bottom = H - MIN_GAP * 0.8;
    idx.forEach((i, k) => {
      const even = idx.length === 1 ? (top + bottom) / 2 : top + ((bottom - top) * k) / (idx.length - 1);
      ys[i] = ys[i] * 0.45 + even * 0.55;
    });
    for (let k = 1; k < idx.length; k++) {
      if (ys[idx[k]] - ys[idx[k - 1]] < MIN_GAP) ys[idx[k]] = ys[idx[k - 1]] + MIN_GAP;
    }
    for (let k = idx.length - 1; k >= 0; k--) {
      const maxY = H - MIN_GAP / 2 - (idx.length - 1 - k) * MIN_GAP;
      if (ys[idx[k]] > maxY) ys[idx[k]] = maxY;
      if (k > 0 && ys[idx[k]] - ys[idx[k - 1]] < MIN_GAP) ys[idx[k - 1]] = ys[idx[k]] - MIN_GAP;
    }
  }
  return ys;
}

const SLOTS = resolveSlots();

/** Anchor → horizontal run clear of the body → rounded elbow → label. */
function connector(ax: number, ay: number, side: Side, ty: number): { d: string; tx: number } {
  const dir = side === "left" ? -1 : 1;
  const tx = side === "left" ? LABEL_COLUMN + 6 : W - LABEL_COLUMN - 6;
  const ex = ax + dir * IMAGE_W * 0.11;
  const r = 10;
  if (Math.abs(ty - ay) <= r * 2) return { d: `M${ax},${ay} L${ex},${ay} L${tx},${ty}`, tx };
  const t = ty > ay ? 1 : -1;
  return {
    d:
      `M${ax},${ay} L${ex - dir * r},${ay} Q${ex},${ay} ${ex},${ay + t * r} ` +
      `L${ex},${ty - t * r} Q${ex},${ty} ${ex + dir * r},${ty} L${tx},${ty}`,
    tx,
  };
}

export function BodyHologram({ measurements }: { measurements: Record<string, number | null> }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Body measurements on the body"
      style={{ width: "100%", maxWidth: W, display: "block", margin: "0 auto" }}
    >
      <defs>
        {/* Horizontal-only feather: the image's sides dissolve, head and feet stay bright. */}
        <linearGradient id={`fade-${id}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.14" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.86" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`mask-${id}`} maskContentUnits="userSpaceOnUse">
          <rect x={IMAGE_LEFT} y={-CROP_TOP} width={IMAGE_W} height={IMAGE_H} fill={`url(#fade-${id})`} />
        </mask>
        <radialGradient id={`glow-${id}`} r="0.55">
          <stop offset="0" stopColor="#FF7A00" stopOpacity="0.16" />
          <stop offset="1" stopColor="#FF7A00" stopOpacity="0" />
        </radialGradient>
        <filter id={`blur-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      <rect x={IMAGE_LEFT} y={-CROP_TOP} width={IMAGE_W} height={IMAGE_H} fill={`url(#glow-${id})`} />
      <image
        href={hologram}
        x={IMAGE_LEFT}
        y={-CROP_TOP}
        width={IMAGE_W}
        height={IMAGE_H}
        preserveAspectRatio="xMidYMid meet"
        mask={`url(#mask-${id})`}
      />

      {ANCHORS.map((a, i) => {
        const ax = IMAGE_LEFT + a.x * IMAGE_W;
        const ay = -CROP_TOP + a.y * IMAGE_H;
        const ty = SLOTS[i];
        const { d, tx } = connector(ax, ay, a.side, ty);
        const textX = a.side === "left" ? LABEL_COLUMN : W - LABEL_COLUMN;
        const anchor = a.side === "left" ? "end" : "start";
        return (
          <g key={a.key} data-measurement={a.key}>
            <path d={d} fill="none" stroke="#FF7A00" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
            <circle cx={ax} cy={ay} r="7" fill="#FF7A00" fillOpacity="0.35" filter={`url(#blur-${id})`} />
            <circle cx={ax} cy={ay} r="2.6" fill="#FF9A3D" />
            <circle cx={tx} cy={ty} r="2" fill="#FF7A00" fillOpacity="0.7" />
            <text x={textX} y={ty - 6} textAnchor={anchor} fill="#fff" fillOpacity="0.65" fontSize="12" fontWeight="600">
              {a.name}
            </text>
            <text x={textX} y={ty + 13} textAnchor={anchor} fill="#fff" fontSize="16" fontWeight="800">
              {formatCm(measurements[a.key])}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
