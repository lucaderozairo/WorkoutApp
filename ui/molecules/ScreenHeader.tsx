import type { ReactNode } from 'react';
import { Button } from '@ui/atoms/Button';
import { Icon } from '@ui/atoms/Icon';

interface ScreenHeaderProps {
  title: string;
  back?: () => void;
  primary?: ReactNode;
}

export function ScreenHeader({ title, back, primary }: ScreenHeaderProps) {
  return (
    <div className="row space-between align-center screen-header">
      {back ? (
        <Button variant="ghost" size="icon" onClick={back} aria-label="Go back">
          <Icon name="back" />
        </Button>
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
