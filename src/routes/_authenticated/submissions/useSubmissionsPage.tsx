import { Link } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { formSubmissionsApi } from '@/api/form-submissions';
import { Button } from '@/components/ui/button';
import { Eye, Pencil } from 'lucide-react';
import type { FormSubmission } from '@/types/api';

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const PRIORITY_BADGE_STYLES: Record<string, string> = {
  low: 'bg-sky-100 text-sky-800 ring-sky-200 dark:bg-sky-950 dark:text-sky-200 dark:ring-sky-800',
  medium: 'bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-800',
  high: 'bg-orange-100 text-orange-800 ring-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:ring-orange-800',
  critical: 'bg-red-100 text-red-800 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-800',
};

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
  const [priorityFilter, setPriorityFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['form-submissions', page, perPage, priorityFilter],
    queryFn: () =>
      formSubmissionsApi.getFormSubmissions({
        page,
        per_page: perPage,
        ...(priorityFilter !== 'all' ? { priority: priorityFilter } : {}),
      }),
  });

  const handlePerPageChange = useCallback((val: number) => {
    setPerPage(val);
    setPage(1);
  }, []);

  const handlePriorityFilterChange = useCallback((value: string) => {
    setPriorityFilter(value);
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
        id: 'priority',
        header: 'Priority',
        cell: ({ row }) => {
          const value = row.original.priority?.toLowerCase();
          const label = value ? PRIORITY_LABELS[value] ?? value : '—';

          if (!value) {
            return <span className="text-muted-foreground">—</span>;
          }

          return (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${PRIORITY_BADGE_STYLES[value] ?? 'bg-muted text-muted-foreground ring-muted-foreground/20'}`}
            >
              {label}
            </span>
          );
        },
      },
      {
        id: 'submitted_by',
        header: 'Submitted by',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.created_by ?? '—'}
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

  return {
    page,
    setPage,
    perPage,
    data,
    isLoading,
    columns,
    handlePerPageChange,
    priorityFilter,
    setPriorityFilter: handlePriorityFilterChange,
    priorityOptions: PRIORITY_OPTIONS,
  };
}
