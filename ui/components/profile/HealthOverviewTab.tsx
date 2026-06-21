// ui/components/profile/HealthOverviewTab.tsx
import { useState, useMemo, useRef } from 'react'
import { Grid } from '@ui/layout'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import type { Icon as PhosphorIcon } from 'phosphor-react'
import {
  BatteryCharging,
  Brain,
  ClipboardText,
  Drop,
  Ear,
  FirstAidKit,
  ForkKnife,
  Heart,
  Lightning,
  MapTrifold,
  Moon,
  PersonSimpleWalk,
  Pill,
  Scales,
  SmileyXEyes,
  Thermometer,
  Trophy,
  Wind,
} from 'phosphor-react'
import { ChartContainer } from '@ui/patterns/charts/charts'
import { useQuery } from '@ui/bindings'
import type { HealthChartDef, HealthChartMap } from '@features/health'
import { Row, Column, Cluster } from '@ui/layout'
import { Surface, Text, Chip, Divider } from '@ui/atoms';
import { Input } from '@ui/molecules'

// ─── Types & Registry ───────────────────────────────────────────────────────

type HealthCategory = {
  slug: string
  icon: PhosphorIcon
  name: string
  subtitle: string
  section: string
}

export const SECTIONS = [
  'Physical & Activity',
  'Heart & Vitals',
  'Nutrition & Lifestyle',
  'Medications & Records',
  'Wearable Recovery',
  'Performance',
]

export const HEALTH_CATEGORIES: HealthCategory[] = [
  // Physical & Activity
  { slug: 'activity-mobility', icon: PersonSimpleWalk, name: 'Activity & Mobility', subtitle: 'steps · distance · workouts · VO₂ · daylight', section: 'Physical & Activity' },
  { slug: 'body-measurements', icon: Scales, name: 'Body Measurements', subtitle: 'weight · BMI · body fat · lean mass · waist', section: 'Physical & Activity' },
  { slug: 'injuries', icon: FirstAidKit, name: 'Injuries', subtitle: 'active · resolved · body part', section: 'Physical & Activity' },
  { slug: 'routes', icon: MapTrifold, name: 'Routes', subtitle: 'saved · Strava import · map view', section: 'Physical & Activity' },
  { slug: 'cycle-tracking', icon: Drop, name: 'Cycle Tracking', subtitle: 'period · BBT · ovulation · LH · fertility', section: 'Physical & Activity' },
  // Heart & Vitals
  { slug: 'heart', icon: Heart, name: 'Heart', subtitle: 'HR · resting HR · HRV · ECG · AFib burden', section: 'Heart & Vitals' },
  { slug: 'vitals', icon: Thermometer, name: 'Vitals', subtitle: 'SpO₂ · blood pressure · glucose · resp. rate · wrist temp', section: 'Heart & Vitals' },
  { slug: 'sleep', icon: Moon, name: 'Sleep', subtitle: 'duration · stages · score · breathing disturbances', section: 'Heart & Vitals' },
  // Nutrition & Lifestyle
  { slug: 'nutrition', icon: ForkKnife, name: 'Nutrition', subtitle: 'macros · vitamins · minerals · hydration · caffeine', section: 'Nutrition & Lifestyle' },
  { slug: 'mental-wellbeing', icon: Brain, name: 'Mental Wellbeing', subtitle: 'mindfulness · state of mind · PHQ-9 · GAD-7', section: 'Nutrition & Lifestyle' },
  { slug: 'symptoms', icon: SmileyXEyes, name: 'Symptoms', subtitle: 'respiratory · digestive · pain · fatigue · 30+ conditions', section: 'Nutrition & Lifestyle' },
  { slug: 'hearing', icon: Ear, name: 'Hearing', subtitle: 'env. sound · headphone levels · audiograms', section: 'Nutrition & Lifestyle' },
  // Medications & Records
  { slug: 'medications', icon: Pill, name: 'Medications', subtitle: 'schedule · dose log · drug interactions', section: 'Medications & Records' },
  { slug: 'health-records', icon: ClipboardText, name: 'Health Records', subtitle: 'labs · allergies · immunizations · insulin · falls', section: 'Medications & Records' },
  // Wearable Recovery
  { slug: 'readiness', icon: Lightning, name: 'Readiness', subtitle: 'Oura · WHOOP · Garmin', section: 'Wearable Recovery' },
  { slug: 'body-battery', icon: BatteryCharging, name: 'Body Battery', subtitle: 'Garmin energy reserve', section: 'Wearable Recovery' },
  { slug: 'stress', icon: Wind, name: 'Stress', subtitle: 'Garmin stress score', section: 'Wearable Recovery' },
  { slug: 'skin-temperature', icon: Thermometer, name: 'Skin Temperature', subtitle: 'Oura · WHOOP overnight', section: 'Wearable Recovery' },
  // Performance
  { slug: 'goals-records', icon: Trophy, name: 'Goals & Records', subtitle: 'achievements · PRs · active goals', section: 'Performance' },
]

// ─── Internal sub-components ─────────────────────────────────────────────────

type LongPressHandlers = { start: () => void; cancel: () => void }

interface CategoryButtonProps {
  cat: HealthCategory
  isPinned?: boolean
  onClick: () => void
  onLongPress: LongPressHandlers
  charts?: HealthChartDef[]
}

function CategoryTile({ cat, isPinned = false, onClick, onLongPress, charts }: CategoryButtonProps) {
  const Icon = cat.icon
  return (
    <Surface
      as="button"
      type="button"
      pad="sm"
      variant={isPinned ? 'pinned' : 'default'}
      interactive
      onClick={onClick}
      onPointerDown={onLongPress.start}
      onPointerUp={onLongPress.cancel}
      onPointerLeave={onLongPress.cancel}
      onPointerCancel={onLongPress.cancel}
    >
      <Column align="center">
        <Icon size={24} aria-hidden="true" />
        <Text size="caption">{cat.name}</Text>
      </Column>
    </Surface>
  )
}

function CategoryRow({ cat, isPinned = false, onClick, onLongPress, charts }: CategoryButtonProps) {
  const Icon = cat.icon
  return (
    <Surface
      as="button"
      type="button"
      pad="sm"
      variant={isPinned ? 'pinned' : 'default'}
      interactive
      onClick={onClick}
      onPointerDown={onLongPress.start}
      onPointerUp={onLongPress.cancel}
      onPointerLeave={onLongPress.cancel}
      onPointerCancel={onLongPress.cancel}
    >
      <Row justify="between" align="center">
        <Row align="center">
          <Icon size={18} aria-hidden="true" />
          <Column gap={1} align="start">
            <Text>{cat.name}</Text>
          </Column>
        </Row>
        <Row align="center">
          {charts?.[0] && (
            <div className="min-w-0">
              <ChartContainer
                chartType={charts[0].chartType}
                data={charts[0].data}
                height={44}
                axisShow={{ x: false, y: false }}
                color={charts[0].color ?? 'var(--accent)'}
              />
            </div>
          )}
          <Text color="faint" aria-hidden="true">›</Text>
        </Row>
      </Row>
    </Surface>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function HealthOverviewTab() {
  const navigate = useNavigate()
  const healthCharts = (useQuery('health_charts') ?? {}) as HealthChartMap

  const [query, setQuery] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [pinned, setPinned] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('health_pinned_categories') ?? '[]')
    } catch {
      return []
    }
  })

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function togglePin(slug: string) {
    setPinned(prev => {
      const next = prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
      localStorage.setItem('health_pinned_categories', JSON.stringify(next))
      return next
    })
  }

  function startPress(slug: string) {
    timerRef.current = setTimeout(() => togglePin(slug), 500)
  }

  function cancelPress() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const filtered = useMemo(
    () =>
      HEALTH_CATEGORIES.filter(
        c =>
          !query ||
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.subtitle.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  )

  const pinnedCats = useMemo(() => filtered.filter(c => pinned.includes(c.slug)), [filtered, pinned])
  const unpinnedCats = useMemo(() => filtered.filter(c => !pinned.includes(c.slug)), [filtered, pinned])

  return (
    <Column>

      {/* Search bar */}
      <Row align="center">
        <Input
          className="min-w-0"
          leading={<Search size={16} className="faint" />}
          placeholder="Search categories…"
          aria-label="Search health categories"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </Row>

      {/* View toggle */}
      <Cluster>
        <Chip active={view === 'grid'} onClick={() => setView('grid')}>Grid</Chip>
        <Chip active={view === 'list'} onClick={() => setView('list')}>List</Chip>
      </Cluster>

      {view === 'list' && (
        <>
          {pinnedCats.length > 0 && (
            <>
              <Text size="eyebrow">Pinned</Text>
              {pinnedCats.map(cat => (
                <CategoryRow
                  key={cat.slug}
                  cat={cat}
                  isPinned
                  onClick={() => navigate(`/profile/health/${cat.slug}`)}
                  onLongPress={{ start: () => startPress(cat.slug), cancel: cancelPress }}
                  charts={healthCharts[cat.slug]}
                />
              ))}
              <Divider />
            </>
          )}
          {SECTIONS.map(section => {
            const cats = unpinnedCats.filter(c => c.section === section)
            if (!cats.length) return null
            return (
              <Column key={section} gap={1}>
                <Text size="eyebrow">{section}</Text>
                {cats.map(cat => (
                  <CategoryRow
                    key={cat.slug}
                    cat={cat}
                    onClick={() => navigate(`/profile/health/${cat.slug}`)}
                    onLongPress={{ start: () => startPress(cat.slug), cancel: cancelPress }}
                    charts={healthCharts[cat.slug]}
                  />
                ))}
              </Column>
            )
          })}
        </>
      )}

      {view === 'grid' && (
        <>
          {pinnedCats.length > 0 && (
            <>
              <Text size="eyebrow">Pinned</Text>
              <Grid cols={4}>
                {pinnedCats.map(cat => (
                  <CategoryTile
                    key={cat.slug}
                    cat={cat}
                    isPinned
                    onClick={() => navigate(`/profile/health/${cat.slug}`)}
                    onLongPress={{ start: () => startPress(cat.slug), cancel: cancelPress }}
                    charts={healthCharts[cat.slug]}
                  />
                ))}
              </Grid>
              <Divider />
            </>
          )}
          {SECTIONS.map(section => {
            const cats = unpinnedCats.filter(c => c.section === section)
            if (!cats.length) return null
            return (
              <Column key={section} gap={1}>
                <Text size="eyebrow">{section}</Text>
                <Grid variant="tiles">
                  {cats.map(cat => (
                    <CategoryTile
                      key={cat.slug}
                      cat={cat}
                      onClick={() => navigate(`/profile/health/${cat.slug}`)}
                      onLongPress={{ start: () => startPress(cat.slug), cancel: cancelPress }}
                      charts={healthCharts[cat.slug]}
                    />
                  ))}
                </Grid>
              </Column>
            )
          })}
        </>
      )}

    </Column>
  )
}
