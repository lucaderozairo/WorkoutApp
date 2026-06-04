import { Map } from '../shared/Map';
// eslint-disable-next-line boundaries/element-types -- TODO(arch): cross-layer import baselined; see docs/superpowers/plans/2026-06-03-architecture-rule-enforcement.md
import type { GpsTrack } from '@data/sources/files/gps';
import type { Id } from '@shared/types';
import { Surface } from '@ui/atoms';

interface SessionGpsPreviewProps {
  track: GpsTrack;
  sessionId: Id<'CardioSession'>;
}

export function SessionGpsPreview({ track }: SessionGpsPreviewProps) {
  return (
    <Surface pad="none" as="section">
      <div className="media-lg">
        <Map track={track} interactive={true} colourMode="pace" />
      </div>
    </Surface>
  );
}
