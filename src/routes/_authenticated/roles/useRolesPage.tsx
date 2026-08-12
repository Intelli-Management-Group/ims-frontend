import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { rolesApi } from '@/api/roles';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'sonner';
import type { RoleFormValues } from './components/roles-dialog';
import type { Role } from '@/types/api';
import { useAuth } from '@/hooks/use-auth';

export function useRolesPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['roles', page, perPage, debouncedSearch],
    queryFn: () => rolesApi.getRoles({ page, per_page: perPage, search: debouncedSearch }),
  });

  const createMutation = useMutation({
    mutationFn: rolesApi.createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role created successfully');
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create role');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RoleFormValues }) =>
      rolesApi.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role updated successfully');
      setIsDialogOpen(false);
      setEditingRole(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update role');
    },
  });

  const handleSubmit = useCallback(
    (values: RoleFormValues) => {
      if (editingRole) {
        updateMutation.mutate({ id: editingRole.id, data: values });
      } else {
        createMutation.mutate(values);
      }
    },
    [editingRole, createMutation, updateMutation],
  );

  const handleEdit = useCallback((role: Role) => {
    setEditingRole(role);
    setIsDialogOpen(true);
  }, []);

  const handleAddNew = useCallback(() => {
    setEditingRole(null);
    setIsDialogOpen(true);
  }, []);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setIsDialogOpen(open);
    if (!open) setEditingRole(null);
  }, []);

  const handlePerPageChange = useCallback((val: number) => {
    setPerPage(val);
    setPage(1);
  }, []);

  const columns = useMemo<ColumnDef<Role>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
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

  return {
    isAdmin,
    page,
    setPage,
    perPage,
    search,
    setSearch,
    isDialogOpen,
    editingRole,
    data,
    isLoading,
    columns,
    isPending,
    handleAddNew,
    handleDialogOpenChange,
    handlePerPageChange,
    handleSubmit,
  };
}
