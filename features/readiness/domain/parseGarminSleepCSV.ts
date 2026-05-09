export interface ParsedGarminSleepDay {
  date: string | null;
  sleepScore: number | null;
  quality: "Good" | "Fair" | "Poor" | null;
  durationMin: number | null;
  deepMin: number | null;
  lightMin: number | null;
  remMin: number | null;
  awakeMin: number | null;
  hrv: number | null;
  restingHr: number | null;
  overnightHr: number | null;
  respiration: number | null;
  bodyBatteryChange: number | null;
  stressAvg: number | null;
  restlessMoments: number | null;
}

function parseDuration(s: string): number | null {
  const h = s.match(/(\d+)h/);
  const m = s.match(/(\d+)\s*m(?!s)(?:in)?/);
  if (!h && !m) return null;
  return (h ? parseInt(h[1], 10) * 60 : 0) + (m ? parseInt(m[1], 10) : 0);
}

function parseValue(s: string): number | null {
  if (s === "--" || s.trim() === "") return null;
  const match = s.match(/^([+-]?\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

export function parseGarminSleepCSV(text: string): ParsedGarminSleepDay {
  const result: ParsedGarminSleepDay = {
    date: null,
    sleepScore: null,
    quality: null,
    durationMin: null,
    deepMin: null,
    lightMin: null,
    remMin: null,
    awakeMin: null,
    hrv: null,
    restingHr: null,
    overnightHr: null,
    respiration: null,
    bodyBatteryChange: null,
    stressAvg: null,
    restlessMoments: null,
  };

  let durationSeen = false;

  for (const line of text.split("\n")) {
    const commaIdx = line.indexOf(",");
    if (commaIdx === -1) continue;
    const key = line.slice(0, commaIdx).trim();
    const value = line.slice(commaIdx + 1).trim();
    if (!value) continue;

    switch (key) {
      case "Date":
        result.date = value;
        break;
      case "Sleep Score":
        result.sleepScore = parseValue(value);
        break;
      case "Quality":
        result.quality = ["Good", "Fair", "Poor"].includes(value)
          ? (value as "Good" | "Fair" | "Poor")
          : null;
        break;
      case "Sleep Duration":
        if (!durationSeen) {
          result.durationMin = parseDuration(value);
          durationSeen = true;
        }
        break;
      case "Deep Sleep Duration":
        result.deepMin = parseDuration(value);
        break;
      case "Light Sleep Duration":
        result.lightMin = parseDuration(value);
        break;
      case "REM Duration":
        result.remMin = parseDuration(value);
        break;
      case "Awake Time":
        result.awakeMin = parseDuration(value);
        break;
      case "Avg Overnight HRV":
        result.hrv = parseValue(value);
        break;
      case "Resting Heart Rate":
        result.restingHr = parseValue(value);
        break;
      case "Avg Overnight Heart Rate":
        result.overnightHr = parseValue(value);
        break;
      case "Avg Respiration":
        result.respiration = parseValue(value);
        break;
      case "Body Battery Change":
        result.bodyBatteryChange = parseValue(value);
        break;
      case "Stress Avg":
        result.stressAvg = parseValue(value);
        break;
      case "Restless Moments":
        result.restlessMoments = parseValue(value);
        break;
    }
  }

  return result;
}
