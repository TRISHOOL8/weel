"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Pin, 
  PinOff,
  MoreVertical,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Profile, ButtonConfig } from "@/lib/types";

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
  const [pinnedPages, setPinnedPages] = useState<Set<number>>(new Set([1])); // Page 1 is pinned by default

  if (!currentProfile) {
    return (
      <div className={`w-20 bg-card border-l border-border flex flex-col items-center py-4 ${className}`}>
        <div className="text-xs text-muted-foreground text-center">
          No Profile
        </div>
      </div>
    );
  }

  const currentPage = currentProfile.currentPage || 1;
  const totalPages = currentProfile.totalPages || 1;
  const maxPages = 10; // Limit to 10 pages for UI purposes

  const handlePageClick = (pageNumber: number) => {
    if (pageNumber !== currentPage) {
      onPageChange(pageNumber);
    }
  };

  const handlePinToggle = (pageNumber: number) => {
    const newPinnedPages = new Set(pinnedPages);
    if (pinnedPages.has(pageNumber)) {
      newPinnedPages.delete(pageNumber);
    } else {
      newPinnedPages.add(pageNumber);
    }
    setPinnedPages(newPinnedPages);
    onPinPage(pageNumber, !pinnedPages.has(pageNumber));
  };

  const canDeletePage = (pageNumber: number) => {
    return totalPages > 1 && !pinnedPages.has(pageNumber);
  };

  const handleDeletePage = (pageNumber: number) => {
    if (canDeletePage(pageNumber)) {
      onDeletePage(pageNumber);
    }
  };

  return (
    <TooltipProvider>
      <div className={`w-20 bg-card border-l border-border flex flex-col ${className}`}>
        {/* Header */}
        <div className="p-3 border-b border-border">
          <div className="text-xs font-medium text-center text-foreground mb-2">
            Pages
          </div>
          <Badge variant="outline" className="w-full justify-center text-xs">
            {currentPage}/{totalPages}
          </Badge>
        </div>

        {/* Navigation Controls */}
        <div className="p-2 border-b border-border">
          <div className="flex flex-col gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8"
                  onClick={() => handlePageClick(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Previous Page</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8"
                  onClick={() => handlePageClick(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Next Page</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Pages List */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {Array.from({ length: Math.min(totalPages, maxPages) }, (_, i) => {
              const pageNumber = i + 1;
              const isCurrentPage = pageNumber === currentPage;
              const isPinned = pinnedPages.has(pageNumber);
              
              return (
                <div key={pageNumber} className="relative group">
                  <Button
                    variant={isCurrentPage ? "default" : "ghost"}
                    size="sm"
                    className={`w-full h-10 flex flex-col items-center justify-center p-1 ${
                      isCurrentPage ? "ring-2 ring-primary ring-offset-1" : ""
                    }`}
                    onClick={() => handlePageClick(pageNumber)}
                  >
                    <div className="text-sm font-medium">{pageNumber}</div>
                    {isPinned && (
                      <Pin className="h-2 w-2 text-muted-foreground" />
                    )}
                  </Button>

                  {/* Page Options */}
                  <div className="absolute -right-1 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 bg-background border border-border shadow-sm"
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="left" align="start">
                        <DropdownMenuItem
                          onClick={() => handlePinToggle(pageNumber)}
                        >
                          {isPinned ? (
                            <>
                              <PinOff className="mr-2 h-4 w-4" />
                              Unpin Page
                            </>
                          ) : (
                            <>
                              <Pin className="mr-2 h-4 w-4" />
                              Pin Page
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeletePage(pageNumber)}
                          disabled={!canDeletePage(pageNumber)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Page
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}

            {/* Add Page Button */}
            {totalPages < maxPages && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-10 border-dashed"
                    onClick={onAddPage}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Add New Page</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-2 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            {totalPages} page{totalPages !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}