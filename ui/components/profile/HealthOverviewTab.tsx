// ui/components/profile/HealthOverviewTab.tsx
import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { ChartContainer } from '@ui/patterns/charts/charts'
import { useQuery } from '@ui/bindings'
import type { HealthChartDef, HealthChartMap } from '@features/health'

// ─── Types & Registry ───────────────────────────────────────────────────────

type HealthCategory = {
  slug: string
  icon: string
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
  { slug: 'activity-mobility', icon: '👣', name: 'Activity & Mobility', subtitle: 'steps · distance · workouts · VO₂ · daylight', section: 'Physical & Activity' },
  { slug: 'body-measurements', icon: '⚖️', name: 'Body Measurements', subtitle: 'weight · BMI · body fat · lean mass · waist', section: 'Physical & Activity' },
  { slug: 'injuries', icon: '🩹', name: 'Injuries', subtitle: 'active · resolved · body part', section: 'Physical & Activity' },
  { slug: 'routes', icon: '🗺️', name: 'Routes', subtitle: 'saved · Strava import · map view', section: 'Physical & Activity' },
  { slug: 'cycle-tracking', icon: '🩸', name: 'Cycle Tracking', subtitle: 'period · BBT · ovulation · LH · fertility', section: 'Physical & Activity' },
  // Heart & Vitals
  { slug: 'heart', icon: '❤️', name: 'Heart', subtitle: 'HR · resting HR · HRV · ECG · AFib burden', section: 'Heart & Vitals' },
  { slug: 'vitals', icon: '🌡️', name: 'Vitals', subtitle: 'SpO₂ · blood pressure · glucose · resp. rate · wrist temp', section: 'Heart & Vitals' },
  { slug: 'sleep', icon: '😴', name: 'Sleep', subtitle: 'duration · stages · score · breathing disturbances', section: 'Heart & Vitals' },
  // Nutrition & Lifestyle
  { slug: 'nutrition', icon: '🥗', name: 'Nutrition', subtitle: 'macros · vitamins · minerals · hydration · caffeine', section: 'Nutrition & Lifestyle' },
  { slug: 'mental-wellbeing', icon: '🧠', name: 'Mental Wellbeing', subtitle: 'mindfulness · state of mind · PHQ-9 · GAD-7', section: 'Nutrition & Lifestyle' },
  { slug: 'symptoms', icon: '🤒', name: 'Symptoms', subtitle: 'respiratory · digestive · pain · fatigue · 30+ conditions', section: 'Nutrition & Lifestyle' },
  { slug: 'hearing', icon: '👂', name: 'Hearing', subtitle: 'env. sound · headphone levels · audiograms', section: 'Nutrition & Lifestyle' },
  // Medications & Records
  { slug: 'medications', icon: '💊', name: 'Medications', subtitle: 'schedule · dose log · drug interactions', section: 'Medications & Records' },
  { slug: 'health-records', icon: '📋', name: 'Health Records', subtitle: 'labs · allergies · immunizations · insulin · falls', section: 'Medications & Records' },
  // Wearable Recovery
  { slug: 'readiness', icon: '⚡', name: 'Readiness', subtitle: 'Oura · WHOOP · Garmin', section: 'Wearable Recovery' },
  { slug: 'body-battery', icon: '🔋', name: 'Body Battery', subtitle: 'Garmin energy reserve', section: 'Wearable Recovery' },
  { slug: 'stress', icon: '😤', name: 'Stress', subtitle: 'Garmin stress score', section: 'Wearable Recovery' },
  { slug: 'skin-temperature', icon: '🌡️', name: 'Skin Temperature', subtitle: 'Oura · WHOOP overnight', section: 'Wearable Recovery' },
  // Performance
  { slug: 'goals-records', icon: '🏆', name: 'Goals & Records', subtitle: 'achievements · PRs · active goals', section: 'Performance' },
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
  return (
    <button
      className={`surface tight${isPinned ? ' pinned' : ''}`}
      onClick={onClick}
      onPointerDown={onLongPress.start}
      onPointerUp={onLongPress.cancel}
      onPointerLeave={onLongPress.cancel}
      onPointerCancel={onLongPress.cancel}
    >
      <div className="column align-center">
        <span>{cat.icon}</span>
        <span className="caption">{cat.name}</span>
      </div>
    </button>
  )
}

function CategoryRow({ cat, isPinned = false, onClick, onLongPress, charts }: CategoryButtonProps) {
  return (
    <button
      className={`surface tight row align-center space-between${isPinned ? ' pinned' : ''}`}
      onClick={onClick}
      onPointerDown={onLongPress.start}
      onPointerUp={onLongPress.cancel}
      onPointerLeave={onLongPress.cancel}
      onPointerCancel={onLongPress.cancel}
    >
      <div className="row align-center">
        <span className="icon">{cat.icon}</span>
        <div className="stack compact align-left">
          <span>{cat.name}</span>
        </div>
      </div>
      <div className="row align-center">
        {charts?.[0] && (
          <div className="grow">
            <ChartContainer
              chartType={charts[0].chartType}
              data={charts[0].data}
              height={44}
              axisShow={{ x: false, y: false }}
              color={charts[0].color ?? 'var(--accent)'}
            />
          </div>
        )}
        <span className="faint" aria-hidden="true">›</span>
      </div>
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function HealthOverviewTab() {
  const navigate = useNavigate()
  const healthCharts = (useQuery<HealthChartMap>('health_charts') ?? {}) as HealthChartMap

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
    <div className="stack">

      {/* Search bar */}
      <div className="row align-center">
        <Search size={16} className="faint" />
        <input
          className="input grow"
          placeholder="Search categories…"
          aria-label="Search health categories"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* View toggle */}
      <div className="cluster">
        <button className={view === 'grid' ? 'chip active' : 'chip'} onClick={() => setView('grid')}>Grid</button>
        <button className={view === 'list' ? 'chip active' : 'chip'} onClick={() => setView('list')}>List</button>
      </div>

      {view === 'list' && (
        <>
          {pinnedCats.length > 0 && (
            <>
              <span className="eyebrow">Pinned</span>
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
              <hr />
            </>
          )}
          {SECTIONS.map(section => {
            const cats = unpinnedCats.filter(c => c.section === section)
            if (!cats.length) return null
            return (
              <div key={section} className="stack compact">
                <span className="eyebrow">{section}</span>
                {cats.map(cat => (
                  <CategoryRow
                    key={cat.slug}
                    cat={cat}
                    onClick={() => navigate(`/profile/health/${cat.slug}`)}
                    onLongPress={{ start: () => startPress(cat.slug), cancel: cancelPress }}
                    charts={healthCharts[cat.slug]}
                  />
                ))}
              </div>
            )
          })}
        </>
      )}

      {view === 'grid' && (
        <>
          {pinnedCats.length > 0 && (
            <>
              <span className="eyebrow">Pinned</span>
              <div className="grid-4">
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
              </div>
              <hr />
            </>
          )}
          {SECTIONS.map(section => {
            const cats = unpinnedCats.filter(c => c.section === section)
            if (!cats.length) return null
            return (
              <div key={section} className="stack compact">
                <span className="eyebrow">{section}</span>
                <div className="grid">
                  {cats.map(cat => (
                    <CategoryTile
                      key={cat.slug}
                      cat={cat}
                      onClick={() => navigate(`/profile/health/${cat.slug}`)}
                      onLongPress={{ start: () => startPress(cat.slug), cancel: cancelPress }}
                      charts={healthCharts[cat.slug]}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </>
      )}

    </div>
  )
}
