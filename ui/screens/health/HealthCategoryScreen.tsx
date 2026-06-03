import React from 'react'
import { InjuriesView } from '@ui/components/health/InjuriesView'
import { HealthChartsList } from '@ui/components/health/HealthChartsList'
import { Surface } from '@ui/atoms';
import { ScreenHeader } from '@ui/molecules'
import { Grid } from '@ui/layout'
import { useHealthCategory } from './useHealthCategory'

// Custom views for categories that need more than a chart list
const CUSTOM_VIEWS: Record<string, React.FC> = {
  'injuries': InjuriesView,
}

export function HealthCategoryScreen() {
  const { category, cat, navigate } = useHealthCategory()

  if (!cat) {
    return (
      <Grid>
        <ScreenHeader title="Not Found" back={() => navigate('/profile')} />
        <p className="muted">Category not found.</p>
      </Grid>
    )
  }

  const slug = category ?? ''
  const CustomView = CUSTOM_VIEWS[slug]

  return (
    <Grid>
      <ScreenHeader
        title={`${cat.icon} ${cat.name}`}
        back={() => navigate('/profile')}
      />
      {CustomView ? (
        <CustomView />
      ) : (
        <HealthChartsList slug={slug} fallback={
          <Surface>
            <p className="muted">Data for this category will appear here once logged.</p>
          </Surface>
        } />
      )}
    </Grid>
  )
}
