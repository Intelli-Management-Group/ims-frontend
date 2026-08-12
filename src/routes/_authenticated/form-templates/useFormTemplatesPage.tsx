import { Link } from '@tanstack/react-router';
import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { formTemplatesApi } from '@/api/form-templates';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { useAuth } from '@/hooks/use-auth';
import type { FormTemplate } from '@/types/api';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return '—';
  }
}

export function useFormTemplatesPage() {
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

  return {
    isAdmin,
    page,
    setPage,
    perPage,
    search,
    setSearch,
    data,
    isLoading,
    columns,
    handlePerPageChange,
  };
}
