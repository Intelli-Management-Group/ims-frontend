import { createFileRoute } from '@tanstack/react-router';
import { DataTable } from '@/components/data-table/data-table';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { UserDialog } from './components/user-dialog';
import { useUsersPage } from './useUsersPage';

export const Route = createFileRoute('/_authenticated/users/')({
  component: UsersPage,
});

function UsersPage() {
  const {
    isAdmin,
    page,
    setPage,
    perPage,
    search,
    setSearch,
    isDialogOpen,
    setIsDialogOpen,
    editingUser,
    data,
    isLoading,
    departmentsData,
    teamsData,
    rolesData,
    columns,
    openCreateDialog,
    handlePerPageChange,
  } = useUsersPage();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">Manage user accounts</p>
        </div>
        <Button onClick={openCreateDialog} disabled={!isAdmin}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
      />

      {/* Pagination */}
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

      {/* Create / Edit dialog
          The `key` forces a full remount whenever the target user changes so
          that useForm always picks up the correct defaultValues. Without this,
          the form only reads defaultValues once on mount and ignores later
          prop changes, leaving all fields empty when switching to edit mode. */}
      <UserDialog
        key={editingUser?.id ?? 'create'}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingUser={editingUser}
        departments={departmentsData?.data ?? []}
        teams={teamsData?.data ?? []}
        roles={rolesData?.data ?? []}
      />
    </div>
  );
}
