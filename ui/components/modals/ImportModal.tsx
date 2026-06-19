import { useState } from 'react';
// eslint-disable-next-line boundaries/element-types -- TODO(arch): cross-layer import baselined; see docs/superpowers/plans/2026-06-03-architecture-rule-enforcement.md
import { parseGpsFile } from '@data/sources/files/gps';
// eslint-disable-next-line boundaries/element-types -- TODO(arch): cross-layer import baselined; see docs/superpowers/plans/2026-06-03-architecture-rule-enforcement.md
import type { GpsTrack } from '@data/sources/files/gps';
import type { CardioSport } from '@features/cardio';
import { Row, Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Badge, Button, FileDropSurface, Metric, Modal, Slider, Textarea } from '@ui/molecules';
import { formatDuration } from '@shared/utils';

type ImportContext = 'new-session' | 'enrich-session' | 'standalone';

const SPORT_OPTIONS: { value: CardioSport; label: string }[] = [
  { value: 'run', label: '🏃 Run' },
  { value: 'cycle', label: '🚴 Cycle' },
  { value: 'swim', label: '🏊 Swim' },
  { value: 'row', label: '🚣 Row' },
  { value: 'hike', label: '🥾 Hike' },
  { value: 'ski', label: '⛷️ Ski' },
];

interface ImportModalProps {
  context: ImportContext;
  existingSession?: {
    id: string;
    durationSeconds: number;
    distanceMeters: number;
    sport: CardioSport;
    notes: string;
  };
  onComplete: (track: GpsTrack, rpe?: number, notes?: string, sport?: CardioSport) => void;
  onClose: () => void;
}

export function ImportModal({ context, existingSession, onComplete, onClose }: ImportModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [track, setTrack] = useState<GpsTrack | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [rpe, setRpe] = useState(5);
  const [notes, setNotes] = useState('');
  const [sport, setSport] = useState<CardioSport>('run');

  async function handleFile(file: File) {
    setError(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['gpx', 'tcx', 'fit'].includes(ext ?? '')) {
      setError(`Unsupported format ".${ext}". Use GPX, TCX, or FIT.`);
      return;
    }
    setParsing(true);
    try {
      const parsed = await parseGpsFile(file);
      setTrack(parsed);
      setStep(2);
    } catch {
      setError('Could not read this file. Make sure it is a valid GPX, TCX, or FIT file.');
    } finally {
      setParsing(false);
    }
  }

  function handleSave() {
    if (!track) return;
    const finalNotes = context === 'enrich-session' ? existingSession?.notes : notes;
    const finalRpe = context === 'enrich-session' ? undefined : rpe;
    const finalSport = context === 'enrich-session' ? existingSession?.sport : sport;
    onComplete(track, finalRpe, finalNotes, finalSport);
  }

  return (
    <Modal open onClose={onClose} size="lg">
      <Column>
          {/* Header */}
          <Row justify="between">
            <Text as="h3">Import GPS file</Text>
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </Row>

          {/* Step 1: file drop zone */}
          {step === 1 && (
            <Column>
              {error && <Text size="caption" color="negative">{error}</Text>}
              <FileDropSurface
                accept=".gpx,.tcx,.fit"
                busy={parsing}
                onFiles={files => {
                  const file = files[0];
                  if (file) handleFile(file);
                }}
              >
                {parsing
                  ? <Row justify="center"><Text>Parsing…</Text></Row>
                  : (
                    <Column justify="center">
                      <Text>Drop your file here</Text>
                      <Button
                        variant="secondary"
                        size="sm"
                      >
                        or browse files
                      </Button>
                      <Row justify="center">
                        {['GPX', 'TCX', 'FIT'].map(fmt => (
                          <Badge key={fmt} dot>{fmt}</Badge>
                        ))}
                      </Row>
                    </Column>
                  )
                }
              </FileDropSurface>
            </Column>
          )}

          {/* Step 2: preview */}
          {step === 2 && track && (
            <Column>
              <Surface pad="sm">
                <Row gap={3} wrap>
                  <Column gap={1}>
                    <Text size="eyebrow">DISTANCE</Text>
                    <Metric value={(track.totalDistance / 1000).toFixed(2)} unit="km" />
                  </Column>
                  <Column gap={1}>
                    <Text size="eyebrow">DURATION</Text>
                    <Metric value={formatDuration(track.duration)} />
                  </Column>
                  <Column gap={1}>
                    <Text size="eyebrow">ELEVATION</Text>
                    <Metric value={Math.round(track.elevationGain)} unit="m" />
                  </Column>
                  {track.avgHeartRate && (
                    <Column gap={1}>
                      <Text size="eyebrow">AVG HR</Text>
                      <Metric value={Math.round(track.avgHeartRate)} unit="bpm" />
                    </Column>
                  )}
                </Row>
              </Surface>

              {/* Diff for enrich-session */}
              {context === 'enrich-session' && existingSession && (
                <Surface pad="sm">
                  <Text size="caption">Existing session will be updated:</Text>
                  <Column>
                    {existingSession.durationSeconds !== track.duration && (
                      <Row justify="between">
                        <Text size="caption">Duration</Text>
                        <Text size="caption">{formatDuration(existingSession.durationSeconds)} → {formatDuration(track.duration)}</Text>
                      </Row>
                    )}
                    {existingSession.distanceMeters !== track.totalDistance && (
                      <Row justify="between">
                        <Text size="caption">Distance</Text>
                        <Text size="caption">{(existingSession.distanceMeters / 1000).toFixed(2)} km → {(track.totalDistance / 1000).toFixed(2)} km</Text>
                      </Row>
                    )}
                  </Column>
                </Surface>
              )}

              <Row justify="between">
                <Button variant="ghost" size="sm" onClick={() => { setStep(1); setTrack(null); }}>
                  ← Looks wrong?
                </Button>
                <Button
                  variant="primary"
                  onClick={() => context === 'enrich-session' ? handleSave() : setStep(3)}
                >
                  {context === 'enrich-session' ? 'Save' : 'Continue →'}
                </Button>
              </Row>
            </Column>
          )}

          {/* Step 3: sport + RPE + notes (skipped for enrich-session) */}
          {step === 3 && track && (
            <Column>
              <Column>
                <Text as="label" size="caption">Sport</Text>
                <Row wrap gap={1}>
                  {SPORT_OPTIONS.map(o => (
                    <Button
                      key={o.value}
                      variant={sport === o.value ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setSport(o.value)}
                    >
                      {o.label}
                    </Button>
                  ))}
                </Row>
              </Column>
              <Slider
                label={`How hard was that? (${rpe}/10)`}
                value={rpe}
                onChange={setRpe}
                min={1}
                max={10}
              />
              <Textarea
                placeholder="Notes (optional)"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
              />
              <Button variant="primary" onClick={handleSave}>Save session</Button>
            </Column>
          )}

      </Column>
    </Modal>
  );
}
