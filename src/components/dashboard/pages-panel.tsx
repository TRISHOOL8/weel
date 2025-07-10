"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Plus, 
  Pin, 
  X
} from "lucide-react";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PagesPanelProps {
  currentProfile: Profile | null;
  onPageChange: (pageNumber: number) => void;
  onAddPage: () => void;
  onDeletePage: (pageNumber: number) => void;
  onPinPage: (pageNumber: number, pinned: boolean) => void;
  className?: string;
}

export function PagesPanel({
  currentProfile,
  onPageChange,
  onAddPage,
  onDeletePage,
  onPinPage,
  className
}: PagesPanelProps) {
  if (!currentProfile) {
    return null;
  }

  const currentPage = currentProfile.currentPage || 1;
  const totalPages = currentProfile.totalPages || 2; // Default to 2 pages
  const pinnedPages = currentProfile.pinnedPages || [1];
  const maxPages = 10;

  const handlePageClick = (pageNumber: number) => {
    if (pageNumber !== currentPage) {
      onPageChange(pageNumber);
    }
  };

  const canDeletePage = (pageNumber: number) => {
    return totalPages > 2 && !pinnedPages.includes(pageNumber);
  };

  const handleDeletePage = (e: React.MouseEvent, pageNumber: number) => {
    e.stopPropagation();
    if (canDeletePage(pageNumber)) {
      onDeletePage(pageNumber);
    }
  };

  return (
    <TooltipProvider>
      <div className={cn("flex items-center justify-center gap-2 py-4", className)}>
        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, maxPages) }, (_, i) => {
            const pageNumber = i + 1;
            const isCurrentPage = pageNumber === currentPage;
            const isPinned = pinnedPages.includes(pageNumber);
            
            return (
              <div key={pageNumber} className="relative group">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isCurrentPage ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "h-8 w-8 p-0 rounded-full text-sm font-medium relative",
                        isCurrentPage 
                          ? "bg-primary text-primary-foreground shadow-md" 
                          : "hover:bg-accent text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => handlePageClick(pageNumber)}
                    >
                      {pageNumber}
                      {isPinned && (
                        <Pin className="absolute -top-1 -right-1 h-2.5 w-2.5 text-accent" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Page {pageNumber}{isPinned ? " (Pinned)" : ""}</p>
                  </TooltipContent>
                </Tooltip>

                {/* Delete button for non-pinned pages */}
                {canDeletePage(pageNumber) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 rounded-full bg-destructive hover:bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDeletePage(e, pageNumber)}
                  >
                    <X className="h-2.5 w-2.5" />
                  </Button>
                )}
              </div>
            );
          })}

          {/* Add Page Button */}
          {totalPages < maxPages && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 text-muted-foreground hover:text-primary"
                  onClick={onAddPage}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add New Page</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}