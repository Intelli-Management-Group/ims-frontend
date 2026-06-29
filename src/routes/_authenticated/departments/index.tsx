import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { departmentsApi } from '@/api/departments';
import { DataTable } from '@/components/data-table/data-table';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Pencil } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'sonner';
import { DepartmentDialog, type DepartmentFormValues } from './components/departments-dialog';
import type { Department } from '@/types/api';
import { useAuth } from '@/hooks/use-auth';

export const Route = createFileRoute('/_authenticated/departments/')({
  component: DepartmentsPage,
});

function DepartmentsPage() {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Departments</h2>
          <p className="text-muted-foreground">Manage your organization's departments</p>
        </div>
        <Button onClick={handleAddNew} disabled={!isAdmin}>
          <Plus className="mr-2 h-4 w-4" /> Add Department
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search departments..."
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
        <DepartmentDialog
          open={isDialogOpen}
          onOpenChange={handleDialogOpenChange}
          department={editingDepartment}
          isPending={isPending}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}