'use client';

import type { FloorPlanSchema } from '@/entities/floor-plan/model/types';
import { buildSvgData, type SvgDoor, type SvgWindow, type SvgDimension, type SvgWallSegment } from '@/shared/lib/svg-renderer/builder';
import { WALL_THICKNESS, INNER_WALL_THICKNESS } from '@/shared/lib/svg-renderer/layout';

interface Props {
  plan: FloorPlanSchema;
  className?: string;
  showDimensions?: boolean;
}

export function FloorPlanSVG({ plan, className, showDimensions = true }: Props) {
  const { viewBox, rooms, walls, doors, windows, dimensions, outerRect } = buildSvgData(plan);

  return (
    <svg viewBox={viewBox} className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Background */}
      <rect x="0" y="0" width="100%" height="100%" fill="#FFFFFF" />

      {/* Room fills */}
      {rooms.map(({ key, rect, fill }) => (
        <rect
          key={`fill-${key}`}
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={rect.height}
          fill={fill}
        />
      ))}

      {/* Walls */}
      {walls.map((wall, i) => (
        <WallLine key={`wall-${i}`} wall={wall} />
      ))}

      {/* Outer boundary — thick border */}
      <rect
        x={outerRect.x}
        y={outerRect.y}
        width={outerRect.width}
        height={outerRect.height}
        fill="none"
        stroke="#1a1a1a"
        strokeWidth={WALL_THICKNESS}
      />

      {/* Windows */}
      {windows.map((win, i) => (
        <WindowMark key={`win-${i}`} window={win} />
      ))}

      {/* Doors */}
      {doors.map((door, i) => (
        <DoorArc key={`door-${i}`} door={door} />
      ))}

      {/* Room labels */}
      {rooms.map(({ key, rect, label, areaSqm }) => (
        <g key={`label-${key}`}>
          <text
            x={rect.x + rect.width / 2}
            y={rect.y + rect.height / 2 - 6}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={12}
            fontWeight={600}
            fontFamily="system-ui, sans-serif"
            fill="#1a1a1a"
          >
            {label}
          </text>
          <text
            x={rect.x + rect.width / 2}
            y={rect.y + rect.height / 2 + 10}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={10}
            fontFamily="system-ui, sans-serif"
            fill="#666"
          >
            {areaSqm} m²
          </text>
        </g>
      ))}

      {/* Dimension lines */}
      {showDimensions && dimensions.map((dim, i) => (
        <DimensionLine key={`dim-${i}`} dim={dim} />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function WallLine({ wall }: { wall: SvgWallSegment }) {
  return (
    <line
      x1={wall.x1}
      y1={wall.y1}
      x2={wall.x2}
      y2={wall.y2}
      stroke="#1a1a1a"
      strokeWidth={wall.isOuter ? WALL_THICKNESS : INNER_WALL_THICKNESS}
      strokeLinecap="square"
    />
  );
}

function DoorArc({ door }: { door: SvgDoor }) {
  const { cx, cy, radius, startAngle } = door;
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = ((startAngle + 90) * Math.PI) / 180;

  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy + radius * Math.sin(startRad);
  const x2 = cx + radius * Math.cos(endRad);
  const y2 = cy + radius * Math.sin(endRad);

  const arcPath = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;

  return (
    <g>
      {/* Clear the wall behind the door */}
      <line
        x1={door.wallX1}
        y1={door.wallY1}
        x2={door.wallX2}
        y2={door.wallY2}
        stroke="#FFFFFF"
        strokeWidth={INNER_WALL_THICKNESS + 2}
      />
      {/* Door arc */}
      <path
        d={arcPath}
        fill="none"
        stroke="#555"
        strokeWidth={1}
        strokeDasharray="3 2"
      />
      {/* Door swing line */}
      <line
        x1={cx}
        y1={cy}
        x2={x1}
        y2={y1}
        stroke="#555"
        strokeWidth={1}
      />
    </g>
  );
}

function WindowMark({ window: win }: { window: SvgWindow }) {
  if (win.orientation === 'horizontal') {
    const midY = win.y + win.height / 2;
    return (
      <g>
        {/* Clear wall behind window */}
        <rect
          x={win.x - 1}
          y={win.y - 1}
          width={win.width + 2}
          height={win.height + 2}
          fill="#FFFFFF"
        />
        {/* Window: three parallel lines */}
        <line x1={win.x} y1={midY - 2} x2={win.x + win.width} y2={midY - 2} stroke="#1a1a1a" strokeWidth={1.5} />
        <line x1={win.x} y1={midY}     x2={win.x + win.width} y2={midY}     stroke="#4da6ff" strokeWidth={1} />
        <line x1={win.x} y1={midY + 2} x2={win.x + win.width} y2={midY + 2} stroke="#1a1a1a" strokeWidth={1.5} />
      </g>
    );
  }

  const midX = win.x + win.width / 2;
  return (
    <g>
      <rect
        x={win.x - 1}
        y={win.y - 1}
        width={win.width + 2}
        height={win.height + 2}
        fill="#FFFFFF"
      />
      <line x1={midX - 2} y1={win.y} x2={midX - 2} y2={win.y + win.height} stroke="#1a1a1a" strokeWidth={1.5} />
      <line x1={midX}     y1={win.y} x2={midX}     y2={win.y + win.height} stroke="#4da6ff" strokeWidth={1} />
      <line x1={midX + 2} y1={win.y} x2={midX + 2} y2={win.y + win.height} stroke="#1a1a1a" strokeWidth={1.5} />
    </g>
  );
}

function DimensionLine({ dim }: { dim: SvgDimension }) {
  const isHorizontal = Math.abs(dim.y1 - dim.y2) < 1;
  const tickLen = 6;

  return (
    <g>
      {/* Main line */}
      <line
        x1={dim.x1} y1={dim.y1}
        x2={dim.x2} y2={dim.y2}
        stroke="#888"
        strokeWidth={0.75}
      />
      {/* Tick marks */}
      {isHorizontal ? (
        <>
          <line x1={dim.x1} y1={dim.y1 - tickLen / 2} x2={dim.x1} y2={dim.y1 + tickLen / 2} stroke="#888" strokeWidth={0.75} />
          <line x1={dim.x2} y1={dim.y2 - tickLen / 2} x2={dim.x2} y2={dim.y2 + tickLen / 2} stroke="#888" strokeWidth={0.75} />
        </>
      ) : (
        <>
          <line x1={dim.x1 - tickLen / 2} y1={dim.y1} x2={dim.x1 + tickLen / 2} y2={dim.y1} stroke="#888" strokeWidth={0.75} />
          <line x1={dim.x2 - tickLen / 2} y1={dim.y2} x2={dim.x2 + tickLen / 2} y2={dim.y2} stroke="#888" strokeWidth={0.75} />
        </>
      )}
      {/* Label */}
      {isHorizontal ? (
        <text
          x={(dim.x1 + dim.x2) / 2}
          y={dim.y1 - 6}
          textAnchor="middle"
          fontSize={9}
          fontFamily="system-ui, sans-serif"
          fill="#666"
        >
          {dim.label}
        </text>
      ) : (
        <text
          x={dim.x1 + 8}
          y={(dim.y1 + dim.y2) / 2}
          textAnchor="start"
          dominantBaseline="middle"
          fontSize={9}
          fontFamily="system-ui, sans-serif"
          fill="#666"
        >
          {dim.label}
        </text>
      )}
      {/* Extension lines to the building */}
      {dim.side === 'top' && (
        <>
          <line x1={dim.x1} y1={dim.y1} x2={dim.x1} y2={dim.y1 + 28} stroke="#ccc" strokeWidth={0.5} />
          <line x1={dim.x2} y1={dim.y2} x2={dim.x2} y2={dim.y2 + 28} stroke="#ccc" strokeWidth={0.5} />
        </>
      )}
      {dim.side === 'bottom' && (
        <>
          <line x1={dim.x1} y1={dim.y1} x2={dim.x1} y2={dim.y1 - 18} stroke="#ccc" strokeWidth={0.5} />
          <line x1={dim.x2} y1={dim.y2} x2={dim.x2} y2={dim.y2 - 18} stroke="#ccc" strokeWidth={0.5} />
        </>
      )}
      {dim.side === 'left' && (
        <>
          <line x1={dim.x1} y1={dim.y1} x2={dim.x1 + 28} y2={dim.y1} stroke="#ccc" strokeWidth={0.5} />
          <line x1={dim.x2} y1={dim.y2} x2={dim.x2 + 28} y2={dim.y2} stroke="#ccc" strokeWidth={0.5} />
        </>
      )}
      {dim.side === 'right' && (
        <>
          <line x1={dim.x1} y1={dim.y1} x2={dim.x1 - 18} y2={dim.y1} stroke="#ccc" strokeWidth={0.5} />
          <line x1={dim.x2} y1={dim.y2} x2={dim.x2 - 18} y2={dim.y2} stroke="#ccc" strokeWidth={0.5} />
        </>
      )}
    </g>
  );
}
