"use client";

import { useEffect, useState } from 'react';

export interface User {
  email: string;
  name: string;
  picture?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => void;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if we have a stored token
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Verify the token with our backend
        try {
          const response = await fetch('https://us-central1-raystutorsite.cloudfunctions.net/api/oauth/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('auth_token');
            setUser(null);
          }
        } catch (verifyError) {
          console.error('Token verification error:', verifyError);
          localStorage.removeItem('auth_token');
          setUser(null);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError('Failed to initialize authentication');
        localStorage.removeItem('auth_token');
        setUser(null);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Build Google OAuth URL
      const params = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        redirect_uri: `${window.location.origin}/auth/callback`,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'consent'
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      
      // Store the intended destination
      sessionStorage.setItem('authRedirect', window.location.pathname);
      
      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Failed to initiate sign in');
    } finally {
      setLoading(false);
    }
  };

  const signOut = (): void => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setError(null);
  };

  return {
    user,
    loading,
    error,
    signIn,
    signOut,
  };
}

export function isTeacher(user: User | null): boolean {
  return user?.email === 'msraasch27@gmail.com';
}

export function canAccessStudentPage(user: User | null, studentEmail: string): boolean {
  return user?.email === studentEmail.toLowerCase();
}
