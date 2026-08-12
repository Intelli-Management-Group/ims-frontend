import { createFileRoute } from '@tanstack/react-router';
import { DataTable } from '@/components/data-table/data-table';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { RoleDialog } from './components/roles-dialog';
import { useRolesPage } from './useRolesPage';

export const Route = createFileRoute('/_authenticated/roles/')({
  component: RolesPage,
});

function RolesPage() {
  const {
    isAdmin,
    page,
    setPage,
    perPage,
    search,
    setSearch,
    isDialogOpen,
    editingRole,
    data,
    isLoading,
    columns,
    isPending,
    handleAddNew,
    handleDialogOpenChange,
    handlePerPageChange,
    handleSubmit,
  } = useRolesPage();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Roles</h2>
          <p className="text-muted-foreground">Manage user roles</p>
        </div>
        <Button onClick={handleAddNew} disabled={!isAdmin}>
          <Plus className="mr-2 h-4 w-4" /> Add Role
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search roles..."
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

      {isDialogOpen && (
        <RoleDialog
          open={isDialogOpen}
          onOpenChange={handleDialogOpenChange}
          role={editingRole}
          isPending={isPending}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}