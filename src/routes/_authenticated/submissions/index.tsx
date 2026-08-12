import { createFileRoute } from '@tanstack/react-router';
import { DataTable } from '@/components/data-table/data-table';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSubmissionsPage } from './useSubmissionsPage';

export const Route = createFileRoute('/_authenticated/submissions/')({
  component: SubmissionsPage,
});

function SubmissionsPage() {
  const {
    page,
    setPage,
    perPage,
    data,
    isLoading,
    columns,
    handlePerPageChange,
    priorityFilter,
    setPriorityFilter,
    priorityOptions,
  } = useSubmissionsPage();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Submissions</h2>
        <p className="text-muted-foreground">View all filled form submissions</p>
      </div>

      <div className="flex items-center">
        <div className="ml-auto">
          <Select
            value={priorityFilter}
            onValueChange={setPriorityFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="All priorities" />
            </SelectTrigger>

            <SelectContent align="end">
              {priorityOptions.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
