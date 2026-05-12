import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Maximize2, Minimize2, ArrowUpRight } from 'lucide-react';

type WidgetSize = '1x1' | '2x1' | '2x2';

interface WidgetShellProps {
  id: string;
  sizes: WidgetSize[];
  defaultSize: WidgetSize;
  to?: string;
  children: (size: WidgetSize) => React.ReactNode;
}

function loadSize(id: string, defaultSize: WidgetSize, sizes: WidgetSize[]): WidgetSize {
  try {
    const stored = localStorage.getItem(`widget-size-${id}`);
    if (stored && (sizes as string[]).includes(stored)) return stored as WidgetSize;
  } catch { /* ignore */ }
  return defaultSize;
}

export function WidgetShell({ id, sizes, defaultSize, to, children }: WidgetShellProps) {
  const [size, setSize] = useState<WidgetSize>(() => loadSize(id, defaultSize, sizes));
  const navigate = useNavigate();

  function cycleSize() {
    const next = sizes[(sizes.indexOf(size) + 1) % sizes.length];
    setSize(next);
    try { localStorage.setItem(`widget-size-${id}`, next); } catch { /* ignore */ }
  }

  const isMax = sizes.indexOf(size) === sizes.length - 1;

  return (
    <div className={`widget-${size} relative`}>
      {children(size)}
      <div className="absolute top right row compact">
        {to && (
          <button className="ghost icon sm" onClick={() => navigate(to)} aria-label="View detail">
            <ArrowUpRight size={16} />
          </button>
        )}
        {sizes.length > 1 && (
          <button className="ghost icon sm" onClick={cycleSize} aria-label="Resize widget">
            {isMax ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
