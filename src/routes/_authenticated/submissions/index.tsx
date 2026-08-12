import { createFileRoute } from '@tanstack/react-router';
import { DataTable } from '@/components/data-table/data-table';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { useSubmissionsPage } from './useSubmissionsPage';

export const Route = createFileRoute('/_authenticated/submissions/')({
  component: SubmissionsPage,
});

function SubmissionsPage() {
  const { page, setPage, perPage, data, isLoading, columns, handlePerPageChange } =
    useSubmissionsPage();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Submissions</h2>
        <p className="text-muted-foreground">View all filled form submissions</p>
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
