import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { Mountain } from 'lucide-react';
import type { ElevationSample } from '@features/routes/contract';

const VIEW_W = 1000;
const VIEW_H = 220;
const PAD_Y = 16;

interface ElevationProfileProps {
  samples: ElevationSample[];
  hoveredIndex: number | null;
  onHover: (index: number | null) => void;
}

interface Projection {
  line: string;
  area: string;
  minM: number;
  maxM: number;
  xAt: (index: number) => number;
  yAt: (index: number) => number;
}

function project(samples: ElevationSample[]): Projection | null {
  if (samples.length < 2) return null;
  const elevations = samples.map(s => s.elevationM);
  const minM = Math.min(...elevations);
  const maxM = Math.max(...elevations);
  const span = Math.max(maxM - minM, 1);
  const lastKm = samples[samples.length - 1].distanceKm || 1;

  const xAt = (index: number) => (samples[index].distanceKm / lastKm) * VIEW_W;
  const yAt = (index: number) =>
    VIEW_H - PAD_Y - ((samples[index].elevationM - minM) / span) * (VIEW_H - PAD_Y * 2);

  const points = samples.map((_, i) => `${round(xAt(i))},${round(yAt(i))}`);
  const line = points.join(' ');
  const area = `0,${VIEW_H} ${line} ${VIEW_W},${VIEW_H}`;
  return { line, area, minM, maxM, xAt, yAt };
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function ElevationProfile({ samples, hoveredIndex, onHover }: ElevationProfileProps) {
  const ref = useRef<SVGSVGElement>(null);
  const projection = project(samples);

  if (!projection) {
    return (
      <div className="elevation-profile elevation-profile-empty">
        <Mountain size={18} aria-hidden />
        <span>Elevation unavailable</span>
      </div>
    );
  }

  function handlePointer(event: ReactPointerEvent<SVGSVGElement>) {
    const svg = ref.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0) return;
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    onHover(Math.round(ratio * (samples.length - 1)));
  }

  const active = hoveredIndex != null ? samples[hoveredIndex] : undefined;

  return (
    <div className="elevation-profile">
      <svg
        ref={ref}
        className="elevation-profile-svg"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Route elevation profile"
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
        onPointerLeave={() => onHover(null)}
      >
        <polygon className="elevation-profile-area" points={projection.area} />
        <polyline className="elevation-profile-line" points={projection.line} fill="none" />
        {active && hoveredIndex != null ? (
          <>
            <line
              className="elevation-profile-cursor"
              x1={projection.xAt(hoveredIndex)}
              x2={projection.xAt(hoveredIndex)}
              y1={0}
              y2={VIEW_H}
            />
            <circle
              className="elevation-profile-dot"
              cx={projection.xAt(hoveredIndex)}
              cy={projection.yAt(hoveredIndex)}
              r={6}
            />
          </>
        ) : null}
      </svg>
      <div className="elevation-profile-readout" aria-hidden>
        {active ? (
          <>
            <span className="mono">{active.distanceKm.toFixed(2)} km</span>
            <span className="mono">{Math.round(active.elevationM)} m</span>
            <span className="mono">{active.grade.toFixed(1)}%</span>
          </>
        ) : (
          <>
            <span>Low {Math.round(projection.minM)} m</span>
            <span>High {Math.round(projection.maxM)} m</span>
          </>
        )}
      </div>
    </div>
  );
}
