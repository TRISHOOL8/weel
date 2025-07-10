
"use client";

import type { User } from "firebase/auth"; // Keep type for compatibility if needed, but it won't be a Firebase User
import { useState, useEffect } from 'react';

// Firebase integration has been removed.
// This hook now simulates a "logged out" state.
export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false); // No longer loading from Firebase

  useEffect(() => {
    // Simulate immediate "not loading" and "no user" state
    setCurrentUser(null);
    setIsLoading(false);
  }, []);

  return { currentUser, isLoading };
}
