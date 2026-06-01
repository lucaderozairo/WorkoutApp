import { useState } from 'react';
import { useQuery } from '@ui/bindings';
import { viewStore } from '@data/projections/views';
import { Row, Column } from '@ui/layout';
import { Surface, Button, Text } from '@ui/atoms';

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
    <Surface>
      <Column gap={1} justify="between" className="widget-1x1">
        <Text size="eyebrow">Display Name</Text>
        {editing ? (
          <input
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
            autoFocus
          />
        ) : (
          <input type="text" value={displayName ?? ''} readOnly disabled />
        )}

        {editing ? (
          <Row gap={1} justify="between">
            <Button variant="primary" size="sm" onClick={handleSave} disabled={!draft.trim()}>Save</Button>
            <Button variant="ghost" size="sm" onClick={handleCancel}>Cancel</Button>
          </Row>
        ) : (
          <Button variant="secondary" size="sm" onClick={startEdit}>Edit</Button>
        )}
      </Column>
    </Surface>
  );
}
