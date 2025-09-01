"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { FlashcardDeck } from "../../../components/FlashcardDeck";
import { PricingModal, PricingOption } from "../../../components/PricingModal";
import { CEFRLevels } from "../../../components/CEFRLevels";

type SessionInfo = {
  sessionsThisMonth: number;
  sessionsRemaining: number;
  monthlyLimit: number;
  addonSessions: number;
  totalAvailable: number;
  currentPlan: string;
  canSchedule: boolean;
  billing: {
    active: boolean;
    planType: string;
    trialEndDate?: string;
  };
};

type User = {
  id: string;
  name?: string | null;
  email: string;
  goals?: string | null;
  billing?: { active?: boolean } | null;
  vocabularySheetId?: string | null;
  photo?: string | null;
  cefrLevels?: {
    understanding?: string;
    speaking?: string;
    reading?: string;
    writing?: string;
  } | null;
  lastAssessmentDate?: string | null;
};

type Assessment = {
  id: string;
  userId: string;
  email: string;
  submittedAt: string;
  answers: Record<string, string | number | boolean>;
  cefrLevels?: {
    understanding?: string;
    speaking?: string;
    reading?: string;
    writing?: string;
  } | null;
  createdAt: FirebaseFirestore.Timestamp;
};

type Appt = {
  id: string;
  title?: string;
  start?: { _seconds: number; _nanoseconds: number } | string;
  end?: { _seconds: number; _nanoseconds: number } | string;
  status?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  meetLink?: string;
};

function toDate(x: unknown): Date | null {
  if (!x) return null;
  if (typeof x === "string") return new Date(x);
  if (typeof x === "object" && x !== null && '_seconds' in x) {
    const timestamp = x as { _seconds: number; _nanoseconds?: number };
    return new Date(timestamp._seconds * 1000);
  }
  return null;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

type TabType = 'past' | 'upcoming' | 'practice';

export function StudentPageClient({ 
  user, 
  upcoming, 
  past, 
  assessments 
}: { 
  user: User;
  upcoming: { items: Appt[] };
  past: { items: Appt[] };
  assessments: Assessment[];
}) {
  const [activeTab, setActiveTab] = useState<TabType>('practice');
  const [checkingOut, setCheckingOut] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [preSelectPlan, setPreSelectPlan] = useState<string | undefined>(undefined);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const isPaid = !!user.billing?.active;
  const hasCompletedFirstLesson = past.items.length > 0;
  const locked = hasCompletedFirstLesson && !isPaid;
  const hasCompletedAssessment = assessments.length > 0;

  // Fetch session information
  const fetchSessionInfo = useCallback(async () => {
    try {
      setLoadingSessions(true);
      const response = await fetch(`/api/users/${encodeURIComponent(user.id)}/sessions`);
      if (response.ok) {
        const data = await response.json();
        setSessionInfo(data);
      }
    } catch (error) {
      console.error("Failed to fetch session info:", error);
    } finally {
      setLoadingSessions(false);
    }
  }, [user.id]);

  // Fetch session info on component mount
  useEffect(() => {
    if (isPaid) {
      fetchSessionInfo();
    } else {
      setLoadingSessions(false);
    }
  }, [isPaid, fetchSessionInfo]);

  const handlePlanSelection = useCallback((option: PricingOption) => {
    setShowPricingModal(false);
    // If it's a trial code, the backend already activated the account
    if (option.secretCode) {
      window.location.reload(); // Refresh to show unlocked state
    } else {
      // Refresh session info after purchase
      setTimeout(() => fetchSessionInfo(), 2000);
    }
  }, [fetchSessionInfo]);

  const openPricingModal = useCallback(() => {
    setPreSelectPlan(undefined);
    setShowPricingModal(true);
  }, []);

  const openPricingModalWithPlan = useCallback((planToPreSelect: string) => {
    setPreSelectPlan(planToPreSelect);
    setShowPricingModal(true);
  }, []);

  // Memoize appointment rendering to prevent unnecessary re-renders
  const renderAppointment = useCallback((appt: Appt, isPast: boolean = false) => {
    const startDate = toDate(appt.startTime || appt.start);
    const endDate = toDate(appt.endTime || appt.end);
    
    if (!startDate) return null;

    return (
      <div key={appt.id} className="bg-gray-50 rounded-lg p-4 mb-4 border-l-4 border-blue-500">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 mb-1">
              {appt.title || "English Lesson"}
            </h3>
            <p className="text-gray-600 text-sm mb-2">
              📅 {formatDate(startDate)} at {formatTime(startDate)}
            </p>
            {endDate && (
              <p className="text-gray-500 text-xs">
                Duration: {formatTime(startDate)} - {formatTime(endDate)}
              </p>
            )}
            {appt.location && (
              <p className="text-gray-600 text-sm mt-1">
                📍 {appt.location}
              </p>
            )}
          </div>
          <div className="text-right">
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
              isPast 
                ? 'bg-green-100 text-green-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {isPast ? 'Completed' : 'Scheduled'}
            </span>
          </div>
        </div>
        {appt.meetLink && !isPast && (
          <div className="mt-3">
            <a 
              href={appt.meetLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              🎥 Join Meeting
            </a>
          </div>
        )}
      </div>
    );
  }, []);

  // Memoize tab content to prevent unnecessary re-renders
  const tabContent = useMemo(() => {
    switch (activeTab) {
      case 'past':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📚 Past Lessons</h2>
            {past.items.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📚</div>
                <p className="text-gray-600">No past lessons yet. Schedule your first lesson to get started!</p>
              </div>
            ) : (
              <div>
                {past.items.map(appt => renderAppointment(appt, true))}
              </div>
            )}
          </div>
        );
      
      case 'upcoming':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🗓️ Upcoming Lessons</h2>
            
            {/* Sync Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <div className="flex items-start">
                <div className="text-blue-500 mr-2 mt-0.5">⏱️</div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">New appointments may take up to 5 minutes to appear</p>
                  <p className="text-blue-600">If you just booked a lesson and don&apos;t see it here, please refresh the page in a few minutes.</p>
                </div>
              </div>
            </div>
            
            {upcoming.items.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📅</div>
                <p className="text-gray-600">No upcoming lessons scheduled. Book a lesson to continue your learning journey!</p>
              </div>
            ) : (
              <div>
                {upcoming.items.map(appt => renderAppointment(appt, false))}
              </div>
            )}
          </div>
        );
      
      case 'practice':
        return (
          <div>            
            {/* CEFR Levels */}
            <div className="mb-8">
              <CEFRLevels userId={user.id} />
            </div>

            {/* Hero's Journey Progress */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">🏆 My Progress</h3>
              <div className="bg-gray-100 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold text-gray-700">Current Level: Beginner Explorer</span>
                  <span className="text-sm text-gray-500">0% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-4 rounded-full" style={{ width: '0.5%' }}></div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div className="bg-green-100 rounded-lg p-3">
                    <div className="text-2xl mb-1">✅</div>
                    <p className="text-sm font-semibold text-green-700">Completed</p>
                    <p className="text-xs text-green-600">{past.items.length} Lessons</p>
                  </div>
                  <div className="bg-blue-100 rounded-lg p-3">
                    <div className="text-2xl mb-1">🎯</div>
                    <p className="text-sm font-semibold text-blue-700">Scheduled</p>
                    <p className="text-xs text-blue-600">{upcoming.items.length} Lessons</p>
                  </div>
                  <div className="bg-purple-100 rounded-lg p-3">
                    <div className="text-2xl mb-1">⭐</div>
                    <p className="text-sm font-semibold text-purple-700">Achievements</p>
                    <p className="text-xs text-purple-600">0 Badges</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Flashcard Deck */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">🃏 My Flashcard Deck</h3>
                {user.vocabularySheetId && (
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${user.vocabularySheetId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                  >
                    📊 View Vocabulary Sheet
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
                <FlashcardDeck userId={user.id} />
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  }, [activeTab, past.items, upcoming.items, renderAppointment, user.id]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Banner Header */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Profile Image */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white bg-opacity-20 flex items-center justify-center border-4 border-white border-opacity-30 overflow-hidden">
              {user.photo ? (
                <img 
                  src={user.photo} 
                  alt="Profile photo" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to default avatar if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`text-center ${user.photo ? 'hidden' : ''}`}>
                <div className="text-3xl md:text-4xl mb-1">👤</div>
                <p className="text-xs font-semibold">Photo</p>
              </div>
            </div>
            
            {/* Welcome Content */}
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Welcome, {user.name ?? user.email.split('@')[0]}!
              </h1>
              <p className="text-lg md:text-xl text-blue-100">
                Learning Goal: {user.goals || "Master conversational English and build confidence in speaking"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Session Info Banner (for paid users) */}
      {isPaid && sessionInfo && (
        <section className="max-w-6xl mx-auto px-6 pt-6">
          <div className={`border rounded-lg p-4 ${
            sessionInfo.sessionsRemaining > 0 
              ? "bg-green-50 border-green-200" 
              : "bg-red-50 border-red-200"
          }`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className={sessionInfo.sessionsRemaining > 0 ? "text-green-800" : "text-red-800"}>
                <div className="font-semibold text-lg">
                  {sessionInfo.sessionsRemaining > 0 ? "📚 Sessions Available" : "⚠️ No Sessions Left"}
                </div>
                <div className="text-sm">
                  {sessionInfo.sessionsRemaining > 0 
                    ? `${sessionInfo.sessionsRemaining} of ${sessionInfo.totalAvailable} sessions remaining this month`
                    : "You've used all your sessions this month. Purchase add-on sessions to continue."
                  }
                </div>
                <div className="text-xs mt-1">
                  Plan: {sessionInfo.currentPlan.charAt(0).toUpperCase() + sessionInfo.currentPlan.slice(1)} 
                  ({sessionInfo.monthlyLimit} monthly + {sessionInfo.addonSessions} add-on)
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Change Plan Button */}
                <button
                  onClick={openPricingModal}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
                >
                  🔄 Change Plan
                </button>
                
                {/* Add-on Sessions Button */}
                <button
                  onClick={() => openPricingModalWithPlan('addon')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                    sessionInfo.sessionsRemaining === 0 
                      ? "bg-red-600 text-white hover:bg-red-700" 
                      : "bg-orange-600 text-white hover:bg-orange-700"
                  }`}
                >
                  {sessionInfo.sessionsRemaining === 0 ? "🚨 Buy Add-on Sessions" : "➕ Buy Add-on Sessions"}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Lock banner (appears after first lesson if not paid) */}
      {locked && (
        <section className="max-w-6xl mx-auto px-6 pt-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
            <div className="text-yellow-800">
              <div className="font-semibold text-lg">🔒 Free lesson complete</div>
              <div className="text-sm">
                To continue scheduling lessons and practice activities, please purchase a plan.
              </div>
            </div>
            <button
              onClick={openPricingModal}
              className="bg-yellow-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-yellow-700"
            >
              Choose a Plan
            </button>
          </div>
        </section>
      )}

      {/* Action Buttons */}
      <section className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {hasCompletedAssessment ? (
            <button 
              disabled
              className="bg-gray-400 text-gray-600 px-8 py-3 rounded-lg font-semibold cursor-not-allowed shadow-lg inline-block text-center"
              title="Assessment already completed"
            >
              ✅ Assessment Completed
            </button>
          ) : (
            <a 
              href="https://forms.gle/396aRWwtMGvLgiwX6" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-lg inline-block text-center"
            >
              📝 Take Assessment
            </a>
          )}
          {locked ? (
            <button 
              disabled
              className="bg-gray-400 text-gray-600 px-8 py-3 rounded-lg font-semibold cursor-not-allowed shadow-lg inline-block text-center"
              title="Schedule lessons after purchasing a plan"
            >
              📅 Schedule Lesson
            </button>
          ) : sessionInfo && !sessionInfo.canSchedule ? (
            <button 
              disabled
              className="bg-gray-400 text-gray-600 px-8 py-3 rounded-lg font-semibold cursor-not-allowed shadow-lg inline-block text-center"
              title="No sessions remaining. Purchase add-on sessions to continue."
            >
              📅 Schedule Lesson
            </button>
          ) : (
            <a 
              href="https://calendly.com/msraasch27/50min" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg inline-block text-center"
            >
              📅 Schedule Lesson
            </a>
          )}


        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="max-w-6xl mx-auto px-6">
        <div className="bg-white rounded-t-xl shadow-lg">
          <div className="flex border-b">
            <button 
              onClick={() => setActiveTab('past')}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                activeTab === 'past' 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              📚 Past Lessons
            </button>
            <button 
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                activeTab === 'upcoming' 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              🗓️ Upcoming Lessons
            </button>
            <button 
              onClick={() => setActiveTab('practice')}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                activeTab === 'practice' 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              🎯 Practice
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area (locked -> dim + overlay) */}
      <section className="max-w-6xl mx-auto px-6 pb-8 relative">
        <div className={locked ? "pointer-events-none opacity-50" : ""}>
          <div className="bg-white rounded-b-xl shadow-lg p-6">
            {tabContent}
          </div>
        </div>

        {locked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/85 backdrop-blur-sm border rounded-xl p-6 text-center shadow max-w-md">
              <div className="text-3xl mb-3">🔒</div>
              <div className="font-semibold mb-2">Your dashboard is locked</div>
              <div className="text-sm text-gray-600 mb-4">
                Purchase a plan to regain full access to lessons and practice.
              </div>
              <button
                onClick={openPricingModal}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700"
              >
                Choose a Plan
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Pricing Modal */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        onSelectPlan={handlePlanSelection}
        userEmail={user.email}
        preSelectPlan={preSelectPlan}
      />
    </main>
  );
}
