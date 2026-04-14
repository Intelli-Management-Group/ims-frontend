import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formTemplatesApi } from '@/api/form-templates';
import { DataTable } from '@/components/data-table/data-table';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Search } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import type { FormTemplate } from '@/types/api';

export const Route = createFileRoute('/_authenticated/forms/')({
  component: FormsPage,
});

function FormsPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading } = useQuery({
    queryKey: ['forms-list', page, perPage, debouncedSearch],
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
      header: 'Form',
      cell: ({ row }: { row: { original: FormTemplate } }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      id: 'creator',
      header: 'Created by',
      cell: ({ row }: { row: { original: FormTemplate } }) => (
        <span className="text-muted-foreground">{row.original.creator?.name ?? '—'}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }: { row: { original: FormTemplate } }) => (
        <div className="flex justify-end">
          <Button size="sm" asChild>
            <Link to="/forms/$templateId" params={{ templateId: String(row.original.id) }}>
              <FileText className="mr-2 h-4 w-4" />
              Fill
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Forms</h2>
        <p className="text-muted-foreground">Select a form to fill out and submit</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search forms..."
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
