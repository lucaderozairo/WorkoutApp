import { NavLink } from 'react-router-dom';
import {
  Home,
  Dumbbell,
  CalendarDays,
  TrendingUp,
  Users,
  User,
  Settings,
  Bell,
  MessageSquare,
} from 'lucide-react';
import { APP_MODE } from '@config/app-mode';

const GITHUB_PAGES_PATHS = new Set(['/dashboard', '/log', '/profile']);

const allDesktopTabs = [
  { label: 'Home', path: '/dashboard', icon: <Home size={18} /> },
  { label: 'Workout', path: '/log', icon: <Dumbbell size={18} /> },
  { label: 'Schedule', path: '/schedule', icon: <CalendarDays size={18} /> },
  { label: 'Progress', path: '/progress', icon: <TrendingUp size={18} /> },
  { label: 'Social', path: '/social', icon: <Users size={18} /> },
  { label: 'Messages', path: '/messages', icon: <MessageSquare size={18} /> },
  { label: 'Profile', path: '/profile', icon: <User size={18} /> },
];

const allMobileTabs = [
  { label: 'Home', path: '/dashboard', icon: <Home size={22} /> },
  { label: 'Workout', path: '/log', icon: <Dumbbell size={22} /> },
  { label: 'Messages', path: '/messages', icon: <MessageSquare size={22} /> },
  { label: 'Social', path: '/social', icon: <Users size={22} /> },
  { label: 'Profile', path: '/profile', icon: <User size={22} /> },
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
        <div className="app-rail__logo brand">Fittrack</div>
        <nav className="app-rail__nav">
          {desktopTabs.map(tab => (
            <NavLink key={tab.path} to={tab.path}>
              <span className="icon">{tab.icon}</span>
              <span className="detail">{tab.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="app-rail__foot">
          <NavLink to="/settings" title="Settings">
            <span className="icon"><Settings size={18} /></span>
            <span className="detail">Settings</span>
          </NavLink>
          <a className="ghost icon" title="Notifications">
            <Bell size={18} />
            <span className="detail">
              Notifications
            </span>
          </a>
        </div>
      </aside>

      {/* Mobile topbar — visible ≤780px */}
      <header className="app-topbar">
        <span className="app-topbar__logo brand">Fittrack</span>
        <div className="row">
          <button className="ghost icon" title="Notifications">
            <Bell size={20} />
          </button>
          {onOpenSettings && (
            <button className="ghost icon" onClick={onOpenSettings} title="Settings">
              <Settings size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Mobile bottom tabbar — visible ≤780px */}
      <nav className="app-tabbar">
        <div className="app-tabbar__list">
          {mobileTabs.map(tab => (
            <NavLink key={tab.path} to={tab.path}>
              <span className="icon">{tab.icon}</span>
              <span className="detail">{tab.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
