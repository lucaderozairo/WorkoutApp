import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { APP_MODE } from '@config/app-mode';
import type { Icon as PhosphorIcon } from 'phosphor-react';
import { Bell, CalendarBlank, ChartLine, Chat, Compass, File, Gear, House, ToggleLeft, ToggleRight, UserCircle } from 'phosphor-react';
import logo  from '/logo.png';
function useTheme(): 'light' | 'dark' {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const t = document.documentElement.getAttribute('data-theme');
    return t === 'dark' ? 'dark' : 'light';
  });
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const t = document.documentElement.getAttribute('data-theme');
      setTheme(t === 'dark' ? 'dark' : 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return theme;
}

function ThemeToggle({ size = 20 }: { size?: number }) {
  const theme = useTheme();
  const toggle = () => {
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'dark' : 'light');
  };
  return (
    <button className='ghost' onClick={toggle} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
      {theme === 'light'
        ? <ToggleLeft size={size} weight="regular" />
        : <ToggleRight size={size} weight="fill" />}
      Theme
    </button>
  );
}

const GITHUB_PAGES_PATHS = new Set(['/dashboard', '/log', '/profile']);

const allDesktopTabs: { label: string; path: string; Icon: PhosphorIcon }[] = [
  { label: 'Home', path: '/dashboard', Icon: House },
  { label: 'Workout', path: '/log', Icon: File },
  { label: 'Schedule', path: '/schedule', Icon: CalendarBlank },
  { label: 'Progress', path: '/progress', Icon: ChartLine },
  { label: 'Social', path: '/social', Icon: Compass },
  { label: 'Messages', path: '/messages', Icon: Chat },
  { label: 'Profile', path: '/profile', Icon: UserCircle },
];

const allMobileTabs: { label: string; path: string; Icon: PhosphorIcon }[] = [
  { label: 'Home', path: '/dashboard', Icon: House },
  { label: 'Workout', path: '/log', Icon: File },
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
        <div className="surface compact ghost">
          <NavLink to={"/"}>
            <span className='icon'>
              <img src={logo} alt="Fittrack logo" width="18" height="18" />
            </span>
            <span className="detail">Fittrack</span>
          </NavLink>
        </div>
        <hr />
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
          {/* <a className="ghost icon" title="Notifications">
            <Bell size={18} />
            <span className="detail">Notifications</span>
          </a> */}

          <ThemeToggle size={18} />
        </div>
      </aside>

      {/* Mobile topbar — visible ≤780px */}
      <header className="app-topbar row align-center space-between">
        <NavLink key={"/"} to={"/"}>
          <span className='icon'>
            <img src={logo} alt="Fittrack logo" width="24" height="24" />
          </span>
          <h2>Fittrack</h2>
        </NavLink>
        <div className="row">
          <ThemeToggle size={20} />
          {/* <button className="ghost icon" title="Notifications">
            <Bell size={20} />
          </button> */}
          {onOpenSettings && (
            <button className="ghost icon" onClick={onOpenSettings} title="Settings">
              <Gear size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Mobile bottom tabbar — visible ≤780px */}
      <nav className="app-tabbar">
        <div className="app-tabbar__list">
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
