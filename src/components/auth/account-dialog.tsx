
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// Firebase-specific imports like Input, Label for form are kept for structure,
// but auth logic is removed.
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import type { User } from "firebase/auth"; // Type can remain for prop consistency
// import { auth } from "@/lib/firebase"; // Firebase removed
import { useToast } from "@/hooks/use-toast";

interface AccountDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  currentUser: User | null; // This will always be null now
}

export function AccountDialog({ isOpen, onOpenChange, currentUser }: AccountDialogProps) {
  // const [isSignUp, setIsSignUp] = useState(false);
  // const [email, setEmail] = useState("");
  // const [password, setPassword] = useState("");
  // const [confirmPassword, setConfirmPassword] = useState("");
  const [error] = useState<string | null>(null); // Error state kept, but not used for Firebase errors
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // setError(null);
      // setEmail("");
      // setPassword("");
      // setConfirmPassword("");
    }
  }, [isOpen]);

  const handleAuthError = (errMessage: string) => {
    setLoading(false);
    // setError(errMessage); // Could be used for generic errors if any
    console.error("Auth Operation Error (Firebase Removed):", errMessage);
  };

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    handleAuthError("Sign-in functionality is disabled (Firebase removed).");
    toast({ title: "Feature Disabled", description: "User sign-in is not available in this version.", variant: "default" });
  };

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    handleAuthError("Sign-up functionality is disabled (Firebase removed).");
    toast({ title: "Feature Disabled", description: "User sign-up is not available in this version.", variant: "default" });
  };

  const handleSignOut = async () => {
    handleAuthError("Sign-out functionality is disabled (Firebase removed).");
    toast({ title: "Feature Disabled", description: "User sign-out is not available in this version.", variant: "default" });
    onOpenChange(false);
  };

  // const toggleFormMode = () => {
  //   setIsSignUp(!isSignUp);
  //   setError(null); 
  // }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Account
          </DialogTitle>
          <DialogDescription>
            User accounts are not enabled in this version.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive text-center py-2">{error}</p>}

        {currentUser ? ( // This block will effectively not be shown as currentUser is always null
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Signed in as: <span className="font-medium text-foreground">{currentUser.email}</span>
            </p>
            <Button onClick={handleSignOut} variant="outline" className="w-full" disabled={loading}>
              {loading ? "Signing Out..." : "Sign Out (Disabled)"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              This application runs locally. User accounts and cloud sync are not available.
            </p>
            {/* Example of how forms would look, but non-functional */}
            {/* 
            <form onSubmit={handleSignIn} className="space-y-4 py-2">
              <div>
                <Label htmlFor="signin-email">Email</Label>
                <Input id="signin-email" type="email" placeholder="you@example.com" required 
                  value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"/>
              </div>
              <div>
                <Label htmlFor="signin-password">Password</Label>
                <Input id="signin-password" type="password" placeholder="••••••••" required 
                  value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"/>
              </div>
              <Button type="submit" className="w-full" disabled={true}>
                Sign In (Disabled)
              </Button>
            </form> 
            */}
          </div>
        )}

        <DialogFooter className="sm:justify-start pt-2">
          {/* 
          {!currentUser && (
            <Button variant="link" onClick={toggleFormMode} className="p-0 h-auto text-sm" disabled={loading}>
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Create one"}
            </Button>
          )}
          */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
