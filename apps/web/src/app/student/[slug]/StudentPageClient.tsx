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
  timezone?: string | null;
  billing?: { active?: boolean } | null;
  vocabularySheetId?: string | null;
  lessonsLibrarySheetId?: string | null; // For teacher reference only
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

type LessonDetails = {
  topic?: string | null;
  vocabulary?: string[];
  homework?: string | null;
  learningActivity?: string | null;
  resources?: string[];
  teacherNotes?: string | null;
  calendarEventId?: string;
  studentId?: string;
  createdAt?: { _seconds: number; _nanoseconds: number } | string;
  updatedAt?: { _seconds: number; _nanoseconds: number } | string;
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
  const [lessonDetails, setLessonDetails] = useState<Record<string, LessonDetails>>({});
  const [loadingLessonDetails, setLoadingLessonDetails] = useState(false);

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

  // Fetch lesson details for past lessons
  const fetchLessonDetails = useCallback(async () => {
    if (past.items.length === 0) return;
    
    try {
      setLoadingLessonDetails(true);
      const details: Record<string, LessonDetails> = {};
      
      // Fetch lesson details for each past lesson
      await Promise.all(
        past.items.map(async (appt) => {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api-bzn2v7ik2a-uc.a.run.app'}/api/teacher/lessons/${appt.id}`);
            if (response.ok) {
              const data = await response.json();
              details[appt.id] = data.details || {};
            }
          } catch (error) {
            console.error(`Failed to fetch lesson details for ${appt.id}:`, error);
          }
        })
      );
      
      setLessonDetails(details);
    } catch (error) {
      console.error("Failed to fetch lesson details:", error);
    } finally {
      setLoadingLessonDetails(false);
    }
  }, [past.items]);

  // Fetch session info on component mount
  useEffect(() => {
    if (isPaid) {
      fetchSessionInfo();
    } else {
      setLoadingSessions(false);
    }
  }, [isPaid, fetchSessionInfo]);

  // Fetch lesson details when past lessons change
  useEffect(() => {
    fetchLessonDetails();
  }, [fetchLessonDetails]);

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

  // Function to convert user timezone string to IANA timezone identifier
  const getValidTimezone = useCallback((timezone: string | null | undefined): string => {
    if (!timezone) return 'UTC';
    
    // Map common timezone strings to IANA identifiers
    const timezoneMap: Record<string, string> = {
      'UTC−01:00 — Azores, Cape Verde': 'Atlantic/Azores',
      'UTC+00:00 — London, Dublin': 'Europe/London',
      'UTC+01:00 — Paris, Berlin': 'Europe/Paris',
      'UTC+02:00 — Athens, Helsinki': 'Europe/Athens',
      'UTC+03:00 — Moscow, Istanbul': 'Europe/Moscow',
      'UTC+04:00 — Dubai, Baku': 'Asia/Dubai',
      'UTC+05:00 — Karachi, Tashkent': 'Asia/Karachi',
      'UTC+05:30 — Mumbai, Delhi': 'Asia/Kolkata',
      'UTC+06:00 — Dhaka, Almaty': 'Asia/Dhaka',
      'UTC+07:00 — Bangkok, Jakarta': 'Asia/Bangkok',
      'UTC+08:00 — Beijing, Singapore': 'Asia/Shanghai',
      'UTC+09:00 — Tokyo, Seoul': 'Asia/Tokyo',
      'UTC+10:00 — Sydney, Melbourne': 'Australia/Sydney',
      'UTC+11:00 — Nouméa, Port Vila': 'Pacific/Noumea',
      'UTC+12:00 — Auckland, Fiji': 'Pacific/Auckland',
      'UTC−12:00 — Baker Island': 'Pacific/Baker_Island',
      'UTC−11:00 — American Samoa': 'Pacific/Pago_Pago',
      'UTC−10:00 — Hawaii': 'Pacific/Honolulu',
      'UTC−09:00 — Alaska': 'America/Anchorage',
      'UTC−08:00 — Los Angeles, Vancouver': 'America/Los_Angeles',
      'UTC−07:00 — Denver, Phoenix': 'America/Denver',
      'UTC−06:00 — Chicago, Mexico City': 'America/Chicago',
      'UTC−05:00 — New York, Toronto': 'America/New_York',
      'UTC−04:00 — Santiago, Caracas': 'America/Santiago',
      'UTC−03:00 — São Paulo, Buenos Aires': 'America/Sao_Paulo',
      'UTC−02:00 — Mid-Atlantic': 'Atlantic/South_Georgia',
    };
    
    // Check if it's already a valid IANA timezone
    if (timezone.includes('/')) {
      return timezone;
    }
    
    // Return mapped timezone or fallback to UTC
    return timezoneMap[timezone] || 'UTC';
  }, []);

  // Function to format date/time in user's timezone
  const formatDateInTimezone = useCallback((date: Date): string => {
    try {
      const validTimezone = getValidTimezone(user.timezone);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        timeZone: validTimezone
      });
    } catch (error) {
      console.warn('Invalid timezone, falling back to UTC:', user.timezone, error);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        timeZone: 'UTC'
      });
    }
  }, [user.timezone, getValidTimezone]);

  const formatTimeInTimezone = useCallback((date: Date): string => {
    try {
      const validTimezone = getValidTimezone(user.timezone);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true,
        timeZone: validTimezone
      });
    } catch (error) {
      console.warn('Invalid timezone, falling back to UTC:', user.timezone, error);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC'
      });
    }
  }, [user.timezone, getValidTimezone]);

  // Function to render past lessons with lesson details
  const renderPastLesson = useCallback((appt: Appt) => {
    const startDate = toDate(appt.startTime || appt.start);
    const endDate = toDate(appt.endTime || appt.end);
    
    if (!startDate) return null;

    const details = lessonDetails[appt.id] || {};
    const hasResources = details.resources && details.resources.length > 0;
    const hasHomework = details.homework && details.homework.trim() !== '';

    return (
      <div key={appt.id} className="bg-white rounded-lg p-6 mb-6 border border-gray-200 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 mb-2 text-lg">
              {details.topic || appt.title || "English Lesson"}
            </h3>
            <p className="text-gray-600 text-sm">
              📅 {formatDateInTimezone(startDate)} at {formatTimeInTimezone(startDate)}
            </p>
            {endDate && (
              <p className="text-gray-500 text-xs mt-1">
                Duration: {formatTimeInTimezone(startDate)} - {formatTimeInTimezone(endDate)}
              </p>
            )}
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            Completed
          </span>
        </div>

        {/* Homework Assignment */}
        {hasHomework && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">📋 Homework Assignment</h4>
            <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded border-l-4 border-blue-400">
              {details.homework}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-4">
          {/* Review Materials Button */}
          {hasResources && (
            <a
              href={details.resources![0]}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              📚 Review Materials
            </a>
          )}
          
          {/* Review Vocab Button */}
          <button
            onClick={() => setActiveTab('practice')}
            className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
          >
            📝 Review Vocab
          </button>
        </div>
      </div>
    );
  }, [lessonDetails, formatDateInTimezone, formatTimeInTimezone, setActiveTab]);

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
            ) : loadingLessonDetails ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-gray-600">Loading lesson details...</p>
              </div>
            ) : (
              <div>
                {past.items.map(appt => renderPastLesson(appt))}
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
                  <p className="font-medium mb-1">New appointments must be approved by both the teacher and the student before they will appear</p>
                  <p className="text-blue-600">If you just booked a lesson and don&apos;t see it here, please accept the invitation in your Google calendar.</p>
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
              </div>
            </div>

            {/* Interactive Flashcard Deck */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">🃏 My Flashcard Deck</h3>
                {user.vocabularySheetId && (
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${user.vocabularySheetId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                  >
                    📊 Edit Vocabulary Sheet
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

            {/* CEFR Levels */}
            <div>
              <CEFRLevels userId={user.id} />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  }, [activeTab, past.items, upcoming.items, renderAppointment, user.id]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" style={{ backgroundImage: 'url(/gothic_full_cropped.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      {/* Banner Header */}
      <section className="max-w-6xl mx-auto px-4 py-16 rounded-2xl" style={{ backgroundColor: '#000000' }}>
        <div className="bg-black bg-opacity-90 rounded-2xl p-8 mx-8 my-4 max-w-6xl">
          <div className="flex flex-col lg:flex-row items-start gap-6">
            {/* Welcome Content */}
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Welcome, {user.name ?? user.email.split('@')[0]}!
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-6">
                Learning Goal: {user.goals || "Master conversational English and build confidence in speaking"}
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                {hasCompletedAssessment ? (
                  <button 
                    disabled
                    className="bg-gray-400 text-gray-600 px-6 py-3 rounded-lg font-semibold cursor-not-allowed shadow-lg inline-block text-center"
                    title="Assessment already completed"
                  >
                    ✅ Assessment Completed
                  </button>
                ) : (
                  <a 
                    href="https://forms.gle/396aRWwtMGvLgiwX6" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-lg inline-block text-center"
                  >
                    📝 Take Assessment
                  </a>
                )}
                {locked ? (
                  <button 
                    disabled
                    className="bg-gray-400 text-gray-600 px-6 py-3 rounded-lg font-semibold cursor-not-allowed shadow-lg inline-block text-center"
                    title="Schedule lessons after purchasing a plan"
                  >
                    📅 Schedule Lesson
                  </button>
                ) : sessionInfo && !sessionInfo.canSchedule ? (
                  <button 
                    disabled
                    className="bg-gray-400 text-gray-600 px-6 py-3 rounded-lg font-semibold cursor-not-allowed shadow-lg inline-block text-center"
                    title="No sessions remaining. Purchase add-on sessions to continue."
                  >
                    📅 Schedule Lesson
                  </button>
                ) : (
                  <a 
                    href="https://calendly.com/msraasch27/50min" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors shadow-lg inline-block text-center"
                  >
                    📅 Schedule Lesson
                  </a>
                )}
              </div>
            </div>

            {/* Session Info (for paid users) - Right aligned */}
            {isPaid && sessionInfo && (
              <div className="w-full lg:w-auto lg:min-w-[300px]">
                <div className={`border rounded-lg p-3 ${
                  sessionInfo.sessionsRemaining > 0 
                    ? "bg-green-50 border-green-200" 
                    : "bg-red-50 border-red-200"
                }`}>
                  <div className={`text-sm ${sessionInfo.sessionsRemaining > 0 ? "text-green-800" : "text-red-800"}`}>
                    <div className="font-semibold text-base mb-1">
                      {sessionInfo.sessionsRemaining > 0 ? "📚 Sessions Available" : "⚠️ No Sessions Left"}
                    </div>
                    <div className="text-xs mb-2">
                      {sessionInfo.sessionsRemaining > 0 
                        ? `${sessionInfo.sessionsRemaining} of ${sessionInfo.totalAvailable} remaining`
                        : "All sessions used this month"
                      }
                    </div>
                    <div className="text-xs opacity-75">
                      {sessionInfo.currentPlan.charAt(0).toUpperCase() + sessionInfo.currentPlan.slice(1)} Plan
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 mt-3">
                    <button
                      onClick={openPricingModal}
                      className="bg-amber-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-amber-700 transition-colors"
                    >
                      🔄 Change Plan
                    </button>
                    <button
                      onClick={() => openPricingModalWithPlan('addon')}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                        sessionInfo.sessionsRemaining === 0 
                          ? "bg-red-600 text-white hover:bg-red-700" 
                          : "bg-orange-600 text-white hover:bg-orange-700"
                      }`}
                    >
                      {sessionInfo.sessionsRemaining === 0 ? "🚨 Buy Add-ons" : "➕ Buy Add-ons"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>


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


      {/* Navigation Tabs */}
      <section className="max-w-6xl mx-auto px-6">
        <div className="bg-white rounded-t-xl shadow-lg">
          <div className="flex border-b">
            <button 
              onClick={() => setActiveTab('past')}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                activeTab === 'past' 
                  ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50' 
                  : 'text-gray-600 hover:text-amber-600 hover:bg-amber-50'
              }`}
            >
              📚 Past Lessons
            </button>
            <button 
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                activeTab === 'upcoming' 
                  ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50' 
                  : 'text-gray-600 hover:text-amber-600 hover:bg-amber-50'
              }`}
            >
              🗓️ Upcoming Lessons
            </button>
            <button 
              onClick={() => setActiveTab('practice')}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                activeTab === 'practice' 
                  ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50' 
                  : 'text-gray-600 hover:text-amber-600 hover:bg-amber-50'
              }`}
            >
              🎯 Practice
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area (locked -> dim + overlay) */}
      <section className="max-w-6xl mx-auto px-6 pb-8 relative rounded-2xl" style={{ backgroundColor: '#475037' }}>
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
                className="bg-amber-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-amber-700"
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
