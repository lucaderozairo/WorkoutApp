import { useState } from 'react';
import { useQuery } from '@ui/bindings';
import { viewStore } from '@data/projections/views';

export function EditDisplayNameWidget() {
  const displayName = useQuery<string>('display_name');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  function startEdit() {
    setDraft(displayName ?? '');
    setEditing(true);
  }

  function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    viewStore.set('display_name', trimmed);
    setEditing(false);
  }

  function handleCancel() {
    setEditing(false);
  }

  return (
    <div className="surface column compact widget-1x1 space-between">
      <span className="label">Display Name</span>
      {editing ? (
        <>
          <input
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
            autoFocus
          />

        </>
      ) : (<>
        <input type="text" value={displayName ?? ''} readOnly disabled/>
      </>
      )}

      {editing ? (
        <>
          <div className="row compact space-between">
            <button className="primary sm" onClick={handleSave} disabled={!draft.trim()}>Save</button>
            <button className="ghost sm" onClick={handleCancel}>Cancel</button>
          </div>
        </>
      ) : (
        <>
          <button className='chip sm' onClick={startEdit}>Edit</button>
        </>
      )}
    </div>
  );
}
