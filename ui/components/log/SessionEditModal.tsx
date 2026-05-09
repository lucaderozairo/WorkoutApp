import { useState, useRef } from 'react';
import type { CombinedSession } from './calendarUtils';
import type { SessionComment } from '@features/cardio/domain/types';

interface Props {
  entry: CombinedSession;
  onClose: () => void;
  onSave: (updated: CombinedSession) => void;
}

export function SessionEditModal({ entry, onClose, onSave }: Props) {
  const isStrength = entry.kind === 'strength';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = entry.session as any;

  const [title, setTitle]       = useState<string>(isStrength ? session.name : (session.title ?? ''));
  const [notes, setNotes]       = useState<string>(session.notes ?? '');
  const [startedAt, setStartedAt] = useState<number>(session.startedAt ?? Date.now());
  const [comments, setComments] = useState<SessionComment[]>(session.comments ?? []);
  const [media, setMedia]       = useState<string[]>(session.media ?? []);
  const [newComment, setNewComment] = useState('');
  const [distanceM, setDistanceM] = useState<number>(isStrength ? 0 : (session.distanceMeters ?? 0));
  const [durationS, setDurationS] = useState<number>(session.durationSeconds ?? 0);

  const fileRef = useRef<HTMLInputElement>(null);

  function handleAddComment() {
    if (!newComment.trim()) return;
    setComments(c => [...c, { text: newComment.trim(), createdAt: Date.now() }]);
    setNewComment('');
  }

  function handleAddMedia(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (media.length + files.length > 5) { alert('Maximum 5 images.'); return; }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setMedia(m => [...m, ev.target!.result as string]);
      reader.readAsDataURL(file);
    });
  }

  function handleSave() {
    const base = { ...session, notes, comments, media, startedAt };
    const updated: CombinedSession = isStrength
      ? { kind: 'strength', session: { ...base, name: title } }
      : { kind: 'cardio',   session: { ...base, title, distanceMeters: distanceM, durationSeconds: durationS } };
    onSave(updated);
  }

  return (
    <div className="modal-overlay">
      <div className="surface column">
        <div className="row space-between align-center">
          <strong>Edit Session</strong>
          <button className="ghost icon" onClick={onClose}>✕</button>
        </div>

        <div className="column compact">
          <label className="eyebrow">Title</label>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        <div className="column compact">
          <label className="eyebrow">Date & Time</label>
          <input
            type="datetime-local"
            className="input"
            value={new Date(startedAt).toISOString().slice(0, 16)}
            onChange={e => setStartedAt(new Date(e.target.value).getTime())}
          />
        </div>

        {!isStrength && (
          <div className="row compact">
            <div className="column compact grow">
              <label className="eyebrow">Distance (km)</label>
              <input
                type="number"
                className="input input--num"
                value={(distanceM / 1000).toFixed(2)}
                onChange={e => setDistanceM(Math.round(parseFloat(e.target.value) * 1000))}
              />
            </div>
            <div className="column compact grow">
              <label className="eyebrow">Duration (min)</label>
              <input
                type="number"
                className="input input--num"
                value={Math.round(durationS / 60)}
                onChange={e => setDurationS(parseInt(e.target.value) * 60)}
              />
            </div>
          </div>
        )}

        <div className="column compact">
          <label className="eyebrow">Notes</label>
          <textarea className="input" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <div className="column compact">
          <label className="eyebrow">Comments</label>
          {comments.map((c, i) => (
            <div key={i} className="surface flat compact column">
              <span className="caption muted">{new Date(c.createdAt).toLocaleString('en-GB')}</span>
              <p>{c.text}</p>
            </div>
          ))}
          <div className="row compact">
            <input
              className="input grow"
              placeholder="Add a comment…"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddComment()}
            />
            <button className="secondary sm" onClick={handleAddComment}>Add</button>
          </div>
        </div>

        <div className="column compact">
          <label className="eyebrow">Photos ({media.length}/5)</label>
          {media.length > 0 && (
            <div className="cluster compact">
              {media.map((src, i) => (
                <div key={i} className="avatar xl">
                  <img src={src} alt="" className="avatar xl" />
                  <button
                    className="danger icon sm"
                    onClick={() => setMedia(m => m.filter((_, j) => j !== i))}
                  >✕</button>
                </div>
              ))}
            </div>
          )}
          {media.length < 5 && (
            <>
              <input ref={fileRef} type="file" accept="image/*" multiple className="custom-file-upload" onChange={handleAddMedia} />
              <button className="secondary sm" onClick={() => fileRef.current?.click()}>+ Add photo</button>
            </>
          )}
        </div>

        <div className="row compact">
          <button className="secondary grow" onClick={onClose}>Cancel</button>
          <button className="primary grow" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
