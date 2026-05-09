import { useState } from 'react';
import { useQuery, useCommand } from '@ui/bindings';
import { useExpandable } from '@ui/interactions/useExpandable';
import type { NutritionEntryView, LogNutrition, DeleteNutritionEntry, NutritionCategory } from '@features/nutrition';
import { handleLogNutrition, handleDeleteNutritionEntry } from '@features/nutrition';
import type { Id } from '@shared/types';
import '@features/nutrition';

const USER_ID = 'user-001' as Id<'User'>;

const CATEGORY_LABELS: Record<NutritionCategory, string> = {
  meal: 'Meal',
  snack: 'Snack',
  vitamin: 'Vitamin',
  supplement: 'Supplement',
  medication: 'Medication',
  water: 'Water',
};

function categoryColor(cat: NutritionCategory): string {
  switch (cat) {
    case 'meal': return 'lift';
    case 'snack': return 'run';
    case 'vitamin': return 'cycle';
    case 'supplement': return 'swim';
    case 'medication': return 'rowing';
    case 'water': return 'lift';
  }
}

/* ── Nutrition Entry Card ── */

function NutritionEntryCard({ entry, onDelete }: { entry: NutritionEntryView; onDelete: (id: Id<'NutritionEntry'>) => void }) {
  const { expanded, toggle } = useExpandable();
  const color = categoryColor(entry.category as NutritionCategory);

  return (
    <section className={`surface compact${expanded ? ' expanded' : ''}`} onClick={!expanded ? toggle : undefined}>
      <header className="row space-between">
        <div className="row ">
          <span className={`pill ${color}`}>{CATEGORY_LABELS[entry.category as NutritionCategory]}</span>
          <p>{entry.name}</p>
        </div>
        <div className="row">
          <time className="caption">{entry.time}</time>
          <button className="ghost sm" onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}>🗑️</button>
          <span>›</span>
        </div>
      </header>
      {entry.macros && (
        <div className="expandable column">
          <div className="cluster">
            <div className="stat">
              <span className="label">KCAL</span>
              <p className="value">{entry.macros.kcal}</p>
            </div>
            <div className="stat">
              <span className="label">PROTEIN</span>
              <p className="value">{entry.macros.proteinG}g</p>
            </div>
            <div className="stat">
              <span className="label">CARBS</span>
              <p className="value">{entry.macros.carbsG}g</p>
            </div>
            <div className="stat">
              <span className="label">FAT</span>
              <p className="value">{entry.macros.fatG}g</p>
            </div>
          </div>
        </div>
      )}
      {entry.notes && (
        <p className="caption">{entry.notes}</p>
      )}
    </section>
  );
}

/* ── Log Nutrition Form ── */

function LogNutritionForm({ onLogged }: { onLogged: () => void }) {
  const [category, setCategory] = useState<NutritionCategory>('meal');
  const [name, setName] = useState('');
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [withMacros, setWithMacros] = useState(false);
  const [kcal, setKcal] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [notes, setNotes] = useState('');

  const { dispatch: dispatchLog } = useCommand(handleLogNutrition);
  const { dispatch: dispatchDelete } = useCommand(handleDeleteNutritionEntry);

  const handleLog = async () => {
    const macros = withMacros ? { kcal, proteinG: protein, carbsG: carbs, fatG: fat } : null;

    const result = await dispatchLog({
      type: 'LogNutrition',
      userId: USER_ID,
      entry: {
        category,
        name: name.trim(),
        notes: notes.trim(),
        time,
        macros,
      },
    });

    if (result.ok) {
      setName('');
      setKcal(0);
      setProtein(0);
      setCarbs(0);
      setFat(0);
      setNotes('');
      setWithMacros(false);
      onLogged();
    }
  };

  // Expose delete for parent use via a different pattern — entries have their own delete
  const handleDeleteEntry = async (entryId: Id<'NutritionEntry'>) => {
    await dispatchDelete({ type: 'DeleteNutritionEntry', entryId });
    onLogged();
  };

  return (
    <div>
      <section className="surface dashed">
        <h3>Log Entry</h3>
        <div className="column">
          <label>Category</label>
          <div className="cluster">
            {(Object.keys(CATEGORY_LABELS) as NutritionCategory[]).map(cat => (
              <button
                key={cat}
                className={`pill ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        <div className="column ">
          <label>Name</label>
          <input className="input" placeholder="e.g. Chicken breast" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div className="column ">
          <label>Time</label>
          <input className="input" type="time" value={time} onChange={e => setTime(e.target.value)} />
        </div>

        <div className="row space-between">
          <label>Include macros</label>
          <button className={`toggle ${withMacros ? 'on' : ''}`} onClick={() => setWithMacros(!withMacros)}>
            <span className="knob" />
          </button>
        </div>

        {withMacros && (
          <div className="column ">
            <div className="row">
              <div className="column ">
                <label>Kcal</label>
                <input className="input" type="number" value={kcal} min={0} onChange={e => setKcal(Number(e.target.value))} />
              </div>
              <div className="column ">
                <label>Protein (g)</label>
                <input className="input" type="number" value={protein} min={0} onChange={e => setProtein(Number(e.target.value))} />
              </div>
            </div>
            <div className="row">
              <div className="column ">
                <label>Carbs (g)</label>
                <input className="input" type="number" value={carbs} min={0} onChange={e => setCarbs(Number(e.target.value))} />
              </div>
              <div className="column ">
                <label>Fat (g)</label>
                <input className="input" type="number" value={fat} min={0} onChange={e => setFat(Number(e.target.value))} />
              </div>
            </div>
          </div>
        )}

        <div className="column ">
          <label>Notes</label>
          <textarea className="input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <button className="primary" onClick={handleLog}>Log Entry</button>
      </section>
      <DeleteDispatcher dispatcher={handleDeleteEntry} />
    </div>
  );
}

/* ── Delete dispatcher to expose via closure ── */

let _deleteDispatcher: ((id: Id<'NutritionEntry'>) => void) | null = null;

function DeleteDispatcher({ dispatcher }: { dispatcher: (id: Id<'NutritionEntry'>) => void }) {
  _deleteDispatcher = dispatcher;
  return null;
}

export function deleteEntry(id: Id<'NutritionEntry'>) {
  _deleteDispatcher?.(id);
}

/* ── Macro Hero Card ── */

const KCAL_GOAL = 2100;
const PROTEIN_GOAL = 180;
const CARBS_GOAL = 240;
const FAT_GOAL = 70;
const WATER_TARGET_ML = 2000;
const RING_R = 68;
const RING_CIRC = +(2 * Math.PI * RING_R).toFixed(2);

function MacroHeroCard({ kcal, protein, carbs, fat, waterMl }: {
  kcal: number; protein: number; carbs: number; fat: number; waterMl: number;
}) {
  const kcalProgress = Math.min(kcal / KCAL_GOAL, 1);
  const dashOffset = +(RING_CIRC * (1 - kcalProgress)).toFixed(2);

  return (
    <div className="surface">
      <div className="row align-center">
        <div className="ring" style={{ '--ring-color': 'var(--c-nutrition)', '--ring-width': '10' } as React.CSSProperties}>
          <svg className="ring__svg" width="160" height="160" viewBox="0 0 160 160">
            <circle className="ring__track" cx="80" cy="80" r={RING_R} />
            <circle className="ring__fill" cx="80" cy="80" r={RING_R}
              strokeDasharray={RING_CIRC}
              strokeDashoffset={dashOffset} />
          </svg>
          <div className="ring__inner">
            <span className="eyebrow">Calories</span>
            <span style={{ fontSize: 'var(--t-2xl)' }}>{kcal.toLocaleString()}</span>
            <span className="mono faint" style={{ fontSize: 'var(--t-xs)' }}>/ {KCAL_GOAL.toLocaleString()}</span>
          </div>
        </div>

        <div className="column" style={{ flex: 1 }}>
          {[
            { label: 'Protein', value: protein, goal: PROTEIN_GOAL, color: 'var(--c-nutrition)' },
            { label: 'Carbs', value: carbs, goal: CARBS_GOAL, color: 'var(--warn)' },
            { label: 'Fat', value: fat, goal: FAT_GOAL, color: 'var(--c-strength)' },
          ].map(m => (
            <div key={m.label} className="column compact">
              <div className="row space-between">
                <span className="caption">{m.label}</span>
                <span className="mono" style={{ fontSize: 'var(--t-sm)' }}>
                  {m.value}<span className="faint">g / {m.goal}g</span>
                </span>
              </div>
              <div className="bar">
                <div className="bar__fill" style={{
                  '--fill': `${Math.min(m.value / m.goal * 100, 100).toFixed(0)}%`,
                  '--bar-color': m.color,
                } as React.CSSProperties} />
              </div>
            </div>
          ))}

          <div className="column compact">
            <div className="row space-between">
              <span className="caption">Water</span>
              <span className="mono faint" style={{ fontSize: 'var(--t-xs)' }}>{(waterMl / 1000).toFixed(1)} / {WATER_TARGET_ML / 1000} L</span>
            </div>
            <div className="bar">
              <div className="bar__fill" style={{
                '--fill': `${Math.min(waterMl / WATER_TARGET_ML * 100, 100).toFixed(0)}%`,
                '--bar-color': 'var(--c-water)',
              } as React.CSSProperties} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Category Section ── */

function CategorySection({ label, entries, onDelete, showCategory = false }: {
  label: string;
  entries: NutritionEntryView[];
  onDelete: (id: Id<'NutritionEntry'>) => void;
  showCategory?: boolean;
}) {
  const sectionKcal = entries.filter(e => e.macros).reduce((s, e) => s + (e.macros?.kcal ?? 0), 0);

  return (
    <div className="surface column ">
      <div className="row space-between align-center">
        <h3>{label}</h3>
        {sectionKcal > 0 && (
          <span className="mono muted" style={{ fontSize: 'var(--t-sm)' }}>{sectionKcal} kcal</span>
        )}
      </div>
      {entries.map(e => (
        <div key={e.id} className="row space-between align-center">
          <div className="column compact">
            {showCategory
              ? <div className="row align-center compact">
                <span className={`pill ${categoryColor(e.category as NutritionCategory)}`}>{CATEGORY_LABELS[e.category as NutritionCategory]}</span>
                <span>{e.name}</span>
              </div>
              : <span>{e.name}</span>
            }
            <span className="caption">
              {e.time}{e.macros ? ` · P ${e.macros.proteinG} · C ${e.macros.carbsG} · F ${e.macros.fatG}` : ''}
            </span>
          </div>
          <div className="row align-center compact">
            {e.macros && <span className="mono">{e.macros.kcal}</span>}
            <button className="ghost icon" onClick={() => onDelete(e.id)} aria-label="Delete">✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main Screen ── */

export function NutritionScreen() {
  const [showLog, setShowLog] = useState(false);
  const liveEntries = (useQuery<NutritionEntryView[]>('nutrition_log') ?? []) as NutritionEntryView[];
  const mockEntries = (useQuery<NutritionEntryView[]>('nutrition_entries_mock') ?? []) as NutritionEntryView[];
  const entries = [...liveEntries, ...mockEntries];
  const [, setRefresh] = useState(0);

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const todayEntries = entries.filter(e => e.loggedAt >= startOfDay);

  const totalKcal = todayEntries.filter(e => e.macros).reduce((s, e) => s + (e.macros?.kcal ?? 0), 0);
  const totalProtein = todayEntries.filter(e => e.macros).reduce((s, e) => s + (e.macros?.proteinG ?? 0), 0);
  const totalCarbs = todayEntries.filter(e => e.macros).reduce((s, e) => s + (e.macros?.carbsG ?? 0), 0);
  const totalFat = todayEntries.filter(e => e.macros).reduce((s, e) => s + (e.macros?.fatG ?? 0), 0);
  const waterMl = todayEntries.filter(e => e.category === 'water').reduce((s, e) => s + (parseInt(e.name) || 0), 0);

  const remaining = Math.max(KCAL_GOAL - totalKcal, 0);
  const dateLabel = today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const title = totalKcal > 0
    ? `${totalKcal.toLocaleString()} kcal · ${remaining.toLocaleString()} to go`
    : '0 kcal logged today';

  const sorted = [...todayEntries].sort((a, b) => a.loggedAt - b.loggedAt);

  const foodEntries = sorted.filter(e => e.category === 'meal' || e.category === 'snack');
  const waterEntries = sorted.filter(e => e.category === 'water');

  const byCategory = new Map<NutritionCategory, NutritionEntryView[]>();
  for (const e of sorted) {
    const cat = e.category as NutritionCategory;
    if (cat === 'meal' || cat === 'snack' || cat === 'water') continue;
    byCategory.set(cat, [...(byCategory.get(cat) ?? []), e]);
  }

  const handleRefresh = () => setRefresh(v => v + 1);

  return (
    <div className="column">
      <header className="column compact">
        <span className="eyebrow">{dateLabel}</span>
        <h1>{title}</h1>
      </header>

      <MacroHeroCard
        kcal={totalKcal}
        protein={totalProtein}
        carbs={totalCarbs}
        fat={totalFat}
        waterMl={waterMl}
      />

      <div className="row space-between align-center">
        <span className="caption">{todayEntries.length} entries today</span>
        <button className="primary" onClick={() => setShowLog(v => !v)}>
          {showLog ? 'Close' : '+ Log Entry'}
        </button>
      </div>

      {showLog && <LogNutritionForm onLogged={() => { handleRefresh(); setShowLog(false); }} />}
      <DeleteDispatcher dispatcher={(id) => { deleteEntry(id); handleRefresh(); }} />

      {todayEntries.length === 0 && !showLog && (
        <p className="caption muted" style={{ textAlign: 'center' }}>No entries yet. Tap &quot;+ Log Entry&quot; to start.</p>
      )}

      {foodEntries.length > 0 && (
        <CategorySection
          label="Food"
          entries={foodEntries}
          onDelete={(id) => { deleteEntry(id); handleRefresh(); }}
          showCategory
        />
      )}

      {waterEntries.length > 0 && (
        <div className="surface column compact">
          <div className="row space-between align-center">
            <h3>Water</h3>
            <span className="mono muted">{(waterMl / 1000).toFixed(1)} of {WATER_TARGET_ML / 1000} L</span>
          </div>
          {waterEntries.map(e => (
            <div key={e.id} className="row space-between align-center">
              <time className="caption">{e.time} · {e.name} ml</time>
              <button className="ghost icon" onClick={() => { deleteEntry(e.id); handleRefresh(); }} aria-label="Delete">✕</button>
            </div>
          ))}
        </div>
      )}

      {Array.from(byCategory.entries()).map(([cat, items]) => (
        <CategorySection
          key={cat}
          label={CATEGORY_LABELS[cat]}
          entries={items}
          onDelete={(id) => { deleteEntry(id); handleRefresh(); }}
        />
      ))}
    </div>
  );
}
