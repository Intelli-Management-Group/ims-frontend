import { createFileRoute } from '@tanstack/react-router';
import { DataTable } from '@/components/data-table/data-table';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { TeamDialog } from './components/team-dialog';
import { useTeamsPage } from './useTeamsPage';

export const Route = createFileRoute('/_authenticated/teams/')({
  component: TeamsPage,
});

function TeamsPage() {
  const {
    isAdmin,
    page,
    setPage,
    perPage,
    search,
    setSearch,
    isDialogOpen,
    editingTeam,
    data,
    isLoading,
    departments,
    columns,
    isPending,
    handleAddNew,
    handleDialogOpenChange,
    handlePerPageChange,
    handleSubmit,
  } = useTeamsPage();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Teams</h2>
          <p className="text-muted-foreground">Manage your organization's teams</p>
        </div>
        <Button onClick={handleAddNew} disabled={!isAdmin}>
          <Plus className="mr-2 h-4 w-4" /> Add Team
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teams..."
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
        <TeamDialog
          open={isDialogOpen}
          onOpenChange={handleDialogOpenChange}
          team={editingTeam}
          departments={departments}
          isPending={isPending}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
