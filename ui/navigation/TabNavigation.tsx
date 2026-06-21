import { APP_MODE } from "@config/app-mode";
import type { Icon as PhosphorIcon } from "phosphor-react";
import {
  Chat,
  Compass,
  File,
  Gear,
  House,
  List,
  MapTrifold,
  UserCircle,
} from "phosphor-react";
import { Surface, Text } from "@ui/atoms";
import { Dropdown, NavItem, Popover, Button } from "@ui/molecules";
import { Spacer, Row, Column } from "@ui/layout";
import { PanelLeft } from "lucide-react";
import { useState } from "react";

const GITHUB_PAGES_PATHS = new Set(["/home", "/sessions", "/profile"]);

const allDesktopTabs: { label: string; path: string; Icon: PhosphorIcon }[] = [
  { label: "Home", path: "/home", Icon: House },
  { label: "Workout", path: "/sessions", Icon: File },
  // { label: 'Schedule', path: '/schedule', Icon: CalendarBlank },
  // { label: 'Progress', path: '/progress', Icon: ChartLine },
  { label: "Social", path: "/social", Icon: Compass },
  { label: "Messages", path: "/messages", Icon: Chat },
  { label: "Routes", path: "/routes", Icon: MapTrifold },
];

const allMobileTabs: { label: string; path: string; Icon: PhosphorIcon }[] = [
  { label: "Home", path: "/home", Icon: House },
  { label: "Workout", path: "/sessions", Icon: File },
  { label: "Messages", path: "/messages", Icon: Chat },
  { label: "Social", path: "/social", Icon: Compass },
  { label: "Profile", path: "/profile", Icon: UserCircle },
];

const desktopTabs =
  APP_MODE === "github-pages"
    ? allDesktopTabs.filter((t) => GITHUB_PAGES_PATHS.has(t.path))
    : allDesktopTabs;

const mobileTabs =
  APP_MODE === "github-pages"
    ? allMobileTabs.filter((t) => GITHUB_PAGES_PATHS.has(t.path))
    : allMobileTabs;

interface TabNavigationProps {
  onOpenSettings?: () => void;
  menuOpen?: boolean;
  onMenuToggle?: () => void;
  onMenuClose?: () => void;
}
export function TabNavigation({
  onOpenSettings,
  menuOpen,
  onMenuToggle,
  onMenuClose,
}: TabNavigationProps) {
  const handleNavClick = () => onMenuClose?.();

  const handleSettingsClick = (e: React.MouseEvent) => {
    handleNavClick();
    // ponytail: 768 duplicates the breakpoint in styling/app-shell.css;
    // promote to a shared constant if a third JS consumer needs it.
    if (window.matchMedia('(min-width: 768px)').matches) {
      e.preventDefault();
      onOpenSettings?.();
    }
  };

  return (
    <>
      <header className="menu">
        <Button variant="ghost" title="Menu" size="md" onClick={onMenuToggle}>
          {<PanelLeft size={16} />}
          {menuOpen && <Text>Menu</Text>}
        </Button>
      </header>
      <Column as="nav" gap={1} className={`navbar ${menuOpen ? "open" : ""}`}>
        {desktopTabs.map(({ label, path, Icon }) => (
          <NavItem
            key={path}
            to={path}
            title={label}
            label={`${menuOpen ? label : ""}`}
            Icon={Icon}
            iconSize={16}
            onClick={handleNavClick}
          />
        ))}
        <Spacer />

        <NavItem
          to="/profile"
          title="Profile"
          label={`${menuOpen ? "Profile" : ""}`}
          Icon={UserCircle}
          iconSize={16}
          onClick={handleNavClick}
        />

        <NavItem
          to="/settings"
          label={`${menuOpen ? "Settings" : ""}`}
          title="Settings"
          Icon={Gear}
          iconSize={16}
          onClick={handleSettingsClick}
        />
      </Column>

      {/* Header — top bar */}
      <header className="header">
        {/* <Row align="center" justify="end">
          <Button variant="primary">Login</Button>
        </Row> */}
      </header>

      {/* App bar — mobile bottom tab bar */}
      <nav className="appbar center">
        {mobileTabs.map(({ label, path, Icon }) => (
          <NavItem
            key={path}
            to={path}
            label={label}
            Icon={Icon}
            iconSize={22}
          />
        ))}
      </nav>
    </>
  );
}
