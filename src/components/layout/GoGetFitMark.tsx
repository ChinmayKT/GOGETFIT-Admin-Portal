/** Recreation of the GoGetFit dumbbell glyph (the "I" in FIT) as a crisp inline mark for dark surfaces. */
export function GoGetFitMark({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="8" y="2" width="8" height="4" rx="2" fill={color} />
      <rect x="10.5" y="6" width="3" height="4" rx="1.5" fill={color} />
      <rect x="7" y="10" width="10" height="4" rx="2" fill={color} />
      <rect x="10.5" y="14" width="3" height="4" rx="1.5" fill={color} />
      <rect x="8" y="18" width="8" height="4" rx="2" fill={color} />
    </svg>
  );
}
