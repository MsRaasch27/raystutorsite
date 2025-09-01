"use client";

import { useState, useCallback } from "react";

type Props = {
  ctaText: string;
  className?: string;
  variant?: "primary" | "secondary";
};

// Google OAuth config - you'll need to set these up in Google Cloud Console
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '';

export default function FreeTrialButton({ ctaText, className = "", variant = "primary" }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (!GOOGLE_CLIENT_ID) {
      console.error("Google OAuth not configured");
      // Fallback to direct form
      window.open("https://forms.gle/kMfysT3gYQ1PsqLQ8", "_blank", "noopener,noreferrer");
      return;
    }

    try {
      setIsLoading(true);
      
      // Build Google OAuth URL
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: GOOGLE_REDIRECT_URI,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'consent'
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      
      // Store the intended destination
      sessionStorage.setItem('freeTrialRedirect', 'https://forms.gle/kMfysT3gYQ1PsqLQ8');
      
      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (err) {
      console.error("OAuth error", err);
      // Fallback to direct form
      window.open("https://forms.gle/kMfysT3gYQ1PsqLQ8", "_blank", "noopener,noreferrer");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const baseStyles =
    variant === "primary"
      ? "bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block text-center"
      : "border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-block text-center";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${baseStyles} ${className}`}
      disabled={isLoading}
    >
      {isLoading ? "Connecting..." : ctaText}
    </button>
  );
}


