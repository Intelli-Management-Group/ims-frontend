import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { AuthProvider } from '@/lib/auth';
import { TooltipProvider } from '@/components/ui/tooltip';
import { routeTree } from '@/routeTree.gen';
import { authApi } from '@/api/auth';
import type { AuthUser } from '@/types/api';

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: AuthUser | null;
  token?: string | null;
}

interface RenderWithRouterOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  user?: AuthUser | null;
  token?: string | null;
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: React.ReactElement,
  { user = null, token = null, ...renderOptions }: RenderWithProvidersOptions = {}
) {
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }

  const queryClient = createTestQueryClient();
  if (user) {
    vi.mocked(authApi.me).mockImplementation(() => Promise.resolve(user));
    localStorage.setItem('access_token', 'test-token');
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

export function renderWithRouter({
  route = '/',
  user = null,
  token = null,
  ...renderOptions
}: RenderWithRouterOptions = {}) {
  if (token) {
    localStorage.setItem('access_token', token);
  } else if (user) {
    localStorage.setItem('access_token', 'test-token');
  } else {
    localStorage.removeItem('access_token');
  }

  const queryClient = createTestQueryClient();
  if (user) {
    vi.mocked(authApi.me).mockImplementation(() => Promise.resolve(user));
  }

  const router = createRouter({ routeTree });
  router.navigate({ to: route as '/' });

  const result = render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <TooltipProvider>
            <RouterProvider router={router} />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>,
    renderOptions
  );

  return { ...result, queryClient, router };
}
