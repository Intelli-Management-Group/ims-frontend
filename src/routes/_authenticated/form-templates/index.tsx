import { createFileRoute, Link } from '@tanstack/react-router';
import { DataTable } from '@/components/data-table/data-table';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useFormTemplatesPage } from './useFormTemplatesPage';

export const Route = createFileRoute('/_authenticated/form-templates/')({
  component: FormTemplatesPage,
});

function FormTemplatesPage() {
  const {
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
  } = useFormTemplatesPage();

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
