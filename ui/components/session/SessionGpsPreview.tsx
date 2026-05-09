import { Map } from '../shared/Map';
import type { GpsTrack } from '@data/sources/files/gps';
import type { Id } from '@shared/types';

interface SessionGpsPreviewProps {
  track: GpsTrack;
  sessionId: Id<'CardioSession'>;
}

export function SessionGpsPreview({ track }: SessionGpsPreviewProps) {
  return (
    <section className="surface bare">
      <div className="map media-lg">
        <Map track={track} interactive={true} colourMode="pace" />
      </div>
    </section>
  );
}
