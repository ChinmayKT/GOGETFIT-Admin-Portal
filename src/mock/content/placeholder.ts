const HUES = [340, 20, 200, 160, 260, 40, 300, 180, 100, 0];

/** Escape XML entities so labels containing &, <, > don't corrupt the inline SVG markup (this broke the "Yoga & Mobility Spotlight" banner thumbnail before the fix — the browser silently failed to parse the data URI and fell back to rendering the raw alt text). */
function escapeXml(input: string): string {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Deterministic, distinct SVG placeholder per record (no network dependency) — same approach as progress/transformationData.ts. */
export function svgImagePlaceholder(seed: number, label: string): string {
  const hue = HUES[seed % HUES.length];
  const bg = `hsl(${hue}, 55%, 28%)`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" fill="${bg}"/><text x="50%" y="50%" fill="white" font-family="sans-serif" font-size="14" text-anchor="middle" dominant-baseline="middle">${escapeXml(label)}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function svgVideoPlaceholder(seed: number, label: string): string {
  const hue = HUES[seed % HUES.length];
  const bg = `hsl(${hue}, 40%, 18%)`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" fill="${bg}"/><circle cx="160" cy="92" r="26" fill="rgba(255,255,255,0.9)"/><polygon points="152,78 152,106 178,92" fill="${bg}"/><text x="50%" y="88%" fill="white" font-family="sans-serif" font-size="11" text-anchor="middle">${escapeXml(label)}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function randomSizeLabel(min = 40, max = 4200): string {
  const kb = Math.floor(Math.random() * (max - min + 1)) + min;
  return kb < 1024 ? `${kb} KB` : `${(kb / 1024).toFixed(1)} MB`;
}
