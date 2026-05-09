import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import React from 'react';

export interface CarouselHandle {
  scrollTo: (index: number) => void;
}

type Props = {
  children: ReactNode;
  onActiveChange?: (index: number) => void;
};

export const Carousel = forwardRef<CarouselHandle, Props>(function Carousel(
  { children, onActiveChange },
  ref
) {
  const pages = React.Children.toArray(children);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerEl = useRef<HTMLDivElement | null>(null);
  const itemEls = useRef<Map<number, HTMLElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  const scrollTo = useCallback((index: number) => {
    itemEls.current
      .get(index)
      ?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  }, []);

  useImperativeHandle(ref, () => ({ scrollTo }), [scrollTo]);

  const registerItem = useCallback(
    (index: number) => (node: HTMLDivElement | null) => {
      if (node) {
        itemEls.current.set(index, node);
        observerRef.current?.observe(node);
      }
    },
    []
  );

  useEffect(() => {
    const root = containerEl.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      entries => {
        let best: { idx: number; ratio: number } | null = null;
        for (const entry of entries) {
          const idxStr = (entry.target as HTMLElement).dataset.carouselIndex;
          if (idxStr === undefined) continue;
          const idx = Number(idxStr);
          if (!best || entry.intersectionRatio > best.ratio) {
            best = { idx, ratio: entry.intersectionRatio };
          }
        }
        if (best && best.ratio > 0.5) setActiveIndex(best.idx);
      },
      { root, threshold: [0.25, 0.5, 0.75] }
    );
    observerRef.current = observer;
    itemEls.current.forEach(el => observer.observe(el));
    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [pages.length]);

  useEffect(() => {
    onActiveChange?.(activeIndex);
  }, [activeIndex, onActiveChange]);

  return (
    <div className="carousel-pager" ref={containerEl}>
      {pages.map((child, i) => (
        <div
          key={i}
          data-carousel-index={i}
          ref={registerItem(i)}
          className="carousel-page"
        >
          {child}
        </div>
      ))}
    </div>
  );
});
