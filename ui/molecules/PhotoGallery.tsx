import { useRef } from 'react';

interface PhotoGalleryProps {
  photos: string[];
  onAdd: (files: FileList) => void;
  onRemove: (index: number) => void;
  label?: string;
}

export function PhotoGallery({ photos, onAdd, onRemove, label = 'Photos' }: PhotoGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="column compact">
      <span className="label">{label}</span>
      <div className="row compact wrap">
        {photos.map((url, i) => (
          <div key={i} className="photo-thumb">
            <img src={url} alt="" />
            <button type="button" className="ghost icon sm photo-del" onClick={() => onRemove(i)}>✕</button>
          </div>
        ))}
        <button
          type="button"
          className="photo-thumb surface tight column align-center center"
          onClick={() => fileInputRef.current?.click()}
        >
          <span className="caption">+</span>
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => { if (e.target.files) onAdd(e.target.files); }}
      />
    </div>
  );
}
