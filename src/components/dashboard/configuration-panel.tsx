"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useEffect, useState } from "react";
import { AppWindow } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet";
import type { ButtonConfig, ButtonActionType, InstalledApp } from "@/lib/types";
import { ALL_ACTION_TYPES } from "@/lib/types";
import { iconList, getLucideIcon, IconName } from "@/lib/icons";
import { ScrollArea } from "@/components/ui/scroll-area";

const NO_ICON_VALUE = "__NO_ICON_VALUE__"; 

const buttonFormSchema = z.object({
  label: z.string().max(30, "Label too long").optional(),
  iconName: z.string().optional(), 
  actionType: z.custom<ButtonActionType>((val) => ALL_ACTION_TYPES.includes(val as ButtonActionType)).default('none'),
  actionValue: z.string().optional(),
});

type ButtonFormData = z.infer<typeof buttonFormSchema>;

interface ConfigurationPanelProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  buttonConfig: ButtonConfig | null;
  buttonIndex: number | null;
  onSave: (index: number, config: ButtonConfig) => void;
  onDelete?: (index: number) => void; 
}

export function ConfigurationPanel({
  isOpen,
  onOpenChange,
  buttonConfig,
  buttonIndex,
  onSave,
  onDelete,
}: ConfigurationPanelProps) {
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const form = useForm<ButtonFormData>({
    resolver: zodResolver(buttonFormSchema),
    defaultValues: {
      label: "",
      iconName: NO_ICON_VALUE, 
      actionType: 'none',
      actionValue: "",
    },
  });

  const actionType = form.watch("actionType");

  useEffect(() => {
    if (actionType === 'system_open_app' && window.electronAPI?.getInstalledApps) {
      setInstalledApps([]); // Clear while loading
      window.electronAPI.getInstalledApps()
        .then(apps => {
          if (apps && apps.length > 0) {
            setInstalledApps(apps);
          }
        })
        .catch(console.error);
    }
  }, [actionType]);

  useEffect(() => {
    if (buttonConfig) {
      form.reset({
        label: buttonConfig.label || "",
        iconName: buttonConfig.iconName || NO_ICON_VALUE, 
        actionType: buttonConfig.action?.type || 'none',
        actionValue: buttonConfig.action?.value || "",
      });
    } else {
      form.reset({ 
        label: "",
        iconName: NO_ICON_VALUE, 
        actionType: 'none',
        actionValue: "",
      });
    }
  }, [buttonConfig, form]);

  const onSubmit = (data: ButtonFormData) => {
    if (buttonIndex === null) return;

    const newConfig: ButtonConfig = {
      id: buttonConfig?.id || `btn-${Date.now()}`, 
      label: data.label || "",
      iconName: data.iconName === NO_ICON_VALUE ? undefined : data.iconName as IconName,
      action: {
        type: data.actionType || 'none',
        value: data.actionValue || "",
      },
      backgroundColor: buttonConfig?.backgroundColor,
      textColor: buttonConfig?.textColor,
    };
    onSave(buttonIndex, newConfig);
    onOpenChange(false);
  };
  
  const handleDelete = () => {
    if (buttonIndex !== null && onDelete) {
      onDelete(buttonIndex);
      onOpenChange(false);
    }
  };

  const selectedIconFormValue = form.watch("iconName");
  const SelectedIcon = getLucideIcon(selectedIconFormValue === NO_ICON_VALUE ? undefined : selectedIconFormValue);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-[90vw] p-0 flex flex-col">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle>{buttonConfig ? "Edit Button" : "Configure Button"}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-grow">
          <div className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Launch Spotify" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="iconName"
                  render={({ field }) => ( 
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                       <div className="flex items-center gap-2">
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || NO_ICON_VALUE}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an icon" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={NO_ICON_VALUE}>No Icon</SelectItem>
                            {iconList.map((iconName) => (
                              <SelectItem key={iconName} value={iconName}>
                                {iconName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {SelectedIcon && <SelectedIcon className="h-8 w-8 p-1 border rounded-md text-foreground" />}
                       </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="actionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Action Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || 'none'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select action type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ALL_ACTION_TYPES.map(type => (
                            <SelectItem key={type} value={type}>{type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {actionType !== 'none' && (
                  <FormField
                    control={form.control}
                    name="actionValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {actionType === 'system_open_app' ? 'Application' : 'Action Value'}
                        </FormLabel>
                        <FormControl>
                          {actionType === 'system_open_app' ? (
                            <Select
                              onValueChange={(value) => {
                                const selectedApp = installedApps.find(app => app.path === value);
                                if (selectedApp && !form.getValues("label")) {
                                  form.setValue("label", selectedApp.name);
                                }
                                if (form.getValues("iconName") === NO_ICON_VALUE) {
                                  form.setValue("iconName", "AppWindow");
                                }
                                field.onChange(value);
                              }}
                              value={field.value || ""}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select an application">
                                  {installedApps.find(app => app.path === field.value)?.name || field.value || "Select an application"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <ScrollArea className="h-72">
                                  {installedApps.length > 0 ? (
                                    installedApps.map((app) => (
                                      <SelectItem key={app.path} value={app.path}>
                                        <div className="flex items-center gap-3">
                                          {app.icon ? (
                                            <img 
                                              src={`file://${app.icon}`} 
                                              className="h-4 w-4 object-contain" 
                                              alt="" 
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                              }}
                                            />
                                          ) : (
                                            <AppWindow className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                          )}
                                          <span className="text-foreground">{app.name}</span>
                                        </div>
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                      {installedApps.length === 0 ? "Loading apps..." : "No applications found"}
                                    </div>
                                  )}
                                </ScrollArea>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input placeholder="e.g., https://google.com, Ctrl+C" {...field} />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </form>
            </Form>
          </div>
        </ScrollArea>
        <SheetFooter className="p-6 pt-0 mt-auto border-t">
          <div className="flex w-full justify-between">
            {buttonConfig && onDelete && (
              <Button variant="destructive" type="button" onClick={handleDelete}>
                Delete
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <SheetClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </SheetClose>
              <Button type="submit" onClick={form.handleSubmit(onSubmit)}>Save</Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
