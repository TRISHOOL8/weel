
// src/components/dashboard/actions-sidebar.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { predefinedActionCategories } from "./predefined-actions";
import { DraggableActionItem } from "./draggable-action-item";
import { getLucideIcon } from "@/lib/icons";
import { Search, List } from "lucide-react";

export function ActionsSidebar() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCategories = predefinedActionCategories
    .map(category => ({
      ...category,
      actions: category.actions.filter(action =>
        action.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter(category => category.actions.length > 0);

  return (
    <aside 
      className="w-72 bg-card border-r border-border flex flex-col h-full overflow-y-hidden"
      data-ai-hint="actions sidebar"
    >
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search actions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-full h-9"
          />
           {/* Placeholder for List icon if needed later for different views */}
           {/* <List className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" /> */}
        </div>
      </div>
      <ScrollArea className="flex-grow min-h-0"> {/* Added min-h-0 here */}
        <Accordion type="multiple" defaultValue={predefinedActionCategories.map(c => c.id)} className="p-2">
          {filteredCategories.map((category) => {
            const CategoryIcon = getLucideIcon(category.iconName);
            return (
              <AccordionItem value={category.id} key={category.id} className="border-b-0 mb-1">
                <AccordionTrigger className="hover:no-underline hover:bg-accent/10 rounded-md px-2 py-1.5 text-sm font-medium text-foreground [&[data-state=open]>svg]:text-primary">
                  <div className="flex items-center space-x-2">
                    {CategoryIcon && <CategoryIcon className="w-4 h-4" />}
                    <span>{category.name}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pl-2 pr-1 pb-0">
                  <div className="space-y-0.5">
                    {category.actions.map((actionItem) => (
                      <DraggableActionItem
                        key={actionItem.id}
                        actionItem={actionItem}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        {filteredCategories.length === 0 && searchTerm && (
          <p className="p-4 text-sm text-muted-foreground text-center">No actions found for "{searchTerm}".</p>
        )}
      </ScrollArea>
    </aside>
  );
}
