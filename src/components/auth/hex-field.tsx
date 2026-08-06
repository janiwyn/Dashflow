/**
 * Decorative honeycomb for the auth split-screen panel.
 *
 * Geometry is derived, not hand-placed, so the field stays even at any size.
 * Everything is deterministic — no Math.random — so server and client render
 * identical markup and React never reports a hydration mismatch.
 */

import { hexPoints } from "@/components/brand-mark";

const R = 26; // circumradius of one hexagon
const COL_STEP = Math.sqrt(3) * R; // horizontal centre-to-centre (pointy-top)
const ROW_STEP = 1.5 * R; // vertical centre-to-centre
const COLS = 9;
const ROWS = 11;

/**
 * Cheap deterministic hash — spreads the accent cells around without a pattern
 * that reads as a grid artefact.
 */
const weight = (col: number, row: number) => ((col * 7 + row * 13) * 2654435761) % 100;

type Cell = {
  key: string;
  points: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
};

function buildCells(): Cell[] {
  const cells: Cell[] = [];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cx = col * COL_STEP + (row % 2 ? COL_STEP / 2 : 0);
      const cy = row * ROW_STEP;
      const w = weight(col, row);

      // Fade the field out toward the bottom-right so it never fights the copy.
      const depth = 1 - (row / ROWS) * 0.55 - (col / COLS) * 0.25;

      let fill = "none";
      let strokeWidth = 1;

      if (w > 92) {
        fill = `rgb(255 255 255 / ${(0.16 * depth).toFixed(3)})`;
        strokeWidth = 1.25;
      } else if (w > 78) {
        fill = `rgb(255 255 255 / ${(0.07 * depth).toFixed(3)})`;
      }

      cells.push({
        key: `${col}-${row}`,
        points: hexPoints(cx, cy, R - 2),
        fill,
        stroke: `rgb(255 255 255 / ${(0.16 * depth).toFixed(3)})`,
        strokeWidth,
      });
    }
  }

  return cells;
}

const CELLS = buildCells();
const WIDTH = COLS * COL_STEP;
const HEIGHT = ROWS * ROW_STEP;

export function HexField({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={className}
      viewBox={`${-R} ${-R} ${WIDTH + R * 2} ${HEIGHT + R * 2}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {/* Keeps the pattern from running hard into the panel edges. */}
        <radialGradient id="hex-falloff" cx="18%" cy="14%" r="95%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="60%" stopColor="white" stopOpacity="0.55" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="hex-mask">
          <rect
            x={-R}
            y={-R}
            width={WIDTH + R * 2}
            height={HEIGHT + R * 2}
            fill="url(#hex-falloff)"
          />
        </mask>
      </defs>

      <g mask="url(#hex-mask)">
        {CELLS.map((cell) => (
          <polygon
            key={cell.key}
            points={cell.points}
            fill={cell.fill}
            stroke={cell.stroke}
            strokeWidth={cell.strokeWidth}
            strokeLinejoin="round"
          />
        ))}
      </g>
    </svg>
  );
}
