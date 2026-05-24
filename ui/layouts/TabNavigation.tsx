import { NavLink } from 'react-router-dom';
import { APP_MODE } from '@config/app-mode';
import type { Icon as PhosphorIcon } from 'phosphor-react';
import { Bell, CalendarBlank, ChartLine, Chat, Compass, File, Gear, House, UserCircle } from 'phosphor-react';

const GITHUB_PAGES_PATHS = new Set(['/home', '/sessions', '/profile']);

const allDesktopTabs: { label: string; path: string; Icon: PhosphorIcon }[] = [
  { label: 'Home', path: '/home', Icon: House },
  { label: 'Workout', path: '/sessions', Icon: File },
  // { label: 'Schedule', path: '/schedule', Icon: CalendarBlank },
  // { label: 'Progress', path: '/progress', Icon: ChartLine },
  { label: 'Social', path: '/social', Icon: Compass },
  { label: 'Messages', path: '/messages', Icon: Chat },
  { label: 'Profile', path: '/profile', Icon: UserCircle },
];

const allMobileTabs: { label: string; path: string; Icon: PhosphorIcon }[] = [
  { label: 'Home', path: '/home', Icon: House },
  { label: 'Workout', path: '/sessions', Icon: File },
  { label: 'Messages', path: '/messages', Icon: Chat },
  { label: 'Social', path: '/social', Icon: Compass },
  { label: 'Profile', path: '/profile', Icon: UserCircle },
];

const desktopTabs = APP_MODE === 'github-pages'
  ? allDesktopTabs.filter(t => GITHUB_PAGES_PATHS.has(t.path))
  : allDesktopTabs;

const mobileTabs = APP_MODE === 'github-pages'
  ? allMobileTabs.filter(t => GITHUB_PAGES_PATHS.has(t.path))
  : allMobileTabs;

interface TabNavigationProps {
  onOpenSettings?: () => void;
}

export function TabNavigation({ onOpenSettings }: TabNavigationProps) {
  return (
    <>
      {/* Desktop rail — visible >780px */}
      <aside className="app-rail">
        <nav className="surface ghost">
          {desktopTabs.map(({ label, path, Icon }) => (
            <NavLink key={path} to={path}>
              {({ isActive }) => (
                <>
                  <span className="icon"><Icon size={18} weight={isActive ? 'fill' : 'regular'} /></span>
                  <span className="detail">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <hr />
        <div className="surface ghost">
          <NavLink to="/settings" title="Settings">
            {({ isActive }) => (
              <>
                <span className="icon"><Gear size={18} weight={isActive ? 'fill' : 'regular'} /></span>
                <span className="detail">Settings</span>
              </>
            )}
          </NavLink>
        </div>
      </aside>

      {/* Mobile topbar — visible ≤780px */}
      <header className="app-topbar row align-center">
        {/* <button className="ghost icon" title="Notifications">
          <Bell size={20} />
        </button> */}
        {onOpenSettings && (
          <button className="ghost icon" onClick={onOpenSettings} title="Settings">
            <Gear size={20} />
          </button>
        )}
      </header>

      {/* Mobile bottom tabbar — visible ≤780px */}
      <nav className="app-tabbar center">
        <div className="surface tight row space-around ">
          {mobileTabs.map(({ label, path, Icon }) => (
            <NavLink key={path} to={path}>
              {({ isActive }) => (
                <>
                  <span className="icon"><Icon size={22} weight={isActive ? 'fill' : 'regular'} /></span>
                  <span className="detail">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
