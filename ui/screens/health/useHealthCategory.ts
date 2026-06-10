import { useParams, useNavigate } from 'react-router-dom';
import { HEALTH_CATEGORIES } from '@ui/components/profile/HealthOverviewTab';

export function useHealthCategory() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const cat = HEALTH_CATEGORIES.find(c => c.slug === category);

  return { category, cat, navigate };
}
