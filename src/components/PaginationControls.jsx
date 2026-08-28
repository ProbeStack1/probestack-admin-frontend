import { useEffect, useMemo, useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";

export function usePagination(items, pageSize = 10) {
  const [page, setPage] = useState(1);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pageSignature = useMemo(
    () => items.map((item) => item?.id ?? item).join("|"),
    [items]
  );
  const safePage = Math.min(Math.max(page, 1), totalPages);

  useEffect(() => {
    setPage(1);
  }, [pageSignature, pageSize]);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  return { page: safePage, setPage, totalItems, totalPages, pageItems, pageSize };
}

export default function PaginationControls({ page, totalPages, totalItems, pageSize, onPageChange }) {
  if (totalItems <= pageSize) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((pageNumber) => (
      pageNumber === 1 ||
      pageNumber === totalPages ||
      Math.abs(pageNumber - page) <= 1
    ));

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalItems)} of {totalItems}
      </p>
      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(event) => {
                event.preventDefault();
                onPageChange(Math.max(1, page - 1));
              }}
              className={page === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          {pages.map((pageNumber, index) => {
            const previousPage = pages[index - 1];
            return (
              <PaginationItem key={pageNumber}>
                {previousPage && pageNumber - previousPage > 1 && (
                  <span className="px-2 text-sm text-muted-foreground">...</span>
                )}
                <PaginationLink
                  href="#"
                  isActive={pageNumber === page}
                  onClick={(event) => {
                    event.preventDefault();
                    onPageChange(pageNumber);
                  }}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(event) => {
                event.preventDefault();
                onPageChange(Math.min(totalPages, page + 1));
              }}
              className={page === totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
