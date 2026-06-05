import type { ButtonHTMLAttributes } from 'react';
import { Button } from '../../molecules/Button';
import { Icon } from '../../atoms/Icon';
import type { IconName } from '../../atoms/icons';

interface MapControlButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  active?: boolean;
}

export function MapControlButton({ icon, active, ...rest }: MapControlButtonProps) {
  return (
    <Button variant="ghost" size="icon-sm" active={active} data-map-btn {...rest}>
      <Icon name={icon} size="sm" />
    </Button>
  );
}
