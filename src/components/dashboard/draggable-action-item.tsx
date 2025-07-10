
// src/components/dashboard/draggable-action-item.tsx
"use client";

import { useDraggable } from "@dnd-kit/core";
import type { PredefinedActionItem } from "@/lib/types";
import { getLucideIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface DraggableActionItemProps {
  actionItem: PredefinedActionItem;
  isOverlay?: boolean; // To style the item when it's in DragOverlay
}

export function DraggableActionItem({ actionItem, isOverlay = false }: DraggableActionItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `predefined-${actionItem.id}`,
    data: {
      type: "PREDEFINED_ACTION",
      actionConfig: actionItem.defaultConfig,
      predefinedActionItem: actionItem, // Pass the full item for DragOverlay rendering
    },
    disabled: isOverlay, // The overlay instance itself should not be draggable
  });

  const IconComponent = getLucideIcon(actionItem.iconName);

  // If this is the original item and it's being dragged, hide it (DragOverlay will show a copy)
  if (isDragging && !isOverlay) {
    return null;
  }

  return (
    <div
      ref={!isOverlay ? setNodeRef : null} // Only setNodeRef for the original draggable item
      // Overlay is positioned by DragOverlay, not by transform here
      // Listeners and attributes are only for the original draggable item
      {...(!isOverlay ? listeners : {})}
      {...(!isOverlay ? attributes : {})}
      className={cn(
        "flex items-center p-2 space-x-3 rounded-md w-full", // Ensure full width for proper layout
        isOverlay
          ? "shadow-xl bg-accent/40 scale-105 opacity-90 cursor-grabbing ring-2 ring-primary" // Styles for the clone in DragOverlay
          : "hover:bg-accent/20 cursor-grab active:cursor-grabbing" // Styles for the original in the sidebar
      )}
      data-ai-hint="draggable action template"
    >
      {IconComponent && <IconComponent className="w-5 h-5 text-foreground/80 flex-shrink-0" />}
      <span className="text-sm text-foreground truncate">{actionItem.name}</span>
    </div>
  );
}
