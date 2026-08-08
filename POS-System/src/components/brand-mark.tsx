/** Pointy-top hexagon: vertices every 60° starting at the top. */
export function hexPoints(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 90);
    return `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");
}

/**
 * The Meridian mark — an outlined hexagon with a solid core, drawn in
 * `currentColor` so it inherits whatever surface it sits on (the primary auth
 * panel, the sidebar badge, a dark header).
 */
export function HexMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 40 40" className={className} fill="none">
      <polygon
        points={hexPoints(20, 20, 18)}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <polygon points={hexPoints(20, 20, 8.5)} fill="currentColor" />
    </svg>
  );
}
