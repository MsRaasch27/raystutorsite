"use client";

import { useState, useMemo, useCallback } from "react";
import { FlashcardDeck } from "../../../components/FlashcardDeck";
import { VocabularySettings } from "../../../components/VocabularySettings";

type User = {
  id: string;
  name?: string | null;
  email: string;
  goals?: string | null;
  billing?: { active?: boolean } | null;
  vocabularySheetId?: string | null;
};

type Assessment = {
  id: string;
  userId: string;
  email: string;
  submittedAt: string;
  answers: Record<string, string | number | boolean>;
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
  const [currentVocabularySheetId, setCurrentVocabularySheetId] = useState(user.vocabularySheetId);

  const isPaid = !!user.billing?.active;
  const hasCompletedFirstLesson = past.items.length > 0;
  const locked = hasCompletedFirstLesson && !isPaid;
  const hasCompletedAssessment = assessments.length > 0;

  const startCheckout = useCallback(async () => {
    try {
      setCheckingOut(true);
      const resp = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          returnTo: `${window.location.origin}/student/${encodeURIComponent(user.id)}`
        })
      });
      const data = await resp.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert("Unable to start checkout. Please try again.");
      }
    } finally {
      setCheckingOut(false);
    }
  }, [user.email, user.id]);

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
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🎯 Extra Practice</h2>
            
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

            {/* Vocabulary Settings */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">⚙️ Vocabulary Settings</h3>
              <VocabularySettings 
                userId={user.id}
                currentSheetId={currentVocabularySheetId}
                onSheetIdUpdate={setCurrentVocabularySheetId}
              />
            </div>

            {/* Interactive Flashcard Deck */}
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">🃏 My Flashcard Deck</h3>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
                <FlashcardDeck userId={user.id} />
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  }, [activeTab, past.items, upcoming.items, renderAppointment, user.id, currentVocabularySheetId]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Banner Header */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Profile Image */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white bg-opacity-20 flex items-center justify-center border-4 border-white border-opacity-30">
              <div className="text-center">
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
              onClick={startCheckout}
              disabled={checkingOut}
              className="bg-yellow-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-yellow-700 disabled:opacity-60"
            >
              {checkingOut ? "Redirecting…" : "Unlock with a Plan"}
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
          <a 
            href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1YL7elo0lkIxv6Su3_AInKisXz3XdiRbJ_iEc6bxs2UCBGV9TZy8Z61AxhTj3cN8idri6VX8LA" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg inline-block text-center"
          >
            📅 Schedule Lesson
          </a>

          {/* Extra CTA in the button row when locked */}
          {locked && (
            <button
              onClick={startCheckout}
              disabled={checkingOut}
              className="bg-amber-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors shadow-lg inline-block text-center disabled:opacity-60"
            >
              {checkingOut ? "Redirecting…" : "Buy a Plan"}
            </button>
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
                onClick={startCheckout}
                disabled={checkingOut}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60"
              >
                {checkingOut ? "Redirecting…" : "Buy a Plan"}
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
