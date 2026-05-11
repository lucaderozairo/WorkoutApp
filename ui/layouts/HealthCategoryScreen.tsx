import { useParams, useNavigate } from 'react-router-dom';
import { HEALTH_CATEGORIES } from '../components/profile/HealthOverviewTab';
import { OverviewTab } from '../components/profile/OverviewTab';
import { HealthTab } from '../components/profile/HealthTab';

export function HealthCategoryScreen() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const cat = HEALTH_CATEGORIES.find(c => c.slug === category);

  if (!cat) {
    return (
      <div className="stack">
        <button className="ghost" onClick={() => navigate('/profile')}>← Back</button>
        <p className="muted">Category not found.</p>
      </div>
    );
  }

  return (
    <div className="stack">
      <button className="ghost" onClick={() => navigate('/profile')}>← Back</button>

      <div className="surface">
        <div className="row align-center">
          <h1 className="display">{cat.icon}</h1>
          <div className="stack compact grow">
            <h2>{cat.name}</h2>
            <span className="caption muted">{cat.subtitle}</span>
          </div>
        </div>
      </div>

      {category === 'goals-records' && <OverviewTab />}
      {category === 'injuries' && <HealthTab />}
      {category !== 'goals-records' && category !== 'injuries' && (
        <div className="surface">
          <p className="muted">Data for this category will appear here once connected.</p>
        </div>
      )}
    </div>
  );
}
