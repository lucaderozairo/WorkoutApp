import { useRef } from 'react';
import { Column } from '@ui/layout/Column';
import { Cluster } from '@ui/layout/Cluster';

interface PhotoGalleryProps {
  photos: string[];
  onAdd: (files: FileList) => void;
  onRemove: (index: number) => void;
  label?: string;
}

export function PhotoGallery({ photos, onAdd, onRemove, label = 'Photos' }: PhotoGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <Column gap={1}>
      <span className="label">{label}</span>
      <Cluster gap={1}>
        {photos.map((url, i) => (
          <div key={i} className="photo-thumb">
            <img src={url} alt="" />
            <button type="button" className="ghost icon sm" onClick={() => onRemove(i)}>✕</button>
          </div>
        ))}
        <button
          type="button"
          className="photo-thumb surface pad-sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Column align="center" justify="center" className="h-full">
            <span className="caption">+</span>
          </Column>
        </button>
      </Cluster>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => { if (e.target.files) onAdd(e.target.files); }}
      />
    </Column>
  );
}
