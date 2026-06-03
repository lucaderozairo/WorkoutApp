import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// eslint-disable-next-line boundaries/element-types -- TODO(arch): cross-layer import baselined; see docs/superpowers/plans/2026-06-03-architecture-rule-enforcement.md
import type { GpsTrack } from '@data/sources/files/gps';

const PACE_ZONE_COLOURS = ['#60a5fa', '#34d399', '#fbbf24', '#f97316', '#ef4444'];
const HR_ZONE_COLOURS   = ['#60a5fa', '#34d399', '#fbbf24', '#f97316', '#ef4444'];

const TILE_URLS = {
  light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  dark:  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};
const TILE_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>';

function useTheme(): 'light' | 'dark' {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const t = document.documentElement.getAttribute('data-theme');
    return t === 'dark' ? 'dark' : 'light';
  });
  useEffect(() => {
    const obs = new MutationObserver(() => {
      const t = document.documentElement.getAttribute('data-theme');
      setTheme(t === 'dark' ? 'dark' : 'light');
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

function getPaceZone(paceSecsPerKm: number): number {
  if (paceSecsPerKm > 420) return 0;
  if (paceSecsPerKm > 360) return 1;
  if (paceSecsPerKm > 300) return 2;
  if (paceSecsPerKm > 240) return 3;
  return 4;
}

function getHrZone(hr: number, maxHr = 190): number {
  const pct = hr / maxHr;
  if (pct < 0.6) return 0;
  if (pct < 0.7) return 1;
  if (pct < 0.8) return 2;
  if (pct < 0.9) return 3;
  return 4;
}

interface MapProps {
  track: GpsTrack;
  interactive: boolean;
  colourMode: 'pace' | 'hr';
  className?: string;
}

export function Map({ track, interactive, colourMode, className }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const theme = useTheme();

  useEffect(() => {
    if (!containerRef.current || track.points.length < 2) return;

    const map = L.map(containerRef.current, {
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      touchZoom: interactive,
    });
    mapRef.current = map;

    L.tileLayer(TILE_URLS[theme], {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    // Group consecutive same-colour points into single polylines to avoid
    // hairline gaps between segment objects at high zoom levels.
    const points = track.points;
    type Run = { colour: string; latlngs: L.LatLngTuple[] };
    const runs: Run[] = [];

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];

      let colour: string;
      if (colourMode === 'hr' && curr.heartRate != null) {
        colour = HR_ZONE_COLOURS[getHrZone(curr.heartRate)];
      } else {
        const segDist = Math.sqrt(
          (curr.lat - prev.lat) ** 2 + (curr.lng - prev.lng) ** 2
        ) * 111_000;
        const segTime =
          (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000;
        const segPace = segDist > 0 ? segTime / (segDist / 1000) : 999;
        colour = PACE_ZONE_COLOURS[getPaceZone(segPace)];
      }

      const last = runs[runs.length - 1];
      if (last && last.colour === colour) {
        last.latlngs.push([curr.lat, curr.lng]);
      } else {
        // Include prev point so colour transitions share an endpoint (no gap)
        runs.push({ colour, latlngs: [[prev.lat, prev.lng], [curr.lat, curr.lng]] });
      }
    }

    for (const run of runs) {
      L.polyline(run.latlngs, { color: run.colour, weight: 3, lineJoin: 'round', lineCap: 'round' }).addTo(map);
    }

    const first = points[0];
    const last  = points[points.length - 1];
    L.circleMarker([first.lat, first.lng], {
      radius: 7, fillColor: '#22c55e', color: 'white', weight: 2, fillOpacity: 1,
    }).addTo(map);
    L.circleMarker([last.lat, last.lng], {
      radius: 7, fillColor: '#ef4444', color: 'white', weight: 2, fillOpacity: 1,
    }).addTo(map);

    const latlngs = points.map(p => [p.lat, p.lng] as L.LatLngTuple);
    map.fitBounds(L.latLngBounds(latlngs));

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [track, interactive, colourMode, theme]);

  return (
    <div
      ref={containerRef}
      className={`map-root w-full h-full${className ? ` ${className}` : ''}`}
    />
  );
}
