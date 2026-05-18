import { RPE_VALUES, SUGGESTED_TAGS, formatDuration, useFinishSession } from './useFinishSession';

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
    fileInputRef,
    startTimestamp,
    durationMs,
    actionLabel,
    toggleTag,
    handlePhotoUpload,
    removePhoto,
    submit,
    handleExportJson,
    handleExportCsv,
  } = useFinishSession();

  if (!displaySession) {
    return (
      <div className="column">
        <div className="row compact">
          <button className="ghost" onClick={() => navigate('/sessions')}>Back</button>
        </div>
        <p className="caption">Session not found.</p>
      </div>
    );
  }

  return (
    <div className="column">
      <div className="row space-between align-center compact">
        <button className="ghost" onClick={() => navigate(`/sessions/${displaySession.id}`)}>Back</button>
        <h2>{isAlreadyFinished ? 'Edit session' : 'Finish session'}</h2>
        {!finished && <button className="primary" onClick={submit}>{actionLabel}</button>}
      </div>

      <div className="column compact">
        <label className="surface tight ghost detail" htmlFor="finish-name">Title</label>
        <input id="finish-name" type="text" value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div className="row compact">
        <div className="column compact">
          <label className="surface tight ghost detail" htmlFor="finish-date">Date</label>
          <input id="finish-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="column compact">
          <label className="surface tight ghost detail" htmlFor="finish-start">Start time</label>
          <input id="finish-start" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
        </div>
        <div className="column compact">
          <label className="surface tight ghost detail" htmlFor="finish-end">End time</label>
          <input id="finish-end" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
        </div>
        {startTimestamp && (
        <div className="column compact">
          <span className="surface tight ghost detail">Duration</span>
          <input className='ghost' disabled type="time" value={(() => { if (!durationMs || durationMs <= 0) return '00:00'; const m = Math.floor(durationMs / 60000); const h = Math.floor(m / 60); return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; })()} />
        </div>
      )}
      </div>

      

      <div className="column compact">
        <span className="caption">Review</span>
        {displaySession.segments.map(b => (
          <div key={b.id} className="row align-center space-between">
            <span>{b.exerciseName}</span>
            <span className="caption">{b.sets.length} sets</span>
          </div>
        ))}
      </div>

      {!finished && (
        <>
          <div className="column compact">
            <span className="caption">Session RPE</span>
            <div className="cluster compact">
              {RPE_VALUES.map(n => (
                <button key={n} type="button" className={`pill${rpe === n ? ' primary' : ''}`} onClick={() => setRpe(n)}>{n}</button>
              ))}
            </div>
          </div>

          <div className="column compact">
            <span className="caption">Tags</span>
            <div className="cluster compact">
              {SUGGESTED_TAGS.map(t => (
                <button key={t} type="button" className={`pill${tags.includes(t) ? ' primary' : ''}`} onClick={() => toggleTag(t)}>{t}</button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="column compact">
        <label className="surface tight ghost caption" htmlFor="finish-notes">Notes</label>
        <textarea id="finish-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Session notes…" rows={3} />
      </div>

      <div className="column compact">
        <span className="label">Photos</span>
        <div className="row compact wrap">
          {photos.map((url, i) => (
            <div key={i} className="photo-thumb">
              <img src={url} alt="" />
              <button type="button" className="ghost icon sm photo-del" onClick={() => removePhoto(i)}>✕</button>
            </div>
          ))}
          <button type="button" className="photo-thumb surface tight column align-center center" onClick={() => fileInputRef.current?.click()}>
            <span className="caption">+</span>
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
      </div>

      {finished && (
        <>
          {rpe !== null && (
            <div className="row compact align-center">
              <span className="caption">RPE</span>
              <span className="pill primary">{rpe}</span>
            </div>
          )}
          {tags.length > 0 && (
            <div className="row compact align-center wrap">
              <span className="caption">Tags</span>
              {tags.map(t => (
                <span key={t} className="pill"><span className="dot" />{t}</span>
              ))}
            </div>
          )}

          <div className="row compact align-center">
            <button type="button" className="secondary" onClick={handleExportJson}>Export JSON</button>
            <button type="button" className="secondary" onClick={handleExportCsv}>Export CSV</button>
            <div className="grow" />
            <button type="button" className="primary" onClick={() => navigate(`/sessions/${displaySession.id}`)}>Done</button>
          </div>
        </>
      )}
    </div>
  );
}
