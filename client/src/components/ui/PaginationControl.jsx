import React from 'react';
import { Button } from "./button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

const PaginationControl = ({ pagination, onPageChange, className = "" }) => {
  if (!pagination || pagination.pages <= 1) return null;

  const { total, pages, currentPage } = pagination;

  return (
    <div className={`flex items-center justify-between px-2 py-4 ${className}`}>
      <div className="flex-1 text-xs text-zinc-500 font-medium tracking-wider uppercase">
        Showing Page {currentPage} of {pages} ({total} entries)
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          className="h-8 w-8 p-0 border-zinc-200 hover:bg-zinc-50 hover:text-black disabled:opacity-30"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          <span className="sr-only">Go to first page</span>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 p-0 border-zinc-200 hover:bg-zinc-50 hover:text-black disabled:opacity-30"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <span className="sr-only">Go to previous page</span>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center justify-center text-xs font-bold w-12 h-8 bg-zinc-900 text-white rounded-md shadow-sm">
          {currentPage}
        </div>

        <Button
          variant="outline"
          className="h-8 w-8 p-0 border-zinc-200 hover:bg-zinc-50 hover:text-black disabled:opacity-30"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === pages}
        >
          <span className="sr-only">Go to next page</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 p-0 border-zinc-200 hover:bg-zinc-50 hover:text-black disabled:opacity-30"
          onClick={() => onPageChange(pages)}
          disabled={currentPage === pages}
        >
          <span className="sr-only">Go to last page</span>
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PaginationControl;
