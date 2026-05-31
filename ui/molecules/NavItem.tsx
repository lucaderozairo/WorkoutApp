import { NavLink } from 'react-router-dom';
import type { Icon as PhosphorIcon } from 'phosphor-react';
import { Text } from '@ui/atoms';

interface NavItemProps {
  to: string;
  label: string;
  Icon: PhosphorIcon;
  iconSize?: number;
  title?: string;
}

export function NavItem({ to, label, Icon, iconSize = 18, title }: NavItemProps) {
  return (
    <NavLink to={to} title={title ?? label}>
      {({ isActive }) => (
        <>
          <span className="icon">
            <Icon size={iconSize} weight={isActive ? 'fill' : 'regular'} />
          </span>
          <Text size="detail">{label}</Text>
        </>
      )}
    </NavLink>
  );
}
