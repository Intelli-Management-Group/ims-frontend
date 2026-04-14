import { LayoutDashboard, Users, Building2, Users2, ShieldCheck, Settings, LayoutTemplate, FileText, ClipboardList } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Link, useLocation } from '@tanstack/react-router';

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  activePaths?: string[];
};

const navItems: NavItem[] = [
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

function isNavActive(pathname: string, item: NavItem): boolean {
  const paths = item.activePaths ?? [item.url];
  return paths.some((p) => {
    if (p === '/') return pathname === '/';
    return pathname === p || pathname.startsWith(`${p}/`);
  });
}

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex h-14 items-center border-b px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            IMS
          </div>
          <span className="group-data-[collapsible=icon]:hidden">Admin Panel</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isNavActive(location.pathname, item)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
