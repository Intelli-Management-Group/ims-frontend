import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formTemplatesApi } from '@/api/form-templates';
import { DataTable } from '@/components/data-table/data-table';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { useAuth } from '@/hooks/use-auth';

export const Route = createFileRoute('/_authenticated/form-templates/')({
  component: FormTemplatesPage,
});

function formatUpdatedAt(iso: string): string {
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
      formTemplatesApi.getFormTemplates({
        page,
        per_page: perPage,
        search: debouncedSearch,
      }),
  });

  const columns = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }: any) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }: any) => <StatusBadge isActive={!!row.getValue('is_active')} />,
    },
    {
      id: 'creator',
      header: 'Created by',
      cell: ({ row }: any) => (
        <span className="text-muted-foreground">{row.original.creator?.name ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'updated_at',
      header: 'Updated',
      cell: ({ row }: any) => (
        <span className="text-muted-foreground">
          {formatUpdatedAt(row.getValue('updated_at') as string)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Form Templates</h2>
          <p className="text-muted-foreground">Manage reusable form definitions</p>
        </div>
        {isAdmin ? (
          <Button asChild>
            <Link to="/form-builder">
              <Plus className="mr-2 h-4 w-4" /> Add Template
            </Link>
          </Button>
        ) : (
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" /> Add Template
          </Button>
        )}
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

      <DataTable columns={columns} data={data?.data || []} isLoading={isLoading} />

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
    </div>
  );
}
