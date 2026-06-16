import { useState, type CSSProperties } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Row, Column, Layer, Layered } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Button, PageControl } from '@ui/molecules';

type Slide = string | { src: string; caption?: string };

interface CarouselProps {
  slides: Slide[];
}

function normalise(slide: Slide): { src: string; caption?: string } {
  return typeof slide === 'string' ? { src: slide } : slide;
}

export function Carousel({ slides }: CarouselProps) {
  const [idx, setIdx] = useState(0);
  const len = slides.length;

  if (len === 0) return null;

  const current = normalise(slides[idx]);
  const trackStyle = { '--carousel-x': `-${idx * 100}%` } as CSSProperties;

  return (
    <Column gap={1}>
      <Layered className="carousel" clip>
        {/* eslint-disable-next-line no-restricted-syntax -- Active slide drives the tokenized transform custom property at runtime. */}
        <div className="row track" style={trackStyle}>
          {slides.map((slide, i) => {
            const { src } = normalise(slide);
            return <Surface key={i} variant="flat" pad="none"><img src={src} alt="" /></Surface>;
          })}
        </div>
        {current.caption && (
          <Row justify="center" className="slide-caption">
            <Text size="caption">{current.caption}</Text>
          </Row>
        )}
        {len > 1 && idx > 0 && (
          <Layer pin="bottom-left" z="controls">
            <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setIdx(i => i - 1); }}>
              <ChevronLeft size={14} strokeWidth={2.5} />
            </Button>
          </Layer>
        )}
        {len > 1 && idx < len - 1 && (
          <Layer pin="bottom-right" z="controls">
            <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setIdx(i => i + 1); }}>
              <ChevronRight size={14} strokeWidth={2.5} />
            </Button>
          </Layer>
        )}
      </Layered>
      <PageControl count={len} index={idx} label="Media slides" onChange={setIdx} />
    </Column>
  );
}
