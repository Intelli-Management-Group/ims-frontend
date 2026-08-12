import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PAGE_SIZE_OPTIONS,
  getEntryRange,
  getVisiblePageNumbers,
  createPreviousPageHandler,
  createNextPageHandler,
  createPageNumberHandler,
} from './data-table-pagination.utils';

interface DataTablePaginationProps {
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
  perPage: number;
  onPerPageChange: (perPage: number) => void;
  total: number;
}

export function DataTablePagination({
  currentPage,
  lastPage,
  onPageChange,
  perPage,
  onPerPageChange,
  total,
}: DataTablePaginationProps) {
  const { from, to } = getEntryRange(currentPage, perPage, total);
  const visiblePages = getVisiblePageNumbers(currentPage, lastPage);

  return (
    <div className="flex flex-col items-center justify-between gap-4 px-2 py-4 sm:flex-row">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Show</span>
        <Select
          value={perPage.toString()}
          onValueChange={(value) => onPerPageChange(Number(value))}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={perPage} />
          </SelectTrigger>
          <SelectContent side="top">
            {PAGE_SIZE_OPTIONS.map((pageSize) => (
              <SelectItem key={pageSize} value={pageSize.toString()}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>
          entries. Showing {from} to {to} of {total}
        </span>
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={createPreviousPageHandler(currentPage, onPageChange)}
              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>

          {visiblePages.map((pageNum) => (
            <PaginationItem key={pageNum}>
              <PaginationLink
                href="#"
                onClick={createPageNumberHandler(pageNum, onPageChange)}
                isActive={currentPage === pageNum}
                className="cursor-pointer"
              >
                {pageNum}
              </PaginationLink>
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={createNextPageHandler(currentPage, lastPage, onPageChange)}
              className={currentPage === lastPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}