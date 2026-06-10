import { useState, type CSSProperties } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Row, Column } from '@ui/layout';
import { Surface } from '@ui/atoms';
import { Button } from '@ui/molecules';

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
      <div className="carousel relative clip">
        {/* eslint-disable-next-line no-restricted-syntax -- Active slide drives the tokenized transform custom property at runtime. */}
        <div className="row track" style={trackStyle}>
          {slides.map((slide, i) => {
            const { src } = normalise(slide);
            return <Surface key={i} variant="flat" pad="none"><img src={src} alt="" /></Surface>;
          })}
        </div>
        {current.caption && (
          <Row justify="center" className="slide-caption">{current.caption}</Row>
        )}
        {len > 1 && idx > 0 && (
          <Button variant="ghost" size="icon" className="absolute bottom left" onClick={e => { e.stopPropagation(); setIdx(i => i - 1); }}>
            <ChevronLeft size={14} strokeWidth={2.5} />
          </Button>
        )}
        {len > 1 && idx < len - 1 && (
          <Button variant="ghost" size="icon" className="absolute bottom right" onClick={e => { e.stopPropagation(); setIdx(i => i + 1); }}>
            <ChevronRight size={14} strokeWidth={2.5} />
          </Button>
        )}
      </div>
      {len > 1 && (
        <Row gap={1} justify="center">
          {slides.map((_, i) => (
            <span key={i} className={`dot sm ${i === idx ? ' active stretch' : ''} interactive`} onClick={e => { e.stopPropagation(); setIdx(i); }} />
          ))}
        </Row>
      )}
    </Column>
  );
}
