import { useState } from 'react';
import { viewStore } from '@data/projections/views';

export function NameSelectModal() {
  const [name, setName] = useState('');

  function handleConfirm() {
    const trimmed = name.trim();
    if (!trimmed) return;
    viewStore.set('display_name', trimmed);
  }

  return (
    <div className="modal-overlay">
      <div className="surface column">
        <h2>Who's using the app?</h2>
        <p className="detail">Enter your name to personalise your dashboard.</p>
        <input
          className="form-input"
          type="text"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleConfirm()}
          autoFocus
        />
        <button
          className="primary"
          onClick={handleConfirm}
          disabled={!name.trim()}
        >
          Let's go
        </button>
      </div>
    </div>
  );
}
