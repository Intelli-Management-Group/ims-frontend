import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { teamsApi } from '@/api/teams';
import { departmentsApi } from '@/api/departments';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'sonner';
import type { TeamFormValues } from './components/team-dialog';
import type { Team } from '@/types/api';
import { useAuth } from '@/hooks/use-auth';

export function useTeamsPage() {
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

  return {
    isAdmin,
    page,
    setPage,
    perPage,
    search,
    setSearch,
    isDialogOpen,
    editingTeam,
    data,
    isLoading,
    departments,
    columns,
    isPending,
    handleAddNew,
    handleDialogOpenChange,
    handlePerPageChange,
    handleSubmit,
  };
}
