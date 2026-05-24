import { useState } from 'react';
import {
  ActivityKey, ACTIVITY_META, ACTIVITY_CATEGORIES,
} from '@shared/constants/activities';
import { ACTIVITY_META_ICONS } from '@ui/icons/activityMetaIcons';

interface Props {
  recentSports: ActivityKey[];
  onSelect: (activity: ActivityKey) => void;
  onBack: () => void;
}

export function ActivityPickerOverlay({ recentSports, onSelect, onBack }: Props) {
  const [query, setQuery] = useState('');

  const allKeys = Object.keys(ACTIVITY_META) as ActivityKey[];
  const filtered = query.trim()
    ? allKeys.filter(k =>
        ACTIVITY_META[k].label.toLowerCase().includes(query.toLowerCase())
      )
    : null;

  return (
    <div className="column">
      <header className="row align-center compact">
        <button className="ghost icon" onClick={onBack}>‹</button>
        <span className="grow">Choose activity</span>
      </header>

      <div className="column compact">
        <input
          className="input"
          placeholder="🔍 Search activities…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <div className="column compact">
        {filtered ? (
          <>
            <p className="eyebrow">Results</p>
            <ActivityGrid keys={filtered} onSelect={onSelect} recentSports={recentSports} />
          </>
        ) : (
          <>
            {recentSports.length > 0 && (
              <>
                <p className="eyebrow">Recent</p>
                <ActivityGrid keys={recentSports.slice(0, 3)} onSelect={onSelect} recentSports={recentSports} highlighted />
              </>
            )}
            {ACTIVITY_CATEGORIES.map(cat => (
              <div key={cat.label} className="column compact">
                <p className="eyebrow">{cat.label}</p>
                <ActivityGrid keys={cat.keys} onSelect={onSelect} recentSports={recentSports} />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function ActivityGrid({ keys, onSelect, highlighted }: {
  keys: ActivityKey[];
  onSelect: (k: ActivityKey) => void;
  recentSports: ActivityKey[];
  highlighted?: boolean;
}) {
  return (
    <div className="grid-4">
      {keys.map(k => {
        const { label } = ACTIVITY_META[k];
        const Icon = ACTIVITY_META_ICONS[k];
        return (
          <button
            key={k}
            className={`surface tight column align-center interactive${highlighted ? ' surface selected' : ''}`}
            onClick={() => onSelect(k)}
          >
            <Icon size={28} />
            <span className="caption">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
