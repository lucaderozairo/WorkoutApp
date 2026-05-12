import { useParams, useNavigate } from 'react-router-dom'
import { HEALTH_CATEGORIES } from '../components/profile/HealthOverviewTab'
import { ActivityMobilityView } from '../components/health/ActivityMobilityView'
import { BodyMeasurementsView } from '../components/health/BodyMeasurementsView'
import { InjuriesView } from '../components/health/InjuriesView'
import { RoutesView } from '../components/health/RoutesView'
import { CycleTrackingView } from '../components/health/CycleTrackingView'
import { HeartView } from '../components/health/HeartView'
import { VitalsView } from '../components/health/VitalsView'
import { SleepView } from '../components/health/SleepView'
import { NutritionView } from '../components/health/NutritionView'
import { MentalWellbeingView } from '../components/health/MentalWellbeingView'
import { SymptomsView } from '../components/health/SymptomsView'
import { HearingView } from '../components/health/HearingView'
import { MedicationsView } from '../components/health/MedicationsView'
import { HealthRecordsView } from '../components/health/HealthRecordsView'
import { ReadinessView } from '../components/health/ReadinessView'
import { BodyBatteryView } from '../components/health/BodyBatteryView'
import { StressView } from '../components/health/StressView'
import { SkinTemperatureView } from '../components/health/SkinTemperatureView'
import { GoalsRecordsView } from '../components/health/GoalsRecordsView'

const VIEW_MAP: Record<string, React.FC> = {
  'activity-mobility':  ActivityMobilityView,
  'body-measurements':  BodyMeasurementsView,
  'injuries':           InjuriesView,
  'routes':             RoutesView,
  'cycle-tracking':     CycleTrackingView,
  'heart':              HeartView,
  'vitals':             VitalsView,
  'sleep':              SleepView,
  'nutrition':          NutritionView,
  'mental-wellbeing':   MentalWellbeingView,
  'symptoms':           SymptomsView,
  'hearing':            HearingView,
  'medications':        MedicationsView,
  'health-records':     HealthRecordsView,
  'readiness':          ReadinessView,
  'body-battery':       BodyBatteryView,
  'stress':             StressView,
  'skin-temperature':   SkinTemperatureView,
  'goals-records':      GoalsRecordsView,
}

export function HealthCategoryScreen() {
  const { category } = useParams<{ category: string }>()
  const navigate = useNavigate()
  const cat = HEALTH_CATEGORIES.find(c => c.slug === category)

  if (!cat) {
    return (
      <div className="stack">
        <button className="ghost" onClick={() => navigate('/profile')}>← Back</button>
        <p className="muted">Category not found.</p>
      </div>
    )
  }

  const CategoryView = VIEW_MAP[category ?? '']

  return (
    <div className="stack">
      <button className="ghost" onClick={() => navigate('/profile')}>← Back</button>

      <div className="surface ghost">
        <div className="row align-center">
          <h1 className="display">{cat.icon}</h1>
          <div className="stack compact grow">
            <h2>{cat.name}</h2>
            {/* <span className="caption muted">{cat.subtitle}</span> */}
          </div>
        </div>
      </div>

      {CategoryView ? (
        <CategoryView />
      ) : (
        <div className="surface">
          <p className="muted">Data for this category will appear here once logged.</p>
        </div>
      )}
    </div>
  )
}
