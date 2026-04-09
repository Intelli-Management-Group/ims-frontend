import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeSelector } from '@/components/theme-selector';
import { Link, useLocation } from '@tanstack/react-router';
import { useBreadcrumb } from '@/hooks/use-breadcrumb';

/** Map path segments to human-friendly labels. */
const SEGMENT_LABELS: Record<string, string> = {
  'form-builder': 'Form Builder',
  'form-templates': 'Form Templates',
};

/**
 * Routes that should display extra parent breadcrumbs.
 * Key: first path segment, Value: array of { label, path } ancestors to insert before it.
 */
const BREADCRUMB_PARENTS: Record<string, { label: string; path: string }[]> = {
  'form-builder': [{ label: 'Form Templates', path: '/form-templates' }],
};

function formatSegmentLabel(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  return segment
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function AppHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { overrides } = useBreadcrumb();

  // If a page has set explicit breadcrumb overrides, use those directly.
  const breadcrumbs: { label: string; path: string; isPage: boolean }[] = [];

  if (overrides) {
    overrides.forEach((crumb, index) => {
      const isLast = index === overrides.length - 1;
      breadcrumbs.push({ label: crumb.label, path: crumb.path, isPage: isLast });
    });
  } else {
    const pathSegments = location.pathname.split('/').filter(Boolean);

    // Check if the first segment has virtual parents
    if (pathSegments.length > 0 && BREADCRUMB_PARENTS[pathSegments[0]]) {
      for (const parent of BREADCRUMB_PARENTS[pathSegments[0]]) {
        breadcrumbs.push({ label: parent.label, path: parent.path, isPage: false });
      }
    }

    pathSegments.forEach((segment, index) => {
      const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
      const isLast = index === pathSegments.length - 1;
      breadcrumbs.push({ label: formatSegmentLabel(segment), path, isPage: isLast });
    });
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 sticky top-0 z-30 bg-background">
      <SidebarTrigger className="-ml-1" />
      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.map((crumb) => (
            <React.Fragment key={crumb.path}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {crumb.isPage ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.path}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="flex items-center gap-2">
        <ThemeSelector />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 outline-none">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left text-sm md:block">
                <p className="font-medium leading-none">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

import React from 'react';
