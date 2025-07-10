
"use client";

import type { Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Lightbulb, UserCircle, Wifi, WifiOff, Edit3 } from "lucide-react"; 
import { useState } from "react";
import { AccountDialog } from "@/components/auth/account-dialog";
import type { User } from "firebase/auth"; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { WeelLogo } from "@/components/icons/weel-logo";


interface AppHeaderProps {
  profiles: Profile[];
  currentProfileId: string | null;
  onProfileChange: (profileId: string) => void;
  onCreateProfile: () => void;
  onEditProfilesClick: () => void; // Changed from onDeleteCurrentProfile
  onSmartActionsClick: () => void;
  currentUser: User | null; 
  authLoading: boolean; 
  esp32Status: { connected: boolean; port?: string; error?: string };
  isAppAwareSwitchingEnabled?: boolean;
  onToggleAppAwareSwitching?: (enabled: boolean) => void;
}

export function AppHeader({
  profiles,
  currentProfileId,
  onProfileChange,
  onCreateProfile,
  onEditProfilesClick, // Changed
  onSmartActionsClick,
  currentUser, 
  authLoading, 
  esp32Status,
  isAppAwareSwitchingEnabled = false,
  onToggleAppAwareSwitching,
}: AppHeaderProps) {
  const currentProfile = profiles.find(p => p.id === currentProfileId);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);

  const espStatusTooltipText = esp32Status.connected
    ? `Connected to Weel on ${esp32Status.port}`
    : esp32Status.error
      ? `Weel connection error: ${esp32Status.error}`
      : "Weel device not connected. Retrying...";

  return (
    <>
    <TooltipProvider>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2">
            <WeelLogo className="h-8 w-8" /> 
            <h1 className="text-2xl font-bold text-foreground">Weel</h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full text-foreground hover:bg-accent/10">
                  {esp32Status.connected ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-red-500" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{espStatusTooltipText}</p>
              </TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-auto">
                  {currentProfile ? currentProfile.name : "Select Profile"}
                  <ChevronDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Profiles</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {profiles.map((profile) => (
                  <DropdownMenuItem key={profile.id} onClick={() => onProfileChange(profile.id)}>
                    {profile.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onCreateProfile}>
                  Create New Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onEditProfilesClick}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit Profiles
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" onClick={onSmartActionsClick} className="text-foreground hover:bg-accent/10 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-auto">
              <Lightbulb className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 text-accent" />
              AI Assistant
            </Button>

            {/* App-Aware Switching Toggle */}
            {onToggleAppAwareSwitching && (
              <div className="flex items-center space-x-2 px-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="app-aware-switching"
                        checked={isAppAwareSwitchingEnabled}
                        onCheckedChange={onToggleAppAwareSwitching}
                        className="data-[state=checked]:bg-accent"
                      />
                      <Label 
                        htmlFor="app-aware-switching" 
                        className="text-xs text-muted-foreground cursor-pointer"
                      >
                        App-Aware
                      </Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {isAppAwareSwitchingEnabled 
                        ? "App-aware switching enabled - pages can be pinned to prevent automatic switching"
                        : "Enable app-aware switching to automatically change pages based on active applications"
                      }
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setIsAccountDialogOpen(true)}
              disabled={authLoading} 
              aria-label={currentUser ? "User Account" : "Account Info"} 
            >
              {authLoading ? ( 
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground border-t-transparent"></div>
              ) : currentUser ? ( 
                <UserCircle className="h-6 w-6" />
              ) : (
                <UserCircle className="h-6 w-6" /> 
              )}
            </Button>
          </div>
        </div>
      </header>
      </TooltipProvider>
      <AccountDialog
        isOpen={isAccountDialogOpen}
        onOpenChange={setIsAccountDialogOpen}
        currentUser={currentUser} 
      />
    </>
  );
}
