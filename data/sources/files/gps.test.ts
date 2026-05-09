import { describe, it, expect } from "vitest";
import {
  haversineDistanceMeters,
  computeTrackStats,
  parseGpx,
  parseTcx,
} from "./gps";
import { parseFit } from "./gps";
import type { GpsPoint } from "./gps";

const pt = (
  lat: number,
  lng: number,
  elevation: number,
  timestamp: string,
  heartRate?: number,
): GpsPoint => ({ lat, lng, elevation, timestamp, heartRate });

describe("haversineDistanceMeters", () => {
  it("returns 0 for identical points", () => {
    expect(haversineDistanceMeters(51.5, -0.1, 51.5, -0.1)).toBe(0);
  });

  it("returns ~111km for 1 degree latitude change", () => {
    const dist = haversineDistanceMeters(0, 0, 1, 0);
    expect(dist).toBeGreaterThan(110_000);
    expect(dist).toBeLessThan(112_000);
  });
});

describe("computeTrackStats", () => {
  it("returns zeros for empty points", () => {
    const stats = computeTrackStats([]);
    expect(stats.totalDistance).toBe(0);
    expect(stats.duration).toBe(0);
    expect(stats.elevationGain).toBe(0);
  });

  it("returns zeros for a single point", () => {
    const stats = computeTrackStats([
      pt(51.5, -0.1, 10, "2026-04-14T10:00:00Z"),
    ]);
    expect(stats.totalDistance).toBe(0);
    expect(stats.duration).toBe(0);
  });

  it("computes duration from first to last timestamp", () => {
    const points = [
      pt(51.5, -0.1, 10, "2026-04-14T10:00:00Z"),
      pt(51.51, -0.1, 10, "2026-04-14T10:10:00Z"),
    ];
    expect(computeTrackStats(points).duration).toBe(600);
  });

  it("accumulates elevation gain, ignores drops", () => {
    const points = [
      pt(51.5, -0.1, 10, "2026-04-14T10:00:00Z"),
      pt(51.51, -0.1, 20, "2026-04-14T10:01:00Z"),
      pt(51.52, -0.1, 15, "2026-04-14T10:02:00Z"),
    ];
    expect(computeTrackStats(points).elevationGain).toBe(10);
  });

  it("computes avg heart rate from points that have it", () => {
    const points = [
      pt(51.5, -0.1, 10, "2026-04-14T10:00:00Z", 140),
      pt(51.51, -0.1, 10, "2026-04-14T10:01:00Z", 160),
    ];
    expect(computeTrackStats(points).avgHeartRate).toBeCloseTo(150);
  });

  it("omits avgHeartRate when no points have HR", () => {
    const points = [
      pt(51.5, -0.1, 10, "2026-04-14T10:00:00Z"),
      pt(51.51, -0.1, 10, "2026-04-14T10:01:00Z"),
    ];
    expect(computeTrackStats(points).avgHeartRate).toBeUndefined();
  });
});

describe("parseGpx", () => {
  it("parses lat/lon/elevation/timestamp from trkpt", () => {
    const xml = `<?xml version="1.0"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><trkseg>
    <trkpt lat="51.5" lon="-0.1"><ele>10.5</ele><time>2026-04-14T10:00:00Z</time></trkpt>
    <trkpt lat="51.51" lon="-0.11"><ele>15.0</ele><time>2026-04-14T10:05:00Z</time></trkpt>
  </trkseg></trk>
</gpx>`;
    const track = parseGpx(xml);
    expect(track.points).toHaveLength(2);
    expect(track.points[0].lat).toBe(51.5);
    expect(track.points[0].lng).toBe(-0.1);
    expect(track.points[0].elevation).toBe(10.5);
    expect(track.points[0].timestamp).toBe("2026-04-14T10:00:00Z");
    expect(track.duration).toBe(300);
  });

  it("parses heart rate from gpxtpx extension", () => {
    const xml = `<?xml version="1.0"?>
<gpx version="1.1"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1">
  <trk><trkseg>
    <trkpt lat="51.5" lon="-0.1"><ele>10</ele><time>2026-04-14T10:00:00Z</time>
      <extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>150</gpxtpx:hr></gpxtpx:TrackPointExtension></extensions>
    </trkpt>
    <trkpt lat="51.51" lon="-0.1"><ele>10</ele><time>2026-04-14T10:01:00Z</time>
      <extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>160</gpxtpx:hr></gpxtpx:TrackPointExtension></extensions>
    </trkpt>
  </trkseg></trk>
</gpx>`;
    const track = parseGpx(xml);
    expect(track.points[0].heartRate).toBe(150);
    expect(track.avgHeartRate).toBeCloseTo(155);
  });

  it("handles missing ele gracefully", () => {
    const xml = `<?xml version="1.0"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><trkseg>
    <trkpt lat="51.5" lon="-0.1"><time>2026-04-14T10:00:00Z</time></trkpt>
    <trkpt lat="51.51" lon="-0.1"><time>2026-04-14T10:01:00Z</time></trkpt>
  </trkseg></trk>
</gpx>`;
    const track = parseGpx(xml);
    expect(track.points[0].elevation).toBe(0);
  });
});

describe("parseTcx", () => {
  it("parses lat/lon/elevation/timestamp from Trackpoint", () => {
    const xml = `<?xml version="1.0"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
  <Activities><Activity><Lap>
    <Track>
      <Trackpoint>
        <Time>2026-04-14T10:00:00Z</Time>
        <Position><LatitudeDegrees>51.5</LatitudeDegrees><LongitudeDegrees>-0.1</LongitudeDegrees></Position>
        <AltitudeMeters>10.5</AltitudeMeters>
      </Trackpoint>
      <Trackpoint>
        <Time>2026-04-14T10:05:00Z</Time>
        <Position><LatitudeDegrees>51.51</LatitudeDegrees><LongitudeDegrees>-0.11</LongitudeDegrees></Position>
        <AltitudeMeters>15.0</AltitudeMeters>
      </Trackpoint>
    </Track>
  </Lap></Activity></Activities>
</TrainingCenterDatabase>`;
    const track = parseTcx(xml);
    expect(track.points).toHaveLength(2);
    expect(track.points[0].lat).toBe(51.5);
    expect(track.points[0].lng).toBe(-0.1);
    expect(track.points[0].elevation).toBe(10.5);
    expect(track.duration).toBe(300);
  });

  it("parses heart rate and cadence", () => {
    const xml = `<?xml version="1.0"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
  <Activities><Activity><Lap><Track>
    <Trackpoint>
      <Time>2026-04-14T10:00:00Z</Time>
      <Position><LatitudeDegrees>51.5</LatitudeDegrees><LongitudeDegrees>-0.1</LongitudeDegrees></Position>
      <AltitudeMeters>10</AltitudeMeters>
      <HeartRateBpm><Value>145</Value></HeartRateBpm>
      <Cadence>82</Cadence>
    </Trackpoint>
    <Trackpoint>
      <Time>2026-04-14T10:01:00Z</Time>
      <Position><LatitudeDegrees>51.51</LatitudeDegrees><LongitudeDegrees>-0.1</LongitudeDegrees></Position>
      <AltitudeMeters>10</AltitudeMeters>
      <HeartRateBpm><Value>155</Value></HeartRateBpm>
      <Cadence>85</Cadence>
    </Trackpoint>
  </Track></Lap></Activity></Activities>
</TrainingCenterDatabase>`;
    const track = parseTcx(xml);
    expect(track.points[0].heartRate).toBe(145);
    expect(track.points[0].cadence).toBe(82);
    expect(track.avgHeartRate).toBeCloseTo(150);
  });

  it("skips Trackpoints without Position", () => {
    const xml = `<?xml version="1.0"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
  <Activities><Activity><Lap><Track>
    <Trackpoint><Time>2026-04-14T10:00:00Z</Time></Trackpoint>
    <Trackpoint>
      <Time>2026-04-14T10:01:00Z</Time>
      <Position><LatitudeDegrees>51.5</LatitudeDegrees><LongitudeDegrees>-0.1</LongitudeDegrees></Position>
      <AltitudeMeters>10</AltitudeMeters>
    </Trackpoint>
  </Track></Lap></Activity></Activities>
</TrainingCenterDatabase>`;
    const track = parseTcx(xml);
    expect(track.points).toHaveLength(1);
  });
});

describe("parseFit", () => {
  it("returns empty track for empty buffer", async () => {
    const track = await parseFit(new ArrayBuffer(0));
    expect(track.points).toHaveLength(0);
    expect(track.totalDistance).toBe(0);
  });
});

const TCX_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase
  xmlns:ns3="http://www.garmin.com/xmlschemas/ActivityExtension/v2"
  xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Activities>
    <Activity Sport="Running">
      <Id>2025-09-08T10:20:03.000Z</Id>
      <Lap StartTime="2025-09-08T10:20:03.000Z">
        <TotalTimeSeconds>120.0</TotalTimeSeconds>
        <DistanceMeters>400.0</DistanceMeters>
        <Calories>32</Calories>
        <MaximumHeartRateBpm><Value>186</Value></MaximumHeartRateBpm>
        <Track>
          <Trackpoint>
            <Time>2025-09-08T10:20:03.000Z</Time>
            <Position>
              <LatitudeDegrees>51.429</LatitudeDegrees>
              <LongitudeDegrees>-0.315</LongitudeDegrees>
            </Position>
            <AltitudeMeters>5.6</AltitudeMeters>
            <HeartRateBpm><Value>163</Value></HeartRateBpm>
            <Extensions>
              <ns3:TPX>
                <ns3:Speed>3.2</ns3:Speed>
                <ns3:RunCadence>85</ns3:RunCadence>
                <ns3:Watts>245</ns3:Watts>
              </ns3:TPX>
            </Extensions>
          </Trackpoint>
        </Track>
      </Lap>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`;

describe('parseTcx — extended fields', () => {
  it('parses sport from Activity attribute', () => {
    expect(parseTcx(TCX_SAMPLE).sport).toBe('running');
  });

  it('parses calories from Lap', () => {
    expect(parseTcx(TCX_SAMPLE).calories).toBe(32);
  });

  it('parses maxHeartRate from Lap', () => {
    expect(parseTcx(TCX_SAMPLE).maxHeartRate).toBe(186);
  });

  it('parses speed per trackpoint', () => {
    expect(parseTcx(TCX_SAMPLE).points[0].speed).toBe(3.2);
  });

  it('parses power per trackpoint', () => {
    expect(parseTcx(TCX_SAMPLE).points[0].power).toBe(245);
  });

  it('computes avgPower from points', () => {
    expect(parseTcx(TCX_SAMPLE).avgPower).toBe(245);
  });

  it('parses laps with distance and duration', () => {
    const laps = parseTcx(TCX_SAMPLE).laps ?? [];
    expect(laps.length).toBe(1);
    expect(laps[0].distanceMeters).toBe(400);
    expect(laps[0].durationSeconds).toBe(120);
  });
});
