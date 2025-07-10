"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Plus, 
  Pin, 
  X,
  PinOff
} from "lucide-react";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PagesPanelProps {
  currentProfile: Profile | null;
  onPageChange: (pageNumber: number) => void;
  onAddPage: () => void;
  onDeletePage: (pageNumber: number) => void;
  onPinPage: (pageNumber: number, pinned: boolean) => void;
  isAppAwareSwitchingEnabled?: boolean; // New prop to control pin functionality
  className?: string;
}

export function PagesPanel({
  currentProfile,
  onPageChange,
  onAddPage,
  onDeletePage,
  onPinPage,
  isAppAwareSwitchingEnabled = false, // Default to false for now
  className
}: PagesPanelProps) {
  // Early return if no profile to prevent rendering errors
  if (!currentProfile) {
    return null;
  }

  // Safely get values with fallbacks
  const currentPage = currentProfile.currentPage || 1;
  const totalPages = Math.max(currentProfile.totalPages || 1, 1); // Ensure at least 1 page
  const pinnedPages = currentProfile.pinnedPages || [1];
  const isCurrentPagePinned = pinnedPages.includes(currentPage);
  const maxPages = 10;

  const handlePageClick = (pageNumber: number) => {
    if (pageNumber !== currentPage && pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber);
    }
  };

  const canDeletePage = (pageNumber: number) => {
    return totalPages > 1 && !pinnedPages.includes(pageNumber);
  };

  const handleDeletePage = (e: React.MouseEvent, pageNumber: number) => {
    e.stopPropagation();
    if (canDeletePage(pageNumber)) {
      onDeletePage(pageNumber);
    }
  };

  const handleGlobalPinToggle = () => {
    if (!isAppAwareSwitchingEnabled || !onPinPage) return;
    
    // Toggle pin state for current page
    onPinPage(currentPage, !isCurrentPagePinned);
  };

  return (
    <TooltipProvider>
      <div className={cn("flex items-center justify-center gap-2 py-4", className)}>
        {/* Global Pin Icon - Active when app-aware switching is enabled */}
        <div className="flex items-center gap-3 mr-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isCurrentPagePinned && isAppAwareSwitchingEnabled ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 rounded-full transition-all duration-200",
                  isAppAwareSwitchingEnabled 
                    ? "opacity-100 hover:scale-105" 
                    : "opacity-40 cursor-not-allowed",
                  isCurrentPagePinned && isAppAwareSwitchingEnabled && "shadow-md ring-2 ring-accent/20"
                )}
                disabled={!isAppAwareSwitchingEnabled}
                onClick={handleGlobalPinToggle}
              >
                {isCurrentPagePinned && isAppAwareSwitchingEnabled ? (
                  <Pin className="h-4 w-4 text-primary-foreground" />
                ) : (
                  <PinOff className={cn(
                    "h-4 w-4",
                    isAppAwareSwitchingEnabled ? "text-muted-foreground" : "text-muted-foreground/60"
                  )} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {!isAppAwareSwitchingEnabled 
                  ? "Pinning coming soon — lock a page during app-based switching"
                  : isCurrentPagePinned 
                    ? "Pinned: This page stays visible even when apps change"
                    : "Pin this page to prevent switching when apps change"
                }
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(Math.max(totalPages, 1), maxPages) }, (_, i) => {
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
                          : "hover:bg-accent text-muted-foreground hover:text-foreground",
                        isPinned && "ring-1 ring-accent/30"
                      )}
                      onClick={() => handlePageClick(pageNumber)}
                    >
                      {pageNumber}
                      {isPinned && (
                        <Pin className="absolute -top-1 -right-1 h-2.5 w-2.5 text-accent drop-shadow-sm" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Page {pageNumber}
                      {isPinned ? " (Pinned - won't switch with apps)" : ""}
                    </p>
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