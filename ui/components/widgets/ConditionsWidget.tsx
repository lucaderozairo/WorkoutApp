import { ExpandableCard } from '@ui/components/shared/ExpandableCard';
import { SPORT_ICONS } from '@ui/components/dashboard/dashboardUtils';
import type { WeatherCondition, SuitabilityEntry } from '@features/conditions';

interface ConditionsWidgetProps {
  conditions: WeatherCondition | null;
  suitability: SuitabilityEntry[];
}

export function ConditionsWidget({ conditions, suitability }: ConditionsWidgetProps) {
  if (!conditions) {
    return (
      <section className="surface compact">
        <h3>Conditions</h3>
        <p>Loading…</p>
      </section>
    );
  }
  return (
    <ExpandableCard className="compact">
      {toggle => (
        <>
          <header className="row space-between" onClick={toggle}>
            <h3>Conditions</h3>
            <span>›</span>
          </header>
          <div className="row">
            <span>{conditions.icon}</span>
            <div>
              <p className="value">{conditions.tempCelsius}°</p>
              <span className="caption">Humidity {conditions.humidity}% · Wind {conditions.windKph} km/h</span>
            </div>
          </div>
          <div className="expandable column" onClick={e => e.stopPropagation()}>
            <h3>Details</h3>
            <div className="column">
              <div className="row space-between">
                <span className="caption">Description</span>
                <span>{conditions.description}</span>
              </div>
              <div className="row space-between">
                <span className="caption">Wind</span>
                <span className="value">{conditions.windKph} km/h</span>
              </div>
              {suitability.length > 0 && (
                <div className="row space-between align-top">
                  <span className="caption">Sport suitability</span>
                  <div className="column">
                    {suitability.map(s => (
                      <span key={s.sport} className={`pill ${s.suitability}`}>
                        {SPORT_ICONS[s.sport]} {s.sport}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </ExpandableCard>
  );
}
