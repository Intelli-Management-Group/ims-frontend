import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuth } from '../lib/auth';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '../components/layout/app-sidebar';
import { AppHeader } from '../components/layout/app-header';
import { BreadcrumbProvider } from '@/hooks/use-breadcrumb';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    // We can't use useAuth here because it's a hook, 
    // but we can check localStorage as a first pass.
    // The component will handle the full check.
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Route beforeLoad will handle redirect
  }

  return (
    <BreadcrumbProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </BreadcrumbProvider>
  );
}
