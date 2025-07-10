
"use client";

import type { ButtonConfig } from "@/lib/types";
import { getLucideIcon } from "@/lib/icons";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface InteractiveButtonDndProps {
  id: string | number; 
  config: ButtonConfig | null;
  onClick: () => void;
  className?: string;
  isOverlay?: boolean; // To indicate if this instance is rendered in DragOverlay
}

export function InteractiveButtonDnd({ id, config, onClick, className, isOverlay = false }: InteractiveButtonDndProps) {
  const IconComponent = config?.iconName ? getLucideIcon(config.iconName) : null;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id, disabled: isOverlay }); 

  const dndStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isOverlay ? 0.3 : 1, // Make original more transparent while dragging
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: config?.backgroundColor,
    color: config?.textColor,
  };

  const shouldGlow = isOver && !isDragging && !isOverlay;

  return (
    <div 
      ref={!isOverlay ? setNodeRef : null} 
      style={!isOverlay ? dndStyle : undefined} 
      {...(!isOverlay ? attributes : {})}
      {...(!isOverlay ? listeners : {})}
      className={cn(
        isOverlay ? className : (config ? 'cursor-grab' : ''), // Only grab if there's a config
        isDragging && 'cursor-grabbing'
      )}
    >
      <Card
        style={cardStyle}
        className={cn(
          "aspect-square flex flex-col items-center justify-center p-2 text-center shadow-lg transition-all duration-150 ease-in-out",
          !config?.backgroundColor && (config ? 'bg-card' : 'bg-muted/20 border-dashed'),
          !isOverlay && config && 'hover:shadow-primary/50 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          shouldGlow && "ring-2 ring-accent ring-offset-background ring-offset-2",
          !isOverlay && className,
          config && 'cursor-pointer' // Add cursor pointer only if it is clickable
        )}
        onClick={onClick} 
        tabIndex={!isOverlay && config ? 0 : -1} 
        onKeyDown={!isOverlay && config ? (e) => e.key === 'Enter' && onClick() : undefined}
        data-ai-hint="button interface drag"
      >
        <CardContent className="flex flex-col items-center justify-center p-1 w-full h-full">
          {config ? (
            <>
              {IconComponent && <IconComponent className={cn("w-1/2 h-1/2 mb-1", !config.textColor && "text-foreground")} style={{ color: config.textColor }} />}
              {config.label && (
                <span className={cn("text-xs font-medium break-words line-clamp-2", !config.textColor && "text-foreground")} style={{ color: config.textColor }}>
                  {config.label}
                </span>
              )}
              {!IconComponent && !config.label && <span className="text-xs text-muted-foreground">(Empty)</span>}
            </>
          ) : (
            // Render nothing for empty slots, making it a passive dropzone
            null
          )}
        </CardContent>
      </Card>
    </div>
  );
}
