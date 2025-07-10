// src/components/dashboard/edit-profiles-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import type { Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Save, Edit2 } from "lucide-react";

interface EditProfilesDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  profiles: Profile[];
  onRenameProfile: (profileId: string, newName: string) => void;
  onDeleteProfile: (profileId: string) => void;
  canDeleteProfile: (profileId: string) => boolean;
}

export function EditProfilesDialog({
  isOpen,
  onOpenChange,
  profiles,
  onRenameProfile,
  onDeleteProfile,
  canDeleteProfile,
}: EditProfilesDialogProps) {
  const [editedNames, setEditedNames] = useState<Record<string, string>>({});
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const initialNames: Record<string, string> = {};
      profiles.forEach(p => {
        initialNames[p.id] = p.name;
      });
      setEditedNames(initialNames);
      setEditingProfileId(null);
    }
  }, [isOpen, profiles]);

  const handleNameChange = (profileId: string, newName: string) => {
    setEditedNames(prev => ({ ...prev, [profileId]: newName }));
  };

  const handleSaveName = (profileId: string) => {
    const newName = editedNames[profileId]?.trim();
    if (newName && newName !== profiles.find(p => p.id === profileId)?.name) {
      onRenameProfile(profileId, newName);
      toast({ title: "Profile Renamed", description: `Profile updated to "${newName}".` });
    }
    setEditingProfileId(null);
  };

  const handleDelete = (profileId: string) => {
    if (!canDeleteProfile(profileId)) {
        toast({
            title: "Cannot Delete",
            description: "This profile cannot be deleted (e.g., it's the last one).",
            variant: "destructive",
        });
        return;
    }
    onDeleteProfile(profileId);
  };
  
  const toggleEditMode = (profileId: string) => {
    if (editingProfileId === profileId) {
        // If currently editing this one, try to save
        handleSaveName(profileId);
    } else {
        // Reset name to original if switching to edit another or canceling previous edit
        const originalNameEditing = profiles.find(p => p.id === editingProfileId)?.name;
        if (editingProfileId && originalNameEditing) {
            setEditedNames(prev => ({ ...prev, [editingProfileId]: originalNameEditing }));
        }
        // Set current name for new editing target
        const originalNameTarget = profiles.find(p => p.id === profileId)?.name;
         if (originalNameTarget) {
            setEditedNames(prev => ({ ...prev, [profileId]: originalNameTarget }));
        }
        setEditingProfileId(profileId);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) { // If closing, ensure any pending edits are reset
        const originalName = profiles.find(p => p.id === editingProfileId)?.name;
        if (editingProfileId && originalName) {
            setEditedNames(prev => ({ ...prev, [editingProfileId]: originalName }));
        }
        setEditingProfileId(null);
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-lg w-[90vw] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Profiles</DialogTitle>
          <DialogDescription>
            Manage your Weel profiles. Rename or delete them as needed.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow my-4 border rounded-md">
          <div className="p-4 space-y-3">
            {profiles.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No profiles to edit.</p>
            )}
            {profiles.map((profile) => (
              <div key={profile.id} className="flex items-center justify-between p-3 bg-card rounded-md shadow-sm">
                {editingProfileId === profile.id ? (
                  <Input
                    type="text"
                    value={editedNames[profile.id] || ""}
                    onChange={(e) => handleNameChange(profile.id, e.target.value)}
                    onBlur={() => { /* handleSaveName(profile.id) */ }} // Saving on blur might be too aggressive, save with button or Enter
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveName(profile.id);}}}
                    className="mr-2 h-9 flex-grow"
                    autoFocus
                  />
                ) : (
                  <span className="font-medium truncate mr-2 flex-grow py-1.5 px-0.5" title={profile.name}>{profile.name}</span>
                )}
                
                <div className="flex items-center space-x-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleEditMode(profile.id)}
                    className="h-8 w-8"
                    aria-label={editingProfileId === profile.id ? "Save name" : "Edit name"}
                  >
                    {editingProfileId === profile.id ? <Save className="h-4 w-4 text-primary" /> : <Edit2 className="h-4 w-4" />}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                        disabled={!canDeleteProfile(profile.id)}
                        aria-label="Delete profile"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the profile
                          "{profile.name}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(profile.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
