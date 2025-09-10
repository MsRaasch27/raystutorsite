"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function AuthCallbackContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string>("");
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }

        if (!code) {
          throw new Error("No authorization code received");
        }

        // Exchange code for user data
        const response = await fetch("https://us-central1-raystutorsite.cloudfunctions.net/api/oauth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          throw new Error("Failed to exchange code for user data");
        }

        const userData = await response.json();
        
        // Store the ID token for authentication
        if (userData.idToken) {
          localStorage.setItem('auth_token', userData.idToken);
        }

        setStatus("success");
        
        // Get the intended redirect destination
        const redirectUrl = sessionStorage.getItem('freeTrialRedirect') || 
                           sessionStorage.getItem('authRedirect') || 
                           'https://forms.gle/kMfysT3gYQ1PsqLQ8';
        sessionStorage.removeItem('freeTrialRedirect');
        sessionStorage.removeItem('authRedirect');
        
        // Redirect to the intended destination
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1000);

      } catch (err) {
        console.error("Auth callback error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
        setStatus("error");
      }
    };

    handleCallback();
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Setting up your account...</h1>
          <p className="text-gray-600">Please wait while we complete your sign-in.</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Authentication Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = "/"}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="text-green-500 text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Successfully signed in!</h1>
        <p className="text-gray-600">Redirecting you to the trial form...</p>
      </div>
    </div>
  );
}
