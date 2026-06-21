import { NavLink } from 'react-router-dom';
import type { Icon as PhosphorIcon } from 'phosphor-react';
import { Text } from '@ui/atoms';

interface NavItemProps {
  to: string;
  label: string;
  Icon: PhosphorIcon;
  iconSize?: number;
  title?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function NavItem({ to, label, Icon, iconSize = 18, title, onClick }: NavItemProps) {
  return (
    <NavLink to={to} title={title ?? label} onClick={onClick}>
      {({ isActive }) => (
        <>
          <span className="icon">
            <Icon size={iconSize} weight={isActive ? 'fill' : 'regular'} />
          </span>
          {label && <Text size="detail">{label}</Text>} 
        </>
      )}
    </NavLink>
  );
}
