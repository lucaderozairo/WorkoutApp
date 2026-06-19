/** Gap scale: numeric 0–5 maps directly to CSS gap-{n} classes (= --s-{n} tokens). */
export type Gap = 0 | 1 | 2 | 3 | 4 | 5;
export type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type Justify = 'start' | 'center' | 'end' | 'between' | 'around';

const ALIGN_CLASS: Record<Align, string> = {
  start:    'align-start',
  center:   'align-center',
  end:      'align-end',
  stretch:  'align-stretch',
  baseline: 'align-baseline',
};

const JUSTIFY_CLASS: Record<Justify, string> = {
  start:   'justify-start',
  center:  'justify-center',
  end:     'justify-end',
  between: 'justify-between',
  around:  'justify-around',
};

export function layoutClasses(opts: {
  base: string;
  gap?: Gap;
  defaultGap: Gap;
  align?: Align;
  justify?: Justify;
  wrap?: boolean;
  grow?: boolean;
  className?: string;
}): string {
  const { base, gap, defaultGap, align, justify, wrap, grow, className } = opts;
  const gapClass = gap !== undefined && gap !== defaultGap ? `gap-${gap}` : '';
  return [
    base,
    gapClass,
    align   ? ALIGN_CLASS[align]   : '',
    justify ? JUSTIFY_CLASS[justify] : '',
    wrap    ? 'wrap'                 : '',
    grow    ? 'grow'                 : '',
    className,
  ].filter(Boolean).join(' ');
}
