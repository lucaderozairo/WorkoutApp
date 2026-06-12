import { describe, it, expect } from "vitest";
import {
  distanceMeters,
  distanceKm,
  pathDistanceKm,
  interpolate,
  distanceMarkers,
  toXY,
  distToSegmentSq,
  closestPathIndex,
  type LatLng,
} from "./index";

describe("distanceMeters", () => {
  it("returns 0 for identical points", () => {
    expect(distanceMeters([51.5, -0.1], [51.5, -0.1])).toBe(0);
  });

  it("returns ~111km for 1 degree latitude change", () => {
    const d = distanceMeters([0, 0], [1, 0]);
    expect(d).toBeGreaterThan(110_000);
    expect(d).toBeLessThan(112_000);
  });
});

describe("distanceKm", () => {
  it("is distanceMeters / 1000", () => {
    const a: LatLng = [0, 0];
    const b: LatLng = [0.5, 0.5];
    expect(distanceKm(a, b)).toBeCloseTo(distanceMeters(a, b) / 1000, 9);
  });
});

describe("pathDistanceKm", () => {
  it("returns 0 for fewer than 2 points", () => {
    expect(pathDistanceKm([])).toBe(0);
    expect(pathDistanceKm([[0, 0]])).toBe(0);
  });

  it("accumulates segments and rounds to 2dp", () => {
    const path: LatLng[] = [[0, 0], [0, 1], [0, 2]];
    const expected = distanceKm([0, 0], [0, 1]) + distanceKm([0, 1], [0, 2]);
    expect(pathDistanceKm(path)).toBe(Math.round(expected * 100) / 100);
  });
});

describe("interpolate", () => {
  it("returns endpoints at ratio 0 and 1", () => {
    expect(interpolate([0, 0], [2, 4], 0)).toEqual([0, 0]);
    expect(interpolate([0, 0], [2, 4], 1)).toEqual([2, 4]);
  });

  it("returns midpoint at ratio 0.5", () => {
    expect(interpolate([0, 0], [2, 4], 0.5)).toEqual([1, 2]);
  });
});

describe("distanceMarkers", () => {
  it("returns no markers for a sub-kilometre path", () => {
    expect(distanceMarkers([[0, 0], [0, 0.001]])).toEqual([]);
  });

  it("places a marker at each whole kilometre", () => {
    // ~3.3 km along the equator → 3 markers at km 1, 2, 3.
    const markers = distanceMarkers([[0, 0], [0, 0.03]]);
    expect(markers.map((m) => m.km)).toEqual([1, 2, 3]);
    for (const m of markers) {
      expect(m.latlng[0]).toBeCloseTo(0, 9);
    }
  });
});

describe("toXY", () => {
  it("maps lng→x and lat→y in radians", () => {
    expect(toXY([0, 0])).toEqual([0, 0]);
    const [x, y] = toXY([90, 180]);
    expect(x).toBeCloseTo(Math.PI, 9);
    expect(y).toBeCloseTo(Math.PI / 2, 9);
  });
});

describe("distToSegmentSq", () => {
  it("is 0 when the point lies on an endpoint", () => {
    expect(distToSegmentSq([0, 0], [0, 0], [0, 1])).toBeCloseTo(0, 12);
  });

  it("is 0 when the point lies on the segment", () => {
    expect(distToSegmentSq([0, 0.5], [0, 0], [0, 1])).toBeCloseTo(0, 12);
  });

  it("is positive off the segment", () => {
    expect(distToSegmentSq([1, 0.5], [0, 0], [0, 1])).toBeGreaterThan(0);
  });
});

describe("closestPathIndex", () => {
  it("finds the nearest vertex", () => {
    const path: LatLng[] = [[0, 0], [0, 1], [0, 2]];
    expect(closestPathIndex(path, [0, 1.9])).toBe(2);
    expect(closestPathIndex(path, [0, 0.1])).toBe(0);
  });
});
