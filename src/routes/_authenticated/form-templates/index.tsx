import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { formTemplatesApi } from '@/api/form-templates';
import { DataTable } from '@/components/data-table/data-table';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Plus, Search } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { useAuth } from '@/hooks/use-auth';
import type { FormTemplate } from '@/types/api';

export const Route = createFileRoute('/_authenticated/form-templates/')({
  component: FormTemplatesPage,
});

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return '—';
  }
}

function FormTemplatesPage() {
  const { isAdmin } = useAuth();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading } = useQuery({
    queryKey: ['form-templates', page, perPage, debouncedSearch],
    queryFn: () =>
      formTemplatesApi.getFormTemplates({ page, per_page: perPage, search: debouncedSearch }),
  });

  const handlePerPageChange = useCallback((val: number) => {
    setPerPage(val);
    setPage(1);
  }, []);

  const columns = useMemo<ColumnDef<FormTemplate>[]>(() => {
    const base: ColumnDef<FormTemplate>[] = [
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
        id: 'creator',
        header: 'Created by',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.creator?.name ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'updated_at',
        header: 'Updated',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDate(row.getValue('updated_at'))}
          </span>
        ),
      },
    ];

    if (isAdmin) {
      base.push({
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button variant="ghost" size="sm" asChild>
            <Link
              to="/form-builder/$templateId"
              params={{ templateId: String(row.original.id) }}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Link>
          </Button>
        ),
      });
    }

    return base;
  }, [isAdmin]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Form Templates</h2>
          <p className="text-muted-foreground">Manage reusable form definitions</p>
        </div>
        <Button asChild={isAdmin} disabled={!isAdmin}>
          {isAdmin ? (
            <Link to="/form-builder">
              <Plus className="mr-2 h-4 w-4" /> Add Template
            </Link>
          ) : (
            <span>
              <Plus className="mr-2 h-4 w-4" /> Add Template
            </span>
          )}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search form templates..."
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
    </div>
  );
}