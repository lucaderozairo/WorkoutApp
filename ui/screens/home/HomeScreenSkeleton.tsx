import { Skeleton, Surface } from '@ui/atoms';
import { Grid } from '@ui/layout';
import { Section, SplitTabs, WidgetCard } from '@ui/patterns';

function HomeHeroSkeleton() {
  return (
    <Surface aria-hidden>
      <Grid gap={3}>
        <Skeleton size="line" short className="text-9" />
        <Skeleton size="block" />
        <Grid cols={3} gap={2}>
          <Skeleton size="line" />
          <Skeleton size="line" />
          <Skeleton size="line" />
        </Grid>
      </Grid>
    </Surface>
  );
}

function HomeSessionCardSkeleton() {
  return (
    <Surface pad="sm" className="grid" aria-hidden>
      <Grid gap={2}>
        <Skeleton size="line" />
        <Grid cols={3} gap={2}>
          {Array.from({ length: 3 }, (_, index) => (
            <Surface key={index} variant="flat" pad="xs" className="q-tile">
              <Grid gap={1}>
                <Skeleton size="line" />
                <Skeleton size="line" short className="text-9" />
              </Grid>
            </Surface>
          ))}
        </Grid>
      </Grid>
    </Surface>
  );
}

export function HomeScreenSkeleton() {
  return (
    <Grid gap={4} aria-label="Loading home screen">
      <HomeHeroSkeleton />

      <SplitTabs.Skeleton />

      <Section.Skeleton labelSurface="ghost" rows={0}>
        <div className="widget-grid">
          {Array.from({ length: 6 }, (_, index) => (
            <WidgetCard.Skeleton key={index} />
          ))}
        </div>
      </Section.Skeleton>

      <Section.Skeleton rows={0}>
        <Grid gap={2}>
          <HomeSessionCardSkeleton />
          <HomeSessionCardSkeleton />
        </Grid>
      </Section.Skeleton>
    </Grid>
  );
}
