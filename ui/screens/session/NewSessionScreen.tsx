import { useState } from 'react';
import { ACTIVITY_ICONS } from '@ui/icons/activityIcons';
import type { SportType } from '@features/training_log/domain/types';
import {
  PINNED_ACTIVITIES, MORE_CATEGORIES, ROUTE_ACTIVITIES,
  todayDateString, useNewSession,
} from './useNewSession';
import { Plus, X } from 'lucide-react';
import { ScreenHeader, Button, Input } from '@ui/molecules';
import { Surface, Text } from '@ui/atoms';
import { Grid, Row, Column, Cluster } from '@ui/layout';


function ActivityButton({ sport, selected, onSelect }: {
  sport: SportType;
  selected: SportType;
  onSelect: (s: SportType) => void;
}) {
  const { label, Icon } = ACTIVITY_ICONS[sport];
  return (
    <Surface as="button" selected={selected === sport} interactive className="card"
      onClick={() => onSelect(sport)}>
      <Column align="center">
        <Icon size={22} />
        <Text size="caption">{label}</Text>
      </Column>
    </Surface>
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
        <Surface as="button" selected={showMore} interactive className="card"
          onClick={() => setShowMore(v => !v)} aria-expanded={showMore}>
          <Column gap={1} align="center">
            {showMore ? <X /> : <Plus />}
            <Text size="caption">More</Text>
          </Column>
        </Surface>
      </Row>

      {/* Expandable "More" grid */}
      {showMore && (
        <Column gap={1}>
          {MORE_CATEGORIES.map(cat => (
            <Column key={cat.label} gap={1}>
              <Text as="p" size="eyebrow">{cat.label}</Text>
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
                <Surface key={t.id} as="button" pad="sm" selected={pendingTemplate?.id === t.id} interactive
                  onClick={() => { handleLoadTemplate(t); setShowTemplates(false); }}>
                  <Row justify="between" align="center">
                    <Text size="detail">{t.name}</Text>
                    <Text size="caption">{t.exercises.length} exercises</Text>
                  </Row>
                </Surface>
              ))}
            </Column>
          )}
        </Column>
      )}

      {ROUTE_ACTIVITIES.has(selected) && (
        <Row gap={1}>
          <Button variant="secondary" className="min-w-0" onClick={handleAddRoute}>
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
