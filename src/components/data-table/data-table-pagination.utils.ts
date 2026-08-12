import type React from 'react';

export const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50];

export interface EntryRange {
  from: number;
  to: number;
}

/**
 * Computes the "showing X to Y of Z" entry range for the current page.
 */
export function getEntryRange(currentPage: number, perPage: number, total: number): EntryRange {
  const from = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, total);
  return { from, to };
}

/**
 * Computes which page numbers should be visible in the pagination control,
 * showing up to `maxVisible` pages centered around the current page (with
 * edge clamping near the first/last pages). Returns null entries filtered out.
 */
export function getVisiblePageNumbers(
  currentPage: number,
  lastPage: number,
  maxVisible = 5
): number[] {
  const windowSize = Math.min(maxVisible, lastPage);

  return Array.from({ length: windowSize }, (_, i) => {
    let pageNum: number;
    if (currentPage <= 3) pageNum = i + 1;
    else if (currentPage >= lastPage - 2) pageNum = lastPage - 4 + i;
    else pageNum = currentPage - 2 + i;
    return pageNum;
  }).filter((pageNum) => pageNum >= 1 && pageNum <= lastPage);
}

/**
 * Click handler for the "previous page" control. No-ops if already on the first page.
 */
export function createPreviousPageHandler(
  currentPage: number,
  onPageChange: (page: number) => void
): (e: React.MouseEvent) => void {
  return (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentPage > 1) onPageChange(currentPage - 1);
  };
}

/**
 * Click handler for the "next page" control. No-ops if already on the last page.
 */
export function createNextPageHandler(
  currentPage: number,
  lastPage: number,
  onPageChange: (page: number) => void
): (e: React.MouseEvent) => void {
  return (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentPage < lastPage) onPageChange(currentPage + 1);
  };
}

/**
 * Click handler for a specific page number link.
 */
export function createPageNumberHandler(
  pageNum: number,
  onPageChange: (page: number) => void
): (e: React.MouseEvent) => void {
  return (e: React.MouseEvent) => {
    e.preventDefault();
    onPageChange(pageNum);
  };
}
