import { LayoutDashboard, Users, Building2, Users2, ShieldCheck, Settings, LayoutTemplate, FileText, ClipboardList } from 'lucide-react';

export type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  activePaths?: string[];
};

export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Users',
    url: '/users',
    icon: Users,
  },
  {
    title: 'Departments',
    url: '/departments',
    icon: Building2,
  },
  {
    title: 'Teams',
    url: '/teams',
    icon: Users2,
  },
  {
    title: 'Roles',
    url: '/roles',
    icon: ShieldCheck,
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
  },
  {
    title: 'Form Templates',
    url: '/form-templates',
    icon: LayoutTemplate,
    activePaths: ['/form-templates', '/form-builder'],
  },
  {
    title: 'Forms',
    url: '/forms',
    icon: FileText,
  },
  {
    title: 'Submissions',
    url: '/submissions',
    icon: ClipboardList,
  },
];

/**
 * Determines whether a nav item should be shown as active for the given pathname.
 * Uses item.activePaths if provided, otherwise falls back to item.url.
 */
export function isNavActive(pathname: string, item: NavItem): boolean {
  const paths = item.activePaths ?? [item.url];
  return paths.some((p) => {
    if (p === '/') return pathname === '/';
    return pathname === p || pathname.startsWith(`${p}/`);
  });
}
