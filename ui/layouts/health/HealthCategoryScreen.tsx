import { ActivityMobilityView } from '@ui/components/health/ActivityMobilityView'
import { BodyMeasurementsView } from '@ui/components/health/BodyMeasurementsView'
import { InjuriesView } from '@ui/components/health/InjuriesView'
import { RoutesView } from '@ui/components/health/RoutesView'
import { CycleTrackingView } from '@ui/components/health/CycleTrackingView'
import { HeartView } from '@ui/components/health/HeartView'
import { VitalsView } from '@ui/components/health/VitalsView'
import { SleepView } from '@ui/components/health/SleepView'
import { NutritionView } from '@ui/components/health/NutritionView'
import { MentalWellbeingView } from '@ui/components/health/MentalWellbeingView'
import { SymptomsView } from '@ui/components/health/SymptomsView'
import { HearingView } from '@ui/components/health/HearingView'
import { MedicationsView } from '@ui/components/health/MedicationsView'
import { HealthRecordsView } from '@ui/components/health/HealthRecordsView'
import { ReadinessView } from '@ui/components/health/ReadinessView'
import { BodyBatteryView } from '@ui/components/health/BodyBatteryView'
import { StressView } from '@ui/components/health/StressView'
import { SkinTemperatureView } from '@ui/components/health/SkinTemperatureView'
import { GoalsRecordsView } from '@ui/components/health/GoalsRecordsView'
import { useHealthCategory } from './useHealthCategory'

const VIEW_MAP: Record<string, React.FC> = {
  'activity-mobility': ActivityMobilityView,
  'body-measurements': BodyMeasurementsView,
  'injuries': InjuriesView,
  'routes': RoutesView,
  'cycle-tracking': CycleTrackingView,
  'heart': HeartView,
  'vitals': VitalsView,
  'sleep': SleepView,
  'nutrition': NutritionView,
  'mental-wellbeing': MentalWellbeingView,
  'symptoms': SymptomsView,
  'hearing': HearingView,
  'medications': MedicationsView,
  'health-records': HealthRecordsView,
  'readiness': ReadinessView,
  'body-battery': BodyBatteryView,
  'stress': StressView,
  'skin-temperature': SkinTemperatureView,
  'goals-records': GoalsRecordsView,
}

export function HealthCategoryScreen() {
  const { category, cat, navigate } = useHealthCategory()

  if (!cat) {
    return (
      <div className="stack">
        <button className="ghost" onClick={() => navigate('/profile')}>Back</button>
        <p className="muted">Category not found.</p>
      </div>
    )
  }

  const CategoryView = VIEW_MAP[category ?? '']

  return (
    <div className="stack">
      <button className="ghost" onClick={() => navigate('/profile')}>Back</button>

      <div className="surface ghost">
        <div className="row align-center">
          <h1 className="display">{cat.icon}</h1>
          <div className="stack compact grow">
            <h2>{cat.name}</h2>
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
