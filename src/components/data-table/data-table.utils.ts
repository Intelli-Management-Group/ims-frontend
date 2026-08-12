import type { ColumnDef } from '@tanstack/react-table';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';

export interface UseDataTableOptions<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

/**
 * Sets up the react-table instance for DataTable.
 * Kept separate so table configuration (row models, plugins, etc.)
 * can grow without touching the render layer.
 */
export function useDataTable<TData, TValue>({
  columns,
  data,
}: UseDataTableOptions<TData, TValue>) {
  return useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
}

/**
 * Returns an array of placeholder row indices to render as loading skeletons.
 */
export function getSkeletonRowIndices(rowCount = 5): number[] {
  return Array.from({ length: rowCount }, (_, i) => i);
}
