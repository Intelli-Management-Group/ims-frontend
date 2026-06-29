import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { teamsApi } from '@/api/teams';
import { departmentsApi } from '@/api/departments';
import { DataTable } from '@/components/data-table/data-table';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Pencil } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'sonner';
import { TeamDialog, type TeamFormValues } from './components/team-dialog';
import type { Team } from '@/types/api';
import { useAuth } from '@/hooks/use-auth';

export const Route = createFileRoute('/_authenticated/teams/')({
  component: TeamsPage,
});

function TeamsPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['teams', page, perPage, debouncedSearch],
    queryFn: () => teamsApi.getTeams({ page, per_page: perPage, search: debouncedSearch }),
  });

  const { data: departmentsData } = useQuery({
    queryKey: ['departments-all'],
    queryFn: () => departmentsApi.getDepartments({ per_page: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (values: TeamFormValues) =>
      teamsApi.createTeam({ ...values, department_id: Number(values.department_id) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team created successfully');
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create team');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TeamFormValues }) =>
      teamsApi.updateTeam(id, { ...data, department_id: Number(data.department_id) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team updated successfully');
      setIsDialogOpen(false);
      setEditingTeam(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update team');
    },
  });

  const handleSubmit = useCallback(
    (values: TeamFormValues) => {
      if (editingTeam) {
        updateMutation.mutate({ id: editingTeam.id, data: values });
      } else {
        createMutation.mutate(values);
      }
    },
    [editingTeam, createMutation, updateMutation],
  );

  const handleEdit = useCallback((team: Team) => {
    setEditingTeam(team);
    setIsDialogOpen(true);
  }, []);

  const handleAddNew = useCallback(() => {
    setEditingTeam(null);
    setIsDialogOpen(true);
  }, []);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setIsDialogOpen(open);
    if (!open) setEditingTeam(null);
  }, []);

  const handlePerPageChange = useCallback((val: number) => {
    setPerPage(val);
    setPage(1);
  }, []);

  const columns = useMemo<ColumnDef<Team>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
      },
      {
        accessorKey: 'department.name',
        header: 'Department',
        cell: ({ row }) => <div>{row.original.department?.name ?? '-'}</div>,
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => <StatusBadge isActive={!!row.getValue('is_active')} />,
      },
      {
        id: 'edit',
        header: 'Edit',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(row.original)}
            disabled={!isAdmin}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [isAdmin, handleEdit],
  );

  const isPending = createMutation.isPending || updateMutation.isPending;
  const departments = departmentsData?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Teams</h2>
          <p className="text-muted-foreground">Manage your organization's teams</p>
        </div>
        <Button onClick={handleAddNew} disabled={!isAdmin}>
          <Plus className="mr-2 h-4 w-4" /> Add Team
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teams..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading} />

      {data && (
        <DataTablePagination
          currentPage={page}
          lastPage={data.meta.last_page}
          onPageChange={setPage}
          perPage={perPage}
          onPerPageChange={handlePerPageChange}
          total={data.meta.total}
        />
      )}

      {isDialogOpen && (
        <TeamDialog
          open={isDialogOpen}
          onOpenChange={handleDialogOpenChange}
          team={editingTeam}
          departments={departments}
          isPending={isPending}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
