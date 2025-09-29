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
          console.log('No auth token found, user not authenticated');
          setUser(null);
          setLoading(false);
          return;
        }
        
        console.log('Found auth token, verifying...');

        // Check if token might be expired (Google ID tokens expire after 1 hour)
        // We'll still try to verify it, but this helps with debugging
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            const exp = payload.exp * 1000; // Convert to milliseconds
            const now = Date.now();
            
            if (now > exp) {
              console.log('Token appears to be expired, removing it');
              localStorage.removeItem('auth_token');
              setUser(null);
              setLoading(false);
              return;
            }
          }
        } catch (tokenParseError) {
          console.log('Could not parse token, will attempt verification anyway');
        }

        // Verify the token with our backend
        try {
          const response = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            console.log('User authenticated successfully:', userData);
            setUser(userData);
          } else {
            // Token is invalid or expired, remove it and trigger re-authentication
            console.log('Token verification failed, removing expired token');
            localStorage.removeItem('auth_token');
            setUser(null);
            // Don't set error here - let the ProtectedRoute handle re-authentication
          }
        } catch (verifyError) {
          console.error('Token verification error:', verifyError);
          localStorage.removeItem('auth_token');
          setUser(null);
          // Don't set error here - let the ProtectedRoute handle re-authentication
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
  if (!user?.email) {
    console.log('isTeacher: No user or email');
    return false;
  }
  const isTeacherResult = user.email.toLowerCase() === 'msraasch27@gmail.com';
  console.log('isTeacher check:', { userEmail: user.email, lowercased: user.email.toLowerCase(), expected: 'msraasch27@gmail.com', result: isTeacherResult });
  return isTeacherResult;
}

export function canAccessStudentPage(user: User | null, studentEmail: string): boolean {
  return user?.email === studentEmail.toLowerCase();
}
