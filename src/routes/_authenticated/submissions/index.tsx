import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formSubmissionsApi } from '@/api/form-submissions';
import { DataTable } from '@/components/data-table/data-table';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
import { Eye, Pencil } from 'lucide-react';
import type { FormSubmission } from '@/types/api';

export const Route = createFileRoute('/_authenticated/submissions/')({
  component: SubmissionsPage,
});

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function SubmissionsPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['form-submissions', page, perPage],
    queryFn: () =>
      formSubmissionsApi.getFormSubmissions({
        page,
        per_page: perPage,
      }),
  });

  const columns = [
    {
      id: 'template',
      header: 'Form Name',
      cell: ({ row }: { row: { original: FormSubmission } }) => (
        <div className="font-medium">
          {row.original.current_version?.form_name ?? row.original.template?.name ?? `Template #${row.original.form_template_id}`}
        </div>
      ),
    },
    {
      id: 'version',
      header: 'Version',
      cell: ({ row }: { row: { original: FormSubmission } }) => (
        <span className="text-muted-foreground">
          v{row.original.current_version?.version_number ?? '—'}
        </span>
      ),
    },
    {
      id: 'submitted_by',
      header: 'Submitted by',
      cell: ({ row }: { row: { original: FormSubmission } }) => (
        <span className="text-muted-foreground">
          {row.original.current_version?.user?.name ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Submitted',
      cell: ({ row }: { row: { getValue: (key: string) => unknown } }) => (
        <span className="text-muted-foreground">
          {formatDate(row.getValue('created_at') as string)}
        </span>
      ),
    },
    {
      accessorKey: 'updated_at',
      header: 'Last Updated',
      cell: ({ row }: { row: { getValue: (key: string) => unknown } }) => (
        <span className="text-muted-foreground">
          {formatDate(row.getValue('updated_at') as string)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }: { row: { original: FormSubmission } }) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/submissions/$submissionId" params={{ submissionId: String(row.original.id) }}>
              <Eye className="h-4 w-4" />
              <span className="sr-only">View</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/submissions/$submissionId/edit" params={{ submissionId: String(row.original.id) }}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Submissions</h2>
        <p className="text-muted-foreground">View all filled form submissions</p>
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
