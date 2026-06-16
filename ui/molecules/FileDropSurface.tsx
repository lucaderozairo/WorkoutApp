import type { ChangeEvent, ReactNode } from 'react';
import { useId, useRef } from 'react';
import { Surface } from '@ui/atoms';

interface FileDropSurfaceProps {
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  busy?: boolean;
  className?: string;
  children: ReactNode;
  onFiles: (files: File[]) => void;
}

export function FileDropSurface({
  accept,
  multiple = false,
  disabled = false,
  busy = false,
  className,
  children,
  onFiles,
}: FileDropSurfaceProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const inactive = disabled || busy;

  function emitFiles(files: FileList | null) {
    if (inactive || !files || files.length === 0) return;
    onFiles(Array.from(files));
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    emitFiles(event.target.files);
    event.target.value = '';
  }

  return (
    <Surface
      variant="inset"
      interactive={!inactive}
      selected={busy}
      className={className}
      role="button"
      tabIndex={inactive ? -1 : 0}
      aria-disabled={inactive}
      aria-busy={busy}
      onClick={() => {
        if (!inactive) inputRef.current?.click();
      }}
      onKeyDown={(event) => {
        if (inactive) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        if (inactive) return;
        event.preventDefault();
      }}
      onDrop={(event) => {
        if (inactive) return;
        event.preventDefault();
        emitFiles(event.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={inactive}
        hidden
        onChange={handleChange}
      />
      {children}
    </Surface>
  );
}
