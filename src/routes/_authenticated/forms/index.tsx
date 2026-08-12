import { createFileRoute } from '@tanstack/react-router';
import { DataTable } from '@/components/data-table/data-table';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useFormsPage } from './useFormsPage';

export const Route = createFileRoute('/_authenticated/forms/')({
  component: FormsPage,
});

function FormsPage() {
  const {
    page,
    setPage,
    perPage,
    search,
    data,
    isLoading,
    columns,
    handlePerPageChange,
    handleSearchChange,
  } = useFormsPage();

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
            onChange={(e) => handleSearchChange(e.target.value)}
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
