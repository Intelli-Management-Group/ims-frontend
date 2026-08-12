import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/api/users';
import { departmentsApi } from '@/api/departments';
import { teamsApi } from '@/api/teams';
import { rolesApi } from '@/api/roles';
import { useDebounce } from '@/hooks/use-debounce';
import { useAuth } from '@/hooks/use-auth';
import type { User } from '@/types/api';
import { getUserColumns } from './components/user-columns';

export function useUsersPage() {
  const { isAdmin } = useAuth();

  // -------------------------------------------------------------------------
  // Pagination & search state
  // -------------------------------------------------------------------------
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  // -------------------------------------------------------------------------
  // Dialog state
  // -------------------------------------------------------------------------
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const openCreateDialog = useCallback(() => {
    setEditingUser(null);
    setIsDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  }, []);

  const handlePerPageChange = useCallback((val: number) => {
    setPerPage(val);
    setPage(1);
  }, []);

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------
  const { data, isLoading } = useQuery({
    queryKey: ['users', page, perPage, debouncedSearch],
    queryFn: () =>
      usersApi.getUsers({ page, per_page: perPage, search: debouncedSearch }),
  });

  const { data: departmentsData } = useQuery({
    queryKey: ['departments-all'],
    queryFn: () => departmentsApi.getDepartments({ per_page: 100 }),
  });

  const { data: teamsData } = useQuery({
    queryKey: ['teams-all'],
    queryFn: () => teamsApi.getTeams({ per_page: 100 }),
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles-all'],
    queryFn: () => rolesApi.getRoles({ per_page: 100 }),
  });

  // -------------------------------------------------------------------------
  // Columns (memoised implicitly — recreated only when isAdmin changes)
  // -------------------------------------------------------------------------
  const columns = getUserColumns({ isAdmin, onEdit: openEditDialog });

  return {
    isAdmin,
    page,
    setPage,
    perPage,
    search,
    setSearch,
    isDialogOpen,
    setIsDialogOpen,
    editingUser,
    data,
    isLoading,
    departmentsData,
    teamsData,
    rolesData,
    columns,
    openCreateDialog,
    handlePerPageChange,
  };
}
