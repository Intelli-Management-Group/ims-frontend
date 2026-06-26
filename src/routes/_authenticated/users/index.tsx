import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/api/users';
import { departmentsApi } from '@/api/departments';
import { teamsApi } from '@/api/teams';
import { rolesApi } from '@/api/roles';
import { DataTable } from '@/components/data-table/data-table';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { useAuth } from '@/hooks/use-auth';
import type { User } from '@/types/api';
import { UserDialog } from './components/user-dialog';
import { getUserColumns } from './components/user-columns';

export const Route = createFileRoute('/_authenticated/users/')({
  component: UsersPage,
});

function UsersPage() {
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

  const openCreateDialog = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

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

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">Manage user accounts</p>
        </div>
        <Button onClick={openCreateDialog} disabled={!isAdmin}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
      />

      {/* Pagination */}
      {data && (
        <DataTablePagination
          currentPage={page}
          lastPage={data.meta.last_page}
          onPageChange={setPage}
          perPage={perPage}
          onPerPageChange={(val) => {
            setPerPage(val);
            setPage(1);
          }}
          total={data.meta.total}
        />
      )}

      {/* Create / Edit dialog
          The `key` forces a full remount whenever the target user changes so
          that useForm always picks up the correct defaultValues. Without this,
          the form only reads defaultValues once on mount and ignores later
          prop changes, leaving all fields empty when switching to edit mode. */}
      <UserDialog
        key={editingUser?.id ?? 'create'}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingUser={editingUser}
        departments={departmentsData?.data ?? []}
        teams={teamsData?.data ?? []}
        roles={rolesData?.data ?? []}
      />
    </div>
  );
}
