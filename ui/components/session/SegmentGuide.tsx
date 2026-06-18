import { Surface, Text } from '@ui/atoms';
import { Row, Column } from '@ui/layout';

interface Segment { fromKm: number; toKm: number; paceSecPerKm: number }

interface SegmentGuideProps {
  segments: Segment[];
  completedDistanceKm: number;
  elapsedSeconds: number;
}

function formatPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function SegmentGuide({ segments, completedDistanceKm, elapsedSeconds }: SegmentGuideProps) {
  const rawIdx = segments.findIndex(s => completedDistanceKm < s.toKm);
  const activeIdx = rawIdx < 0 ? segments.length - 1 : rawIdx;
  const seg = segments[activeIdx];
  const segDistanceKm = seg.toKm - seg.fromKm;

  const distInSeg = Math.max(0, completedDistanceKm - seg.fromKm);
  const secondsForPrevSegs = segments
    .slice(0, activeIdx)
    .reduce((acc, s) => acc + (s.toKm - s.fromKm) * s.paceSecPerKm, 0);
  const elapsedInSeg = elapsedSeconds - secondsForPrevSegs;
  const expectedInSeg = distInSeg * seg.paceSecPerKm;
  const delta = elapsedInSeg - expectedInSeg;

  const paceLabel = Math.abs(delta) < 10 ? 'On pace' : delta > 0 ? 'Behind' : 'Ahead';
  const paceVariant = Math.abs(delta) < 10 ? 'success' : delta > 0 ? 'warn' : 'info';

  return (
    <Surface data-variant="ghost">
      <Row justify="between" align="center">
        <Column gap={1}>
          <Text size="eyebrow">Segment {activeIdx + 1} of {segments.length}</Text>
          <Text size="body">{formatPace(seg.paceSecPerKm)} /km · {segDistanceKm.toFixed(1)} km</Text>
        </Column>
        <Text size="caption" data-tone={paceVariant}>{paceLabel}</Text>
      </Row>
    </Surface>
  );
}
