import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

  return (
    <div className='column compact'>
      <div className="carousel relative clip">
        <div className="row track" style={{ transform: `translateX(-${idx * 100}%)` }}>
          {slides.map((slide, i) => {
            const { src } = normalise(slide);
            return <div className='surface flat bare' key={i}><img src={src} alt="" /></div>;
          })}
        </div>
        {current.caption && (
          <div className="slide-caption row center">{current.caption}</div>
        )}
        {len > 1 && idx > 0 && (
          <button className="icon sm ghost absolute bottom left" onClick={e => { e.stopPropagation(); setIdx(i => i - 1); }}>
            <ChevronLeft size={14} strokeWidth={2.5} />
          </button>
        )}
        {len > 1 && idx < len - 1 && (
          <button className="icon sm ghost absolute bottom right" onClick={e => { e.stopPropagation(); setIdx(i => i + 1); }}>
            <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        )}
      </div>
      {len > 1 && (
        <div className="row compact center">
          {slides.map((_, i) => (
            <span key={i} className={`dot sm ${i === idx ? ' active stretch' : ''} interactive`} onClick={e => { e.stopPropagation(); setIdx(i); }} />
          ))}
        </div>
      )}
    </ div>
  );
}
