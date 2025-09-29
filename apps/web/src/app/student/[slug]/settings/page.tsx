"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, User as AuthUser } from "@/lib/auth";

type User = {
  name?: string | null;
  email: string;
  natLang?: string | null;
  subscriptionStatus?: string | null;
  subscriptionPlan?: string | null;
};

type CustomIntervals = {
  easy: number; // days
  medium: number; // days
  hard: number; // days
};

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser, loading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customIntervals, setCustomIntervals] = useState<CustomIntervals>({
    easy: 7, // Default: 7 days
    medium: 3, // Default: 3 days
    hard: 1, // Default: 1 day
  });
  const [isSavingIntervals, setIsSavingIntervals] = useState(false);

  const studentSlug = params.slug as string;

  const saveCustomIntervals = async () => {
    if (!user) return;
    
    setIsSavingIntervals(true);
    try {
      const response = await fetch('/api/student/custom-intervals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.email,
          intervals: customIntervals,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save custom intervals');
      }

      // Show success message (you could add a toast notification here)
      console.log('Custom intervals saved successfully');
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error saving custom intervals:', error);
      // Fallback to localStorage
      try {
        localStorage.setItem(`customIntervals_${user.email}`, JSON.stringify(customIntervals));
        console.log('Custom intervals saved to localStorage as fallback');
        setError(null); // Clear error since fallback worked
      } catch (localStorageError) {
        console.error('Error saving to localStorage:', localStorageError);
        setError('Failed to save custom intervals. Please try again.');
      }
    } finally {
      setIsSavingIntervals(false);
    }
  };

  useEffect(() => {
    if (!loading && !authUser) {
      router.push("/");
      return;
    }

    // Decode the slug (it's the user's email)
    const decodedSlug = decodeURIComponent(studentSlug);
    
    if (authUser && authUser.email !== decodedSlug) {
      router.push("/");
      return;
    }

    if (authUser) {
      setUser({
        name: authUser.name,
        email: authUser.email,
        natLang: null, // These would need to be fetched from the API
        subscriptionStatus: null,
        subscriptionPlan: null,
      });
      setIsLoading(false);
    }
  }, [authUser, loading, studentSlug, router]);

  // Load custom intervals when user is available
  useEffect(() => {
    const loadCustomIntervals = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/student/custom-intervals?userId=${encodeURIComponent(user.email)}&t=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          setCustomIntervals(data.intervals);
          console.log('Loaded custom intervals from API:', data.intervals);
        } else {
          throw new Error(`API request failed with status: ${response.status}`);
        }
      } catch (error) {
        console.error('Error loading custom intervals from API:', error);
        // Fallback to localStorage
        try {
          const stored = localStorage.getItem(`customIntervals_${user.email}`);
          if (stored) {
            const parsedIntervals = JSON.parse(stored);
            setCustomIntervals(parsedIntervals);
            console.log('Loaded custom intervals from localStorage as fallback:', parsedIntervals);
          } else {
            console.log('No stored custom intervals found, using defaults');
          }
        } catch (localStorageError) {
          console.error('Error loading from localStorage:', localStorageError);
        }
      }
    };

    loadCustomIntervals();
  }, [user]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-gray-600 mb-4">Access denied.</p>
          <button 
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-black bg-opacity-90 text-white py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/student/${studentSlug}`)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold">Settings</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Account Settings</h2>
          
          {/* User Info Section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Profile Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Name
                </label>
                <div className="bg-gray-50 rounded-lg p-3 text-gray-800">
                  {user.name || "Not provided"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Email
                </label>
                <div className="bg-gray-50 rounded-lg p-3 text-gray-800">
                  {user.email}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Native Language
                </label>
                <div className="bg-gray-50 rounded-lg p-3 text-gray-800">
                  {user.natLang || "Not specified"}
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Subscription & Plan</h3>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800">
                    Current Plan: {user.subscriptionPlan || "Free Trial"}
                  </h4>
                  <p className="text-gray-600">
                    Status: {user.subscriptionStatus || "Active"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  onClick={() => {
                    // This would typically open a billing portal or redirect to Stripe
                    window.open('https://billing.stripe.com/p/login/test_123', '_blank');
                  }}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Adjust Plan
                </button>
                <p className="text-sm text-gray-600 mt-2">
                  Manage your subscription, billing, and plan details
                </p>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Learning Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-800">Email Notifications</h4>
                  <p className="text-sm text-gray-600">Receive reminders and progress updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-800">Study Reminders</h4>
                  <p className="text-sm text-gray-600">Daily reminders to practice vocabulary</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Flashcard Settings Section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Flashcard Review Intervals</h3>
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
              <p className="text-gray-600 mb-6">
                Customize how often you want to review flashcards based on how well you know them. 
                These intervals determine when a flashcard will appear again in your review queue.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Easy Rating */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-2">😊</span>
                    <h4 className="font-semibold text-gray-800">Easy</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    When you know the word well
                  </p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={customIntervals.easy}
                      onChange={(e) => setCustomIntervals(prev => ({
                        ...prev,
                        easy: parseInt(e.target.value) || 1
                      }))}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-gray-900 font-semibold"
                    />
                    <span className="text-sm text-gray-600">days</span>
                  </div>
                </div>

                {/* Medium Rating */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-2">😐</span>
                    <h4 className="font-semibold text-gray-800">Medium</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    When you somewhat know the word
                  </p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={customIntervals.medium}
                      onChange={(e) => setCustomIntervals(prev => ({
                        ...prev,
                        medium: parseInt(e.target.value) || 1
                      }))}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-gray-900 font-semibold"
                    />
                    <span className="text-sm text-gray-600">days</span>
                  </div>
                </div>

                {/* Hard Rating */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-2">😰</span>
                    <h4 className="font-semibold text-gray-800">Hard</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    When you don&apos;t know the word well
                  </p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={customIntervals.hard}
                      onChange={(e) => setCustomIntervals(prev => ({
                        ...prev,
                        hard: parseInt(e.target.value) || 1
                      }))}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-gray-900 font-semibold"
                    />
                    <span className="text-sm text-gray-600">days</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <p><strong>Tip:</strong> Shorter intervals for harder words help with retention, while longer intervals for easy words prevent over-reviewing.</p>
                </div>
                <button
                  onClick={saveCustomIntervals}
                  disabled={isSavingIntervals}
                  className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingIntervals ? 'Saving...' : 'Save Intervals'}
                </button>
              </div>
            </div>
          </div>

          {/* Support Section */}
          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Support & Help</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => router.push("/contact")}
                className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
              >
                <h4 className="font-medium text-blue-800">Contact Support</h4>
                <p className="text-sm text-blue-600">Get help with your account</p>
              </button>
              
              <button
                onClick={() => router.push("/legal/terms")}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                <h4 className="font-medium text-gray-800">Terms of Service</h4>
                <p className="text-sm text-gray-600">Read our terms and conditions</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
