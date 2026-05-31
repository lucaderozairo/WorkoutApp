import type { ReactNode } from 'react';
import { Button } from '@ui/atoms/Button';
import { Icon } from '@ui/atoms/Icon';
import { Row } from '@ui/layout/Row';

interface ScreenHeaderProps {
  title: string;
  back?: () => void;
  primary?: ReactNode;
}

export function ScreenHeader({ title, back, primary }: ScreenHeaderProps) {
  return (
    <Row justify="between" align="center" className="screen-header">
      {back ? (
        <Button variant="ghost" size="icon" onClick={back} aria-label="Go back">
          <Icon name="back" />
        </Button>
      ) : (
        <div className="header-slot" />
      )}
      <h2>{title}</h2>
      <div className="header-slot">
        {primary ?? null}
      </div>
    </Row>
  );
}
