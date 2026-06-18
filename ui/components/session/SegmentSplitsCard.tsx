import { Surface, Text } from '@ui/atoms';
import { Column } from '@ui/layout';

interface Segment { fromKm: number; toKm: number; paceSecPerKm: number }
interface CardioSet { distanceMeters?: number; durationSeconds?: number }
interface Props { segments: Segment[]; cardioSets: CardioSet[] }

function formatPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function SegmentSplitsCard({ segments, cardioSets }: Props) {
  let cursor = 0;
  const rows = segments.map((seg, i) => {
    const targetKm = seg.toKm - seg.fromKm;
    let kmAcc = 0, secAcc = 0;
    while (cursor < cardioSets.length && kmAcc < targetKm) {
      kmAcc += (cardioSets[cursor].distanceMeters ?? 0) / 1000;
      secAcc += cardioSets[cursor].durationSeconds ?? 0;
      cursor++;
    }
    const actualPace = kmAcc > 0 ? secAcc / kmAcc : null;
    const delta = actualPace != null ? Math.round(actualPace - seg.paceSecPerKm) : null;
    return { i, target: seg.paceSecPerKm, actual: actualPace, delta };
  });

  return (
    <Surface as="section">
      <Column gap={2}>
        <Text size="eyebrow">Segment Splits</Text>
        <table className="full-width">
          <thead>
            <tr>
              <th><Text size="caption">Seg</Text></th>
              <th><Text size="caption">Target</Text></th>
              <th><Text size="caption">Actual</Text></th>
              <th><Text size="caption">Diff</Text></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.i}>
                <td><Text size="caption">{r.i + 1}</Text></td>
                <td><Text size="caption">{formatPace(r.target)}</Text></td>
                <td><Text size="caption">{r.actual != null ? formatPace(Math.round(r.actual)) : '—'}</Text></td>
                <td>
                  <Text size="caption" data-tone={r.delta == null ? undefined : r.delta > 5 ? 'warn' : r.delta < -5 ? 'info' : 'success'}>
                    {r.delta == null ? '—' : r.delta > 0 ? `+${r.delta}s` : `${r.delta}s`}
                  </Text>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Column>
    </Surface>
  );
}
