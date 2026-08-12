import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { departmentsApi } from '@/api/departments';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'sonner';
import type { DepartmentFormValues } from './components/departments-dialog';
import type { Department } from '@/types/api';
import { useAuth } from '@/hooks/use-auth';

export function useDepartmentsPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['departments', page, perPage, debouncedSearch],
    queryFn: () =>
      departmentsApi.getDepartments({ page, per_page: perPage, search: debouncedSearch }),
  });

  const createMutation = useMutation({
    mutationFn: departmentsApi.createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department created successfully');
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create department');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: DepartmentFormValues }) =>
      departmentsApi.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department updated successfully');
      setIsDialogOpen(false);
      setEditingDepartment(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update department');
    },
  });

  const handleSubmit = useCallback(
    (values: DepartmentFormValues) => {
      if (editingDepartment) {
        updateMutation.mutate({ id: editingDepartment.id, data: values });
      } else {
        createMutation.mutate(values);
      }
    },
    [editingDepartment, createMutation, updateMutation],
  );

  const handleEdit = useCallback((dept: Department) => {
    setEditingDepartment(dept);
    setIsDialogOpen(true);
  }, []);

  const handleAddNew = useCallback(() => {
    setEditingDepartment(null);
    setIsDialogOpen(true);
  }, []);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setIsDialogOpen(open);
    if (!open) setEditingDepartment(null);
  }, []);

  const handlePerPageChange = useCallback((val: number) => {
    setPerPage(val);
    setPage(1);
  }, []);

  const columns = useMemo<ColumnDef<Department>[]>(
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
    editingDepartment,
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
