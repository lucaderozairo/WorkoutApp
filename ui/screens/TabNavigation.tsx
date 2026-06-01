import { APP_MODE } from "@config/app-mode";
import type { Icon as PhosphorIcon } from "phosphor-react";
import {
  Chat,
  Compass,
  File,
  Gear,
  House,
  List,
  UserCircle,
} from "phosphor-react";
import { Button, Surface, Text } from "@ui/atoms";
import { Dropdown, NavItem, Popover } from "@ui/molecules";
import { Menu } from "lucide-react";
import { useState } from "react";

const GITHUB_PAGES_PATHS = new Set(["/home", "/sessions", "/profile"]);

const allDesktopTabs: { label: string; path: string; Icon: PhosphorIcon }[] = [
  { label: "Home", path: "/home", Icon: House },
  { label: "Workout", path: "/sessions", Icon: File },
  // { label: 'Schedule', path: '/schedule', Icon: CalendarBlank },
  // { label: 'Progress', path: '/progress', Icon: ChartLine },
  { label: "Social", path: "/social", Icon: Compass },
  { label: "Messages", path: "/messages", Icon: Chat },
  { label: "Profile", path: "/profile", Icon: UserCircle },
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
  return (
    <>
      <header className="menu">
        <Button
          variant="ghost"
          leading={<Menu size={18} />}
          title="menu" 
          onClick={onMenuToggle}>
          {" "}
          <Text>Menu</Text>
        </Button>
      </header>
      <nav className={`navbar ${menuOpen ? "open" : ""}`}>
        {desktopTabs.map(({ label, path, Icon }) => (
          <NavItem
            key={path}
            to={path}
            label={label}
            Icon={Icon}
            iconSize={18}
          />
        ))}
        <NavItem to="/settings" label="Settings" Icon={Gear} iconSize={18} />
      </nav>

      {/* Header — top bar */}
      <header className="header">
        {onOpenSettings && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            title="Settings">
            <Gear size={20} />
          </Button>
        )}
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
