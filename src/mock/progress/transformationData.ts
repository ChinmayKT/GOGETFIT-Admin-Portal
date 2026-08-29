import type { Transformation, TransformationStatus } from "../../types/progress";
import { MOCK_USERS } from "../users/data";
import { randomInt, pick, daysAgo } from "../shared/utils";

const TITLES = [
  "12-Week Fat Loss Journey", "From Beginner to Bodybuilder", "Postpartum Comeback", "90-Day Recomposition",
  "Strength Transformation", "Half Marathon Ready", "Summer Shred", "New Year, New Me",
  "Lean Bulk Results", "Consistency Pays Off", "Back from an Injury", "First Six-Pack",
];

/**
 * Deterministic, distinct SVG placeholder per record (no network dependency).
 * Legacy defect being fixed: the old screen showed one identical static thumbnail for
 * every row — here each transformation renders its own before/after pair.
 */
function svgPlaceholder(seed: number, label: "Before" | "After"): string {
  const hues = [340, 20, 200, 160, 260, 40, 300, 180, 100, 0];
  const hue = hues[seed % hues.length];
  const lightness = label === "Before" ? 26 : 40;
  const bg = `hsl(${hue}, 50%, ${lightness}%)`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="480"><rect width="360" height="480" fill="${bg}"/><text x="50%" y="50%" fill="white" font-family="sans-serif" font-size="26" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function makeTransformation(index: number): Transformation {
  const user = MOCK_USERS[index % MOCK_USERS.length];
  const status: TransformationStatus =
    index % 9 === 0 ? "Rejected"
    : index % 7 === 0 ? "Changes Requested"
    : index % 4 === 0 ? "Pending Review"
    : index % 3 === 0 ? "Approved"
    : "Published";

  return {
    id: `xform_${index}`,
    userId: user.id,
    ggfId: user.ggfId,
    userName: `${user.firstName} ${user.lastName}`,
    title: pick(TITLES),
    description: `${user.firstName} shares their transformation after following a structured ${user.goal.toLowerCase()} program with consistent coaching and tracking.`,
    beforeImageUrl: svgPlaceholder(index, "Before"),
    afterImageUrl: svgPlaceholder(index, "After"),
    status,
    submittedAt: daysAgo(randomInt(5, 300)),
    reviewedAt: status === "Pending Review" ? null : daysAgo(randomInt(0, 5)),
    reviewNote:
      status === "Rejected" ? "Photos didn't clearly show a comparable pose or lighting."
      : status === "Changes Requested" ? "Please resubmit with a clearer 'after' photo."
      : null,
  };
}

export const MOCK_TRANSFORMATIONS: Transformation[] = Array.from({ length: 42 }, (_, i) => makeTransformation(i + 1));
