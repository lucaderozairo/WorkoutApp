import type { ChangeEvent } from 'react';
import { RPE_VALUES, SUGGESTED_TAGS, useFinishSession } from './useFinishSession';
import { Grid, Row, Column, Spacer } from '@ui/layout';

import { ChipGroup, PhotoGallery, DetailRow, Badge, Button, Input, Textarea } from '@ui/molecules';

const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

export function FinishSessionScreen() {
  const {
    navigate,
    displaySession,
    isAlreadyFinished,
    finished,
    name, setName,
    date, setDate,
    startTime, setStartTime,
    endTime, setEndTime,
    rpe, setRpe,
    tags,
    notes, setNotes,
    photos,
    startTimestamp,
    durationMs,
    actionLabel,
    toggleTag,
    handlePhotoUpload,
    removePhoto,
    submit,
    handleExportJson,
    handleExportCsv,
    handleSaveAsTemplate,
  } = useFinishSession();

  if (!displaySession) {
    return (
      <Column>
        <Row gap={1}>
          <Button variant="ghost" onClick={() => navigate('/sessions')}>Back</Button>
        </Row>
        <p className="caption">Session not found.</p>
      </Column>
    );
  }

  return (
    <Grid>
      <Row justify="between" align="center" gap={1}>
        <Button variant="ghost" onClick={() => navigate(`/sessions/${displaySession.id}`)}>Back</Button>
        <h2>{isAlreadyFinished ? 'Edit session' : 'Finish session'}</h2>
        {!finished && <Button variant="primary" onClick={submit}>{actionLabel}</Button>}
      </Row>

      <Input label="Title" type="text" value={name} onChange={e => setName(e.target.value)} />

      <Grid min="xs" gap={1}>
        <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <Input label="Start time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
        <Input label="End time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
        {startTimestamp && (
          <Input label="Duration" type="time" disabled value={(() => { if (!durationMs || durationMs <= 0) return '00:00'; const m = Math.floor(durationMs / 60000); const h = Math.floor(m / 60); return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; })()} />
        )}
      </Grid>

      <Column gap={1}>
        <Row justify="between" align="center">
          <span className="caption">Review</span>
          {displaySession.segments.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleSaveAsTemplate}>Save as template</Button>
          )}
        </Row>
        {displaySession.segments.map(b => (
          <DetailRow key={b.id} label={b.exerciseName} value={`${b.sets.length} sets`} mono />
        ))}
      </Column>

      {!finished && (
        <>
          <Column gap={1}>
            <span className="caption">Session RPE</span>
            <ChipGroup options={RPE_VALUES} isActive={n => rpe === n} onToggle={setRpe} />
          </Column>

          <Column gap={1}>
            <span className="caption">Tags</span>
            <ChipGroup options={SUGGESTED_TAGS} isActive={t => tags.includes(t)} onToggle={toggleTag} />
          </Column>
        </>
      )}

      <Textarea label="Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Session notes…" rows={3} />

      <PhotoGallery
        photos={photos}
        onAdd={files => handlePhotoUpload({ target: { files } } as unknown as ChangeEvent<HTMLInputElement>)}
        onRemove={removePhoto}
      />

      {finished && (
        <>
          {rpe !== null && (
            <Row gap={1} align="center">
              <span className="caption">RPE</span>
              <Badge active>{rpe}</Badge>
            </Row>
          )}
          {tags.length > 0 && (
            <Row gap={1} align="center" wrap>
              <span className="caption">Tags</span>
              {tags.map(t => (
                <Badge key={t} dot>{t}</Badge>
              ))}
            </Row>
          )}

          <Row gap={1} align="center">
            <Button variant="secondary" onClick={handleExportJson}>Export JSON</Button>
            <Button variant="secondary" onClick={handleExportCsv}>Export CSV</Button>
            {canShare && (
              <Button
                variant="secondary"
                onClick={() => {
                  const mins = Math.round((durationMs ?? 0) / 60000);
                  const sets = displaySession.segments.reduce((n, b) => n + b.sets.length, 0);
                  navigator.share({
                    title: name,
                    text: `${name} — ${mins} min · ${displaySession.segments.length} exercises · ${sets} sets`,
                  }).catch(() => {});
                }}
              >
                Share
              </Button>
            )}
            <Spacer />
            <Button variant="primary" onClick={() => navigate(`/sessions/${displaySession.id}`)}>Done</Button>
          </Row>
        </>
      )}
    </Grid>
  );
}
