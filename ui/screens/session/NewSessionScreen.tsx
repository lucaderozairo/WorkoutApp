import { useState } from 'react';
import { ACTIVITY_ICONS } from '@ui/icons/activityIcons';
import type { SportType } from '@features/training_log/domain/types';
import {
  PINNED_ACTIVITIES, MORE_CATEGORIES, ROUTE_ACTIVITIES,
  todayDateString, useNewSession,
} from './useNewSession';
import { ArrowDown, ArrowUp, Copy, Pencil, Plus, Star, Trash2, X } from 'lucide-react';
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
    <Surface as="button" selected={selected === sport} interactive
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
    recentRoutines,
    pendingTemplate,
    handleLoadTemplate,
    handleRenameSavedTemplate,
    handleDuplicateSavedTemplate,
    handleDeleteSavedTemplate,
    handleToggleFavorite,
    handleMoveTemplateExercise,
    handleRemoveSavedTemplateExercise,
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
        <Surface as="button" selected={showMore} interactive
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

      {(savedTemplates.length > 0 || recentRoutines.length > 0) && (
        <Column gap={1}>
          <Button variant="ghost" size="sm" onClick={() => setShowTemplates(v => !v)}>
            {pendingTemplate
              ? `Template: ${pendingTemplate.name} ✓`
              : showTemplates ? 'Hide templates' : 'Load template'}
          </Button>
          {showTemplates && (
            <Column gap={1}>
              {savedTemplates.length > 0 && <Text size="eyebrow">Saved</Text>}
              {savedTemplates.map(t => (
                <Surface key={t.id} pad="sm" selected={pendingTemplate?.id === t.id}>
                  <Row justify="between" align="center">
                    <Column gap={1}>
                      <Text size="detail">{t.name}</Text>
                      <Text size="caption">{t.exercises.length} exercises</Text>
                    </Column>
                    <Row gap={1}>
                      <Button type="button" variant="secondary" size="sm"
                        onClick={() => { handleLoadTemplate(t); setShowTemplates(false); }}>
                        Use
                      </Button>
                      <Button type="button" variant="ghost" size="icon-sm" title="Favorite"
                        onClick={() => handleToggleFavorite(t)}>
                        <Star size={14} fill={t.favorite ? 'currentColor' : 'none'} />
                      </Button>
                      <Button type="button" variant="ghost" size="icon-sm" title="Rename"
                        onClick={() => handleRenameSavedTemplate(t.id, t.name)}>
                        <Pencil size={14} />
                      </Button>
                      <Button type="button" variant="ghost" size="icon-sm" title="Duplicate"
                        onClick={() => handleDuplicateSavedTemplate(t.id)}>
                        <Copy size={14} />
                      </Button>
                      <Button type="button" variant="ghost" size="icon-sm" title="Delete"
                        onClick={() => handleDeleteSavedTemplate(t.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </Row>
                  </Row>
                  <Column gap={1}>
                    {t.exercises.map((exercise, index) => (
                      <Row key={exercise.id} justify="between" align="center">
                        <Text size="caption">{index + 1}. {exercise.name}</Text>
                        <Row gap={1}>
                          <Button type="button" variant="ghost" size="icon-sm" title="Move up"
                            disabled={index === 0}
                            onClick={() => handleMoveTemplateExercise(t, exercise.id, -1)}>
                            <ArrowUp size={14} />
                          </Button>
                          <Button type="button" variant="ghost" size="icon-sm" title="Move down"
                            disabled={index === t.exercises.length - 1}
                            onClick={() => handleMoveTemplateExercise(t, exercise.id, 1)}>
                            <ArrowDown size={14} />
                          </Button>
                          <Button type="button" variant="ghost" size="icon-sm" title="Remove exercise"
                            onClick={() => handleRemoveSavedTemplateExercise(t.id, exercise.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </Row>
                      </Row>
                    ))}
                  </Column>
                </Surface>
              ))}
              {recentRoutines.length > 0 && <Text size="eyebrow">Recent routines</Text>}
              {recentRoutines.map(t => (
                <Surface key={t.id} pad="sm" selected={pendingTemplate?.id === t.id}>
                  <Row justify="between" align="center">
                    <Text size="detail">{t.name}</Text>
                    <Row gap={1}>
                      <Text size="caption">{t.exercises.length} exercises</Text>
                      <Button type="button" variant="secondary" size="sm"
                        onClick={() => { handleLoadTemplate(t); setShowTemplates(false); }}>
                        Use
                      </Button>
                    </Row>
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
