"use client";

import type { ButtonConfig } from "@/lib/types";
import { getLucideIcon } from "@/lib/icons";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PlusSquare } from "lucide-react";

interface InteractiveButtonProps {
  config: ButtonConfig | null;
  onClick: () => void;
  className?: string;
}

export function InteractiveButton({ config, onClick, className }: InteractiveButtonProps) {
  const IconComponent = config?.iconName ? getLucideIcon(config.iconName) : null;

  // Style for custom colors
  const buttonStyle: React.CSSProperties = {
    backgroundColor: config?.backgroundColor,
    color: config?.textColor,
  };

  return (
    <Card
      className={cn(
        "aspect-square flex flex-col items-center justify-center p-2 text-center shadow-lg hover:shadow-primary/50 transition-all duration-150 ease-in-out cursor-pointer transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        config ? 'bg-card' : 'bg-muted/20 border-dashed hover:border-primary',
        className
      )}
      onClick={onClick}
      style={buttonStyle}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      data-ai-hint="button interface"
    >
      <CardContent className="flex flex-col items-center justify-center p-1 w-full h-full">
        {config ? (
          <>
            {IconComponent && <IconComponent className="w-1/2 h-1/2 mb-1 text-foreground" style={{ color: config.textColor }} />}
            {config.label && (
              <span className="text-xs font-medium break-words line-clamp-2 text-foreground" style={{ color: config.textColor }}>
                {config.label}
              </span>
            )}
            {!IconComponent && !config.label && <span className="text-xs text-muted-foreground">(Empty)</span>}
          </>
        ) : (
          <PlusSquare className="w-1/2 h-1/2 text-muted-foreground group-hover:text-primary" />
        )}
      </CardContent>
    </Card>
  );
}
