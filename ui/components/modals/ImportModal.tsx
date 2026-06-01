import { useState, useRef } from 'react';
import { parseGpsFile } from '@data/sources/files/gps';
import type { GpsTrack } from '@data/sources/files/gps';
import type { CardioSport } from '@features/cardio';
import { Row, Column } from '@ui/layout';
import { Surface } from '@ui/atoms';

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

function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

export function ImportModal({ context, existingSession, onComplete, onClose }: ImportModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [track, setTrack] = useState<GpsTrack | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [rpe, setRpe] = useState(5);
  const [notes, setNotes] = useState('');
  const [sport, setSport] = useState<CardioSport>('run');
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleSave() {
    if (!track) return;
    const finalNotes = context === 'enrich-session' ? existingSession?.notes : notes;
    const finalRpe = context === 'enrich-session' ? undefined : rpe;
    const finalSport = context === 'enrich-session' ? existingSession?.sport : sport;
    onComplete(track, finalRpe, finalNotes, finalSport);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}>
        <Surface as="section">
          <Column>
          {/* Header */}
          <Row justify="between">
            <h3>Import GPS file</h3>
            <button className="ghost sm" onClick={onClose}>✕</button>
          </Row>

          {/* Step 1: file drop zone */}
          {step === 1 && (
            <Column>
              {error && <p className="alert warning text-center">{error}</p>}
              <section
                className={`surface inset interactive${isDragOver ? ' active' : ''}`}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                {parsing
                  ? <Row justify="center"><span>Parsing…</span></Row>
                  : (
                    <Column className="center">
                      <p>Drop your file here</p>
                      <button
                        className="secondary sm"
                        onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
                      >
                        or browse files
                      </button>
                      <Row justify="center">
                        {['GPX', 'TCX', 'FIT'].map(fmt => (
                          <span key={fmt} className="pill"><span className="dot" />{fmt}</span>
                        ))}
                      </Row>
                    </Column>
                  )
                }
              </section>
              <input
                ref={inputRef}
                type="file"
                accept=".gpx,.tcx,.fit"
                hidden
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </Column>
          )}

          {/* Step 2: preview */}
          {step === 2 && track && (
            <Column>
              <Surface pad="sm">
                <div className="stats-row">
                  <Column gap={1}>
                    <span className="label">DISTANCE</span>
                    <p className="value">{(track.totalDistance / 1000).toFixed(2)} km</p>
                  </Column>
                  <Column gap={1}>
                    <span className="label">DURATION</span>
                    <p className="value">{formatDuration(track.duration)}</p>
                  </Column>
                  <Column gap={1}>
                    <span className="label">ELEVATION</span>
                    <p className="value">{Math.round(track.elevationGain)} m</p>
                  </Column>
                  {track.avgHeartRate && (
                    <Column gap={1}>
                      <span className="label">AVG HR</span>
                      <p className="value">{Math.round(track.avgHeartRate)} bpm</p>
                    </Column>
                  )}
                </div>
              </Surface>

              {/* Diff for enrich-session */}
              {context === 'enrich-session' && existingSession && (
                <Surface pad="sm">
                  <p className="caption">Existing session will be updated:</p>
                  <Column>
                    {existingSession.durationSeconds !== track.duration && (
                      <Row justify="between">
                        <span className="caption">Duration</span>
                        <span className="caption">{formatDuration(existingSession.durationSeconds)} → {formatDuration(track.duration)}</span>
                      </Row>
                    )}
                    {existingSession.distanceMeters !== track.totalDistance && (
                      <Row justify="between">
                        <span className="caption">Distance</span>
                        <span className="caption">{(existingSession.distanceMeters / 1000).toFixed(2)} km → {(track.totalDistance / 1000).toFixed(2)} km</span>
                      </Row>
                    )}
                  </Column>
                </Surface>
              )}

              <Row justify="between">
                <button className="ghost sm" onClick={() => { setStep(1); setTrack(null); }}>
                  ← Looks wrong?
                </button>
                <button
                  className="primary"
                  onClick={() => context === 'enrich-session' ? handleSave() : setStep(3)}
                >
                  {context === 'enrich-session' ? 'Save' : 'Continue →'}
                </button>
              </Row>
            </Column>
          )}

          {/* Step 3: sport + RPE + notes (skipped for enrich-session) */}
          {step === 3 && track && (
            <Column>
              <Column>
                <label className="caption">Sport</label>
                <Row>
                  {SPORT_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      className={sport === o.value ? 'primary sm' : 'ghost sm'}
                      onClick={() => setSport(o.value)}
                    >
                      {o.label}
                    </button>
                  ))}
                </Row>
              </Column>
              <Column>
                <label htmlFor="import-rpe" className="caption">How hard was that? ({rpe}/10)</label>
                <input
                  id="import-rpe"
                  type="range"
                  min={1}
                  max={10}
                  value={rpe}
                  onChange={e => setRpe(Number(e.target.value))}
                />
              </Column>
              <textarea
                placeholder="Notes (optional)"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
              />
              <button className="primary" onClick={handleSave}>Save session</button>
            </Column>
          )}

          </Column>
        </Surface>
      </div>
    </div>
  );
}
