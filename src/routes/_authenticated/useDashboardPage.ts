import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/api/users';
import { departmentsApi } from '@/api/departments';
import { teamsApi } from '@/api/teams';
import { rolesApi } from '@/api/roles';
import { useAuth } from '@/hooks/use-auth';
import { Users, Building2, Users2, ShieldCheck } from 'lucide-react';

export const DASHBOARD_CARDS = [
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

export function useDashboardPage() {
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

  return { user, stats };
}
