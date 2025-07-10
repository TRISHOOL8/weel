"use client";

import type { Profile, ButtonConfig } from "@/lib/types";
import { InteractiveButton } from "./interactive-button";

interface ButtonGridProps {
  profile: Profile | null;
  onButtonClick: (index: number, config: ButtonConfig | null) => void;
}

export function ButtonGrid({ profile, onButtonClick }: ButtonGridProps) {
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Select or create a profile to see the button grid.
      </div>
    );
  }

  const { gridSize, buttons } = profile;

  return (
    <div
      className="grid gap-3 p-4 bg-background rounded-lg shadow-inner"
      style={{
        gridTemplateColumns: `repeat(${gridSize.cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${gridSize.rows}, minmax(0, 1fr))`,
        aspectRatio: `${gridSize.cols} / ${gridSize.rows}`,
        maxWidth: `${gridSize.cols * 120}px` // Max width to keep buttons reasonable size
      }}
      data-ai-hint="control panel"
    >
      {Array.from({ length: gridSize.rows * gridSize.cols }).map((_, index) => {
        const buttonConfig = buttons[index] || null;
        return (
          <InteractiveButton
            key={index}
            config={buttonConfig}
            onClick={() => onButtonClick(index, buttonConfig)}
          />
        );
      })}
    </div>
  );
}
