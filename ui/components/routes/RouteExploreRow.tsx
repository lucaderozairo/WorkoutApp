import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@ui/molecules';
import { Column, Row, Cluster } from '@ui/layout';
import { CardScroller } from '@ui/patterns';
import { Text } from '@ui/atoms';
import { RouteExploreCard, type RouteDisplay } from './RouteExploreCard';
import type { SavedRoute } from '@features/routes';

export interface RouteExploreGroup {
  id: string;
  title: string;
  subtitle: string;
  routes: RouteDisplay[];
  featured?: boolean;
}

export function RouteExploreRow({
  group,
  onRoute,
}: {
  group: RouteExploreGroup;
  onRoute: (route: SavedRoute) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const frameRef = useRef<number | undefined>(undefined);
  const [parallax, setParallax] = useState<number[]>([]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return undefined;

    const measure = () => {
      const scrollerRect = scroller.getBoundingClientRect();
      const next = cardRefs.current.map(card => {
        if (!card) return 0;
        const cardRect = card.getBoundingClientRect();
        const center = cardRect.left + cardRect.width / 2;
        const fraction = (center - scrollerRect.left) / Math.max(scrollerRect.width, 1);
        return Math.round((Math.min(1, Math.max(0, fraction)) - 0.5) * -28);
      });
      setParallax(next);
    };

    const schedule = () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(measure);
    };

    measure();
    scroller.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    return () => {
      scroller.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [group.routes]);

  const scrollCards = (direction: -1 | 1) => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scroller.scrollBy({
      left: direction * scroller.clientWidth * 0.78,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <Column
      gap={3}
      as="section"
      aria-labelledby={`route-explore-${group.id}`}
    >
      <Row justify="between" align="end" gap={2}>
        <Column gap={1}>
          <h3 id={`route-explore-${group.id}`}>{group.title}</h3>
          <Text as="span" size="caption" color="muted">{group.subtitle}</Text>
        </Column>
        {group.routes.length > 1 ? (
          <Cluster gap={1} className="card-scroller-controls">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => scrollCards(-1)}
              aria-label={`Scroll ${group.title} left`}
            >
              <ChevronLeft size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => scrollCards(1)}
              aria-label={`Scroll ${group.title} right`}
            >
              <ChevronRight size={14} />
            </Button>
          </Cluster>
        ) : null}
      </Row>
      <CardScroller ref={scrollRef}>
        {group.routes.map((route, index) => (
          <RouteExploreCard
            key={`${group.id}-${route.id}`}
            route={route}
            featured={group.featured}
            parallax={parallax[index] ?? 0}
            onRoute={onRoute}
            ref={(node: HTMLButtonElement | null) => { cardRefs.current[index] = node; }}
          />
        ))}
      </CardScroller>
    </Column>
  );
}
