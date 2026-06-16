import React from 'react'
import { InjuriesView } from '@ui/components/health/InjuriesView'
import { SleepView } from '@ui/components/health/SleepView'
import { HealthChartsList } from '@ui/components/health/HealthChartsList'
import { Surface, Text } from '@ui/atoms';
import { ScreenHeader } from '@ui/molecules'
import { Grid } from '@ui/layout'
import { useHealthCategory } from './useHealthCategory'

// Custom views for categories that need more than a chart list
const CUSTOM_VIEWS: Record<string, React.FC> = {
  'injuries': InjuriesView,
  'sleep': SleepView,
}

export function HealthCategoryScreen() {
  const { category, cat, navigate } = useHealthCategory()

  if (!cat) {
    return (
      <Grid>
        <ScreenHeader title="Not Found" back={() => navigate('/profile')} />
        <Text as="p" color="muted">Category not found.</Text>
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
            <Text as="p" color="muted">Data for this category will appear here once logged.</Text>
          </Surface>
        } />
      )}
    </Grid>
  )
}
