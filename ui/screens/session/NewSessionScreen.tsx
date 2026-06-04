import { useState } from 'react';
import { ACTIVITY_ICONS } from '@ui/icons/activityIcons';
import type { SportType } from '@features/training_log/contract';
import {
  PINNED_ACTIVITIES, MORE_CATEGORIES, ROUTE_ACTIVITIES,
  todayDateString, useNewSession,
} from './useNewSession';
import { Plus, X } from 'lucide-react';
import { ScreenHeader, Button, Input } from '@ui/molecules';
import { Grid, Row, Column, Cluster } from '@ui/layout';


function ActivityButton({ sport, selected, onSelect }: {
  sport: SportType;
  selected: SportType;
  onSelect: (s: SportType) => void;
}) {
  const { label, Icon } = ACTIVITY_ICONS[sport];
  return (
    <button
      className={`column align-center surface card${selected === sport ? ' active' : ''}`}
      onClick={() => onSelect(sport)}
    >
      <Icon size={22} />
      <span className="caption">{label}</span>
    </button>
  );
}

export function NewSessionScreen() {
  const {
    navigate,
    selected, setSelected,
    name, setName, setNameTouched,
    date, setDate,
    startTime, setStartTime,
    routeLabel,
    savedTemplates,
    pendingTemplate,
    handleLoadTemplate,
    handleNewSession,
    handleAddRoute,
    handleSavedRoutes,
  } = useNewSession();

  const [showMore, setShowMore] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  return (
    <Grid>
      <ScreenHeader title="New Session" back={() => navigate(-1)} />
      {/* Pinned quick-select row */}
      <Row gap={1}>
        {PINNED_ACTIVITIES.map(sport => (
          <ActivityButton key={sport} sport={sport} selected={selected} onSelect={setSelected} />
        ))}
        <button
          className={`column surface card gap-1 align-center${showMore ? ' active' : ''}`}
          onClick={() => setShowMore(v => !v)}
          aria-expanded={showMore}
        >
          <h2>{showMore ? <X /> : <Plus />}</h2>
          <span className="caption">More</span>
        </button>
      </Row>

      {/* Expandable "More" grid */}
      {showMore && (
        <Column gap={1}>
          {MORE_CATEGORIES.map(cat => (
            <Column key={cat.label} gap={1}>
              <p className="eyebrow">{cat.label}</p>
              <Cluster gap={1}>
                {cat.sports.map(sport => (
                  <ActivityButton key={sport} sport={sport} selected={selected} onSelect={sport => { setSelected(sport); setShowMore(false); }} />
                ))}
              </Cluster>
            </Column>
          ))}
        </Column>
      )}

      <Input label="Name" type="text" value={name} onChange={e => { setName(e.target.value); setNameTouched(true); }} />

      <Column gap={1}>
        <Input label="Date" type="date" value={date} min={todayDateString()} onChange={e => setDate(e.target.value)} />
        <Input label="Time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
      </Column>

      {savedTemplates.length > 0 && (
        <Column gap={1}>
          <Button variant="ghost" size="sm" onClick={() => setShowTemplates(v => !v)}>
            {pendingTemplate
              ? `Template: ${pendingTemplate.name} ✓`
              : showTemplates ? 'Hide templates' : 'Load template'}
          </Button>
          {showTemplates && (
            <Column gap={1}>
              {savedTemplates.map(t => (
                <button
                  key={t.id}
                  type="button"
                  className={`surface pad-sm interactive${pendingTemplate?.id === t.id ? ' active' : ''}`}
                  onClick={() => { handleLoadTemplate(t); setShowTemplates(false); }}
                >
                  <Row justify="between" align="center">
                    <span className="detail">{t.name}</span>
                    <span className="caption">{t.exercises.length} exercises</span>
                  </Row>
                </button>
              ))}
            </Column>
          )}
        </Column>
      )}

      {ROUTE_ACTIVITIES.has(selected) && (
        <Row gap={1}>
          <Button variant="secondary" className="grow" onClick={handleAddRoute}>
            {routeLabel}
          </Button>
          <Button variant="secondary" onClick={handleSavedRoutes}>
            Saved Routes
          </Button>
        </Row>
      )}

      <Button variant="primary" onClick={handleNewSession} disabled={!name.trim() || !date}>
        New Session
      </Button>
    </Grid>
  );
}
