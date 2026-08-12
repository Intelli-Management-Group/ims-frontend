import { Link } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { formTemplatesApi } from '@/api/form-templates';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import type { FormTemplate } from '@/types/api';

export function useFormsPage() {
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

  const handlePerPageChange = useCallback((val: number) => {
    setPerPage(val);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const columns = useMemo<ColumnDef<FormTemplate>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Form',
        cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
      },
      {
        id: 'creator',
        header: 'Created by',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.creator?.name ?? '—'}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
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
    ],
    [],
  );

  return {
    page,
    setPage,
    perPage,
    search,
    data,
    isLoading,
    columns,
    handlePerPageChange,
    handleSearchChange,
  };
}
