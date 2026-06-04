import React, { useState, useRef } from 'react';
import { Text } from '@ui/atoms';

interface EditableTitleProps {
  value: string;
  onSave: (v: string) => void;
  placeholder: string;
  level?: 'h1' | 'h2';
}

export function EditableTitle({ value, onSave, placeholder, level = 'h2' }: EditableTitleProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setDraft(value);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commit() {
    setEditing(false);
    if (draft.trim() !== value) onSave(draft.trim());
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="input"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        autoFocus
      />
    );
  }

  const Tag = level;
  return (
    <Tag className="interactive" onClick={startEdit} title="Click to edit">
      {value || <Text as="span" color="faint">{placeholder}</Text>}
    </Tag>
  );
}
