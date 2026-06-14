import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ActivityHistoryItem } from '@features/training_log';
import type { CardioSession } from '@features/cardio';
import { DetailRow, Badge, Button, ExpandableCard } from '@ui/molecules';
import { Text, SegmentBar } from '@ui/atoms';
import { Row, Column } from '@ui/layout';
import { ShareModal } from '@ui/components/modals/ShareModal';
import { formatDuration } from '@shared/utils';
import { sportColorClass, sportColorToken } from '@ui/icons/sportColor';
import { ClipboardText, Share, Trophy } from 'phosphor-react';
import {
  MdDirectionsRun, MdFitnessCenter, MdSelfImprovement,
} from 'react-icons/md';
import type { IconType } from 'react-icons';

const CATEGORY_ICON: Record<string, IconType> = {
  strength: MdFitnessCenter,
  cardio: MdDirectionsRun,
  mobility: MdSelfImprovement,
};

function CategoryIcon({ category }: { category: string }) {
  const Icon = CATEGORY_ICON[category] ?? MdFitnessCenter;
  return <Icon size={14} />;
}

export function SessionCard({ session }: { session: ActivityHistoryItem }) {
  const navigate = useNavigate();
  const [shareData, setShareData] = useState<{
    title: string; date: string; summary: string;
    details: Array<{ label: string; value: string }>;
  } | null>(null);

  const accent = session.category === 'strength' ? 'strength' : 'run';

  return (
    <ExpandableCard className={`pad-sm${session.hasPR ? ' accent' : ''}`} header={(
      <>
        <Row justify="between">
          <Column gap={0}>
            <Text as="time" size="caption">{new Date(session.startedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
            <Text as="p">{session.name}</Text>
            <Row>
              <Badge color={accent === 'run' ? 'c-cardio' : undefined}>
                <CategoryIcon category={session.category} /> {session.exerciseCount} exercises
              </Badge>
              {session.hasPR && <Badge active dot><Trophy size={12} /> PR</Badge>}
            </Row>
          </Column>
          <Row>
            <SegmentBar value={session.totalSets} max={Math.max(session.totalSets, 10)} />
            <Text className="chevron">›</Text>
          </Row>
        </Row>
      </>
    )}>
      <Column className="expandable">
        <DetailRow label="Duration" value={formatDuration(session.durationSeconds)} />
        <DetailRow label="Total sets" value={session.totalSets} />
        <DetailRow label="Exercises" value={session.exerciseCount} />
        <Row>
          <Button variant="ghost" size="sm" onClick={(e) => {
            e.stopPropagation();
            navigate(`/sessions/${session.id}`);
          }}><ClipboardText size={14} /> Details</Button>
          <Button variant="ghost" size="sm" onClick={(e) => {
            e.stopPropagation();
            setShareData({
              title: session.name,
              date: new Date(session.startedAt).toLocaleDateString(),
              summary: `${session.exerciseCount} exercises · ${session.totalSets} sets`,
              details: [
                { label: 'Duration', value: formatDuration(session.durationSeconds) },
                { label: 'Sets', value: String(session.totalSets) },
                { label: 'Exercises', value: String(session.exerciseCount) },
              ],
            });
          }}><Share size={14} /> Share</Button>
        </Row>
      </Column>
      {shareData && <ShareModal type="session" data={shareData} onClose={() => setShareData(null)} />}
    </ExpandableCard>
  );
}

export function CardioSessionCard({ session }: { session: CardioSession }) {
  const navigate = useNavigate();
  const color = sportColorClass(session.sport);
  const distKm = session.distanceMeters / 1000;
  const duration = formatDuration(session.durationSeconds);
  const pace = session.durationSeconds > 0 && session.distanceMeters > 0
    ? session.durationSeconds / (session.distanceMeters / 1000) : 0;
  const heartRate = session.gpsTrack?.avgHeartRate;
  const elevationGain = session.gpsTrack?.elevationGain;

  return (
    <ExpandableCard className="pad-sm" header={(
      <>
        <Row justify="between">
          <Column gap={0}>
            <Text as="time" size="caption">{new Date(session.startedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
            <Text as="p">{session.sport.charAt(0).toUpperCase() + session.sport.slice(1)}{session.notes ? ` — ${session.notes}` : ''}</Text>
          </Column>
          <Column gap={0}>
            <Text as="p" className={color}>{distKm.toFixed(1)}km</Text>
            <Text as="time" size="caption">{duration}</Text>
          </Column>
        </Row>
        <Row>
          {pace > 0 && (
            <Badge color={color !== 'lift' ? sportColorToken(session.sport) : undefined}>{Math.floor(pace / 60)}:{String(Math.floor(pace % 60)).padStart(2, '0')}/km</Badge>
          )}
          {heartRate != null && <Badge color="c-strength" dot>♥ {Math.round(heartRate)}bpm</Badge>}
          {elevationGain != null && elevationGain > 0 && <Badge dot>↑ {Math.round(elevationGain)}m</Badge>}
        </Row>
      </>
    )}>
      <Column className="expandable">
        <DetailRow label="Distance" value={`${distKm.toFixed(2)} km`} />
        <DetailRow label="Duration" value={duration} />
        {heartRate != null && (
          <DetailRow label="Avg heart rate" value={`${Math.round(heartRate)} bpm`} />
        )}
        <Button variant="ghost" size="sm" onClick={(e) => {
          e.stopPropagation();
          navigate(`/sessions/${session.id}`);
        }}><ClipboardText size={14} /> Details</Button>
      </Column>
    </ExpandableCard>
  );
}
