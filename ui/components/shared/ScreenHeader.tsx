import type { ReactNode } from 'react';

type Props = {
  title: string;
  back?: () => void;
  primary?: ReactNode;
};

export function ScreenHeader({ title, back, primary }: Props) {
  return (
    <div className="row space-between align-center screen-header">
      {back ? (
        <button className="ghost icon-btn" onClick={back} aria-label="Go back">
          ←
        </button>
      ) : (
        <div className="header-slot" />
      )}
      <h2>{title}</h2>
      {primary != null ? (
        <div className="header-slot">{primary}</div>
      ) : (
        <div className="header-slot" />
      )}
    </div>
  );
}
