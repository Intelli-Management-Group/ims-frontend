import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/api/users';
import { departmentsApi } from '@/api/departments';
import { teamsApi } from '@/api/teams';
import { rolesApi } from '@/api/roles';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import {
  Users,
  Building2,
  Users2,
  ShieldCheck,
} from 'lucide-react';

export const Route = createFileRoute('/_authenticated/')({
  component: DashboardPage,
});

const DASHBOARD_CARDS = [
  {
    key: 'users',
    title: 'Total Users',
    icon: Users,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  {
    key: 'departments',
    title: 'Departments',
    icon: Building2,
    color: 'text-green-600',
    bg: 'bg-green-100',
  },
  {
    key: 'teams',
    title: 'Teams',
    icon: Users2,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
  },
  {
    key: 'roles',
    title: 'Roles',
    icon: ShieldCheck,
    color: 'text-orange-600',
    bg: 'bg-orange-100',
  },
] as const;

function DashboardPage() {
  const { user } = useAuth();

  const usersQuery = useQuery({
    queryKey: ['users-count'],
    queryFn: () => usersApi.getUsers({ per_page: 1 }),
  });

  const departmentsQuery = useQuery({
    queryKey: ['departments-count'],
    queryFn: () => departmentsApi.getDepartments({ per_page: 1 }),
  });

  const teamsQuery = useQuery({
    queryKey: ['teams-count'],
    queryFn: () => teamsApi.getTeams({ per_page: 1 }),
  });

  const rolesQuery = useQuery({
    queryKey: ['roles-count'],
    queryFn: () => rolesApi.getRoles({ per_page: 1 }),
  });

  const stats = {
    users: usersQuery.data?.meta?.total ?? null,
    departments: departmentsQuery.data?.meta?.total ?? null,
    teams: teamsQuery.data?.meta?.total ?? null,
    roles: rolesQuery.data?.meta?.total ?? null,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.name ?? 'User'}!
        </h2>

        <p className="text-muted-foreground">
          Here's an overview of your organization.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {DASHBOARD_CARDS.map((card) => {
          const value = stats[card.key];

          return (
            <Card key={card.key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>

                <div className={`rounded-md p-2 ${card.bg}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>

              <CardContent>
                {value === null ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <div className="text-2xl font-bold">
                    {value}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}