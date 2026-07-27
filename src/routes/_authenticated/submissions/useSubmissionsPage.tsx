import { Link } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { formSubmissionsApi } from '@/api/form-submissions';
import { Button } from '@/components/ui/button';
import { Eye, Pencil } from 'lucide-react';
import type { FormSubmission } from '@/types/api';

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
}

export function useSubmissionsPage() {
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

  const handlePerPageChange = useCallback((val: number) => {
    setPerPage(val);
    setPage(1);
  }, []);

  const columns = useMemo<ColumnDef<FormSubmission>[]>(
    () => [
      {
        id: 'template',
        header: 'Form Name',
        cell: ({ row }) => (
          <div className="font-medium">
            {row.original.current_version?.form_name ??
              row.original.template?.name ??
              `Template #${row.original.form_template_id}`}
          </div>
        ),
      },
      {
        id: 'version',
        header: 'Version',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            v{row.original.current_version?.version_number ?? '—'}
          </span>
        ),
      },
      {
        id: 'submitted_by',
        header: 'Submitted by',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.current_version?.user?.name ?? '—'}
          </span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Submitted',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDate(row.original.created_at)}</span>
        ),
      },
      {
        accessorKey: 'updated_at',
        header: 'Last Updated',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDate(row.original.updated_at)}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/submissions/$submissionId" params={{ submissionId: String(row.original.id) }}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link
                to="/submissions/$submissionId/edit"
                params={{ submissionId: String(row.original.id) }}
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return { page, setPage, perPage, data, isLoading, columns, handlePerPageChange };
}
