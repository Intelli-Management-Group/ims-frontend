import { createElement } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { User } from '@/types/api';
import {
  NameCell,
  DepartmentsCell,
  TeamsCell,
  RoleCell,
  StatusCell,
  ActionsCell,
} from './user-cells';

interface GetColumnsOptions {
  isAdmin: boolean;
  onEdit: (user: User) => void;
}

export function getUserColumns({ isAdmin, onEdit }: GetColumnsOptions): ColumnDef<User>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => createElement(NameCell, { name: row.getValue('name') }),
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'departments',
      header: 'Departments',
      cell: ({ row }) =>
        createElement(DepartmentsCell, { departments: row.original.departments }),
    },
    {
      accessorKey: 'teams',
      header: 'Teams',
      cell: ({ row }) => createElement(TeamsCell, { teams: row.original.teams }),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => createElement(RoleCell, { role: row.original.role }),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) =>
        createElement(StatusCell, { isActive: !!row.getValue('is_active') }),
    },
    {
      id: 'actions',
      header: 'Edit',
      cell: ({ row }) =>
        createElement(ActionsCell, { user: row.original, isAdmin, onEdit }),
    },
  ];
}
