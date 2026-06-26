import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { Pencil } from 'lucide-react';
import type { User } from '@/types/api';

interface GetColumnsOptions {
  isAdmin: boolean;
  onEdit: (user: User) => void;
}

export function getUserColumns({ isAdmin, onEdit }: GetColumnsOptions): ColumnDef<User>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'departments',
      header: 'Departments',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.departments?.map((dept) => (
            <Badge key={dept.id} variant="secondary" className="text-[10px]">
              {dept.name}
            </Badge>
          )) ?? <span className="text-muted-foreground">-</span>}
          {row.original.departments?.length === 0 && (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'teams',
      header: 'Teams',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.teams?.map((team) => (
            <Badge key={team.id} variant="outline" className="text-[10px]">
              {team.name}
            </Badge>
          )) ?? <span className="text-muted-foreground">-</span>}
          {row.original.teams?.length === 0 && (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) =>
        row.original.role ? (
          <Badge variant="outline" className="text-[10px]">
            {row.original.role.name}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => <StatusBadge isActive={!!row.getValue('is_active')} />,
    },
    {
      id: 'actions',
      header: 'Edit',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(row.original)}
          disabled={!isAdmin}
          aria-label={`Edit ${row.original.name}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];
}
