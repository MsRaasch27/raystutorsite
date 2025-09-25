"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FlashcardDeck } from "../../../components/FlashcardDeck";
import { PricingModal, PricingOption } from "../../../components/PricingModal";
import { CEFRLevels } from "../../../components/CEFRLevels";
import AnimalFamiliarPopup from "../../../components/AnimalFamiliarPopup";
import CreatureSelectionScreen from "../../../components/CreatureSelectionScreen";
import SparkleButton from "../../../components/SparkleButton";

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
  selectedCreature?: string | null;
  creatureSelectedAt?: string | null;
  billing?: { active?: boolean } | null;
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
  // const [checkingOut, setCheckingOut] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showAnimalFamiliarPopup, setShowAnimalFamiliarPopup] = useState(false);
  const [showCreatureSelection, setShowCreatureSelection] = useState(false);
  const [selectedCreature, setSelectedCreature] = useState<string | null>(user.selectedCreature || null);
  const router = useRouter();
  
  // Animation states for creature hopping
  const [creatureAnimation, setCreatureAnimation] = useState<'idle' | 'hopping' | 'wiggling'>('idle');
  const [previousTab, setPreviousTab] = useState<TabType | null>(null);
  const [creaturePosition, setCreaturePosition] = useState<{ x: number; y: number } | null>(null);
  const [hopDirection, setHopDirection] = useState<string>('');

  // Animated tab change function
  const handleAnimatedTabChange = useCallback((newTab: TabType) => {
    if (newTab === activeTab || !selectedCreature) {
      setActiveTab(newTab);
      return;
    }

    // Determine the hop direction based on current and new tab
    let direction = '';
    if (activeTab === 'past' && newTab === 'upcoming') {
      direction = 'center-right';
    } else if (activeTab === 'past' && newTab === 'practice') {
      direction = 'right';
    } else if (activeTab === 'upcoming' && newTab === 'past') {
      direction = 'center-left';
    } else if (activeTab === 'upcoming' && newTab === 'practice') {
      direction = 'center-right';
    } else if (activeTab === 'practice' && newTab === 'upcoming') {
      direction = 'center-left';
    } else if (activeTab === 'practice' && newTab === 'past') {
      direction = 'left';
    }

    // Start arc hopping animation
    setCreatureAnimation('hopping');
    setHopDirection(direction);
    setPreviousTab(activeTab);

    // After arc hopping animation, change tab and start wiggling
    setTimeout(() => {
      setActiveTab(newTab);
      setCreatureAnimation('wiggling');
      
      // After wiggling, return to idle
      setTimeout(() => {
        setCreatureAnimation('idle');
        setHopDirection('');
        setPreviousTab(null);
      }, 600); // Wiggle duration
    }, 800); // Arc hop duration - matches CSS transition duration
  }, [activeTab, selectedCreature]);
  const [isSelectingCreature, setIsSelectingCreature] = useState(false);
  const [cameFromAnimalFamiliar, setCameFromAnimalFamiliar] = useState(false);
  const [preSelectPlan, setPreSelectPlan] = useState<string | undefined>(undefined);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  // const [loadingSessions, setLoadingSessions] = useState(true);
  const [lessonDetails, setLessonDetails] = useState<Record<string, LessonDetails>>({});
  const [loadingLessonDetails, setLoadingLessonDetails] = useState(false);

  const isPaid = !!user.billing?.active;
  const hasCompletedFirstLesson = past.items.length > 0;
  const locked = hasCompletedFirstLesson && !isPaid;
  
  // Show animal familiar popup when user is locked and hasn't seen it yet
  useEffect(() => {
    if (locked && !showAnimalFamiliarPopup && !showCreatureSelection) {
      setShowAnimalFamiliarPopup(true);
    }
  }, [locked, showAnimalFamiliarPopup, showCreatureSelection]);

  // Update selectedCreature when user data changes
  useEffect(() => {
    if (user.selectedCreature && user.selectedCreature !== selectedCreature) {
      setSelectedCreature(user.selectedCreature);
    }
  }, [user.selectedCreature, selectedCreature]);

  // Show creature selection for subscribed users who haven't selected a creature yet
  useEffect(() => {
    if (isPaid && !selectedCreature && !showCreatureSelection && !showAnimalFamiliarPopup) {
      setShowCreatureSelection(true);
    }
  }, [isPaid, selectedCreature, showCreatureSelection, showAnimalFamiliarPopup]);
  const hasCompletedAssessment = assessments.length > 0;

  // Calculate level and progress based on completed lessons (50 lessons per level)
  const completedLessons = past.items.length;
  const currentLevel = Math.floor(completedLessons / 50);
  const lessonsInCurrentLevel = completedLessons % 50;
  const progressPercentage = (lessonsInCurrentLevel / 50) * 100; // 2% per lesson within current level
  
  // Calculate level info based on current level tier
  const getLevelInfo = useCallback((level: number) => {
    const levels = [
      { name: "Apprentice of Words", color: "from-yellow-400 to-orange-500" },
      { name: "Adept of Phrases", color: "from-orange-400 to-red-500" },
      { name: "Scholar of Incantations", color: "from-red-400 to-pink-500" },
      { name: "Conjurer of Discourse", color: "from-pink-400 to-purple-500" },
      { name: "Archmage of Expression", color: "from-purple-400 to-indigo-500" },
      { name: "Sage of Tongues", color: "from-indigo-400 to-blue-500" },
      { name: "Wizard of Language", color: "from-blue-400 to-cyan-500" },
      { name: "Master English Speaker", color: "from-cyan-400 to-emerald-500" },
      { name: "Grandmaster Linguist", color: "from-emerald-400 to-teal-500" },
      { name: "Legendary Polyglot", color: "from-teal-400 to-cyan-500" }
    ];
    
    // If beyond the defined levels, continue with higher tiers
    if (level >= levels.length) {
      const extraLevels = level - levels.length + 1;
      return { 
        name: `Supreme Scholar (Tier ${extraLevels})`, 
        color: "from-cyan-400 to-purple-500" 
      };
    }
    
    return levels[level];
  }, []);

  const levelInfo = getLevelInfo(currentLevel);

  // Fetch session information
  const fetchSessionInfo = useCallback(async () => {
    try {
      // setLoadingSessions(true);
      const response = await fetch(`/api/users/${encodeURIComponent(user.id)}/sessions`);
      if (response.ok) {
        const data = await response.json();
        setSessionInfo(data);
      }
    } catch (error) {
      console.error("Failed to fetch session info:", error);
    } finally {
      // setLoadingSessions(false);
    }
  }, [user.id]);

  // Fetch lesson details for past and upcoming lessons
  const fetchLessonDetails = useCallback(async () => {
    const allLessons = [...past.items, ...upcoming.items];
    if (allLessons.length === 0) return;
    
    try {
      setLoadingLessonDetails(true);
      const details: Record<string, LessonDetails> = {};
      
      // Fetch lesson details for each lesson
      await Promise.all(
        allLessons.map(async (appt) => {
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
  }, [past.items, upcoming.items]);

  // Fetch session info on component mount
  useEffect(() => {
    if (isPaid) {
      fetchSessionInfo();
    } else {
      // setLoadingSessions(false);
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
      setTimeout(() => {
        fetchSessionInfo();
        // If user came from animal familiar popup, show creature selection
        if (cameFromAnimalFamiliar && !selectedCreature) {
          setShowCreatureSelection(true);
          setCameFromAnimalFamiliar(false); // Reset the flag
        }
      }, 2000);
    }
  }, [fetchSessionInfo, cameFromAnimalFamiliar, selectedCreature, setShowCreatureSelection, setCameFromAnimalFamiliar]);

  const openPricingModal = useCallback(() => {
    setPreSelectPlan(undefined);
    setShowPricingModal(true);
  }, []);

  // const openPricingModalWithPlan = useCallback((planToPreSelect: string) => {
  //   setPreSelectPlan(planToPreSelect);
  //   setShowPricingModal(true);
  // }, []);

  // Animal familiar flow handlers
  const handleAnimalFamiliarContinue = useCallback(() => {
    setShowAnimalFamiliarPopup(false);
    setCameFromAnimalFamiliar(true);
    // Direct to subscription purchase first
    setShowPricingModal(true);
  }, []);

  const handleAnimalFamiliarClose = useCallback(() => {
    setShowAnimalFamiliarPopup(false);
    setCameFromAnimalFamiliar(true);
    // After closing, show the subscription prompt
    setShowPricingModal(true);
  }, []);

  const handleCreatureSelection = useCallback(async (creatureId: string) => {
    setIsSelectingCreature(true);
    try {
      const response = await fetch('/api/save-selected-creature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          creatureId,
        }),
      });

      if (response.ok) {
        setSelectedCreature(creatureId);
        setShowCreatureSelection(false);
        // Creature selected successfully - no need to show pricing modal
      } else {
        throw new Error('Failed to save creature selection');
      }
    } catch (error) {
      console.error('Error saving creature selection:', error);
      // Still close the selection screen
      setShowCreatureSelection(false);
    } finally {
      setIsSelectingCreature(false);
    }
  }, [user.id]);

  const handleCreatureSelectionClose = useCallback(() => {
    setShowCreatureSelection(false);
    // User is already subscribed at this point, no need to show pricing
  }, []);

  // Memoize appointment rendering to prevent unnecessary re-renders
  const renderAppointment = useCallback((appt: Appt, isPast: boolean = false) => {
    const startDate = toDate(appt.startTime || appt.start);
    // const endDate = toDate(appt.endTime || appt.end);
    
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
            {/* {endDate && (
              <p className="text-gray-500 text-xs">
                Duration: {formatTime(startDate)} - {formatTime(endDate)}
              </p>
            )} */}
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

  // Function to get timezone abbreviation
  const getTimezoneAbbreviation = useCallback((date: Date): string => {
    try {
      const validTimezone = getValidTimezone(user.timezone);
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: validTimezone,
        timeZoneName: 'short'
      });
      const parts = formatter.formatToParts(date);
      const timeZoneName = parts.find(part => part.type === 'timeZoneName');
      return timeZoneName ? timeZoneName.value : 'UTC';
    } catch (error) {
      console.warn('Error getting timezone abbreviation, falling back to UTC:', error);
      return 'UTC';
    }
  }, [user.timezone, getValidTimezone]);

   // Function to render past lessons with lesson details
   const renderPastLesson = useCallback((appt: Appt) => {
     const startDate = toDate(appt.startTime || appt.start);
     // const endDate = toDate(appt.endTime || appt.end);
     
     if (!startDate) return null;

     const details = lessonDetails[appt.id] || {};
     const hasResources = details.resources && details.resources.length > 0;
     const hasHomework = details.homework && details.homework.trim() !== '';
     const timezoneAbbr = getTimezoneAbbreviation(startDate);

     return (
       <div key={appt.id} className="bg-white rounded-lg p-6 mb-6 border border-gray-200 shadow-sm">
         <div className="flex justify-between items-start mb-4">
           <div className="flex-1">
             <h3 className="font-semibold text-gray-800 mb-2 text-lg">
               {details.topic || appt.title || "English Lesson"}
             </h3>
             <p className="text-gray-600 text-sm">
               📅 {formatDateInTimezone(startDate)} at {formatTimeInTimezone(startDate)} {timezoneAbbr}
             </p>
             <p className="text-gray-500 text-xs mt-1">
               Duration: 50 minutes
             </p>
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
  }, [lessonDetails, formatDateInTimezone, formatTimeInTimezone, setActiveTab, getTimezoneAbbreviation]);

  // Function to render upcoming lessons with lesson details
  const renderUpcomingLesson = useCallback((appt: Appt) => {
    const startDate = toDate(appt.startTime || appt.start);
    // const endDate = toDate(appt.endTime || appt.end);
    
    if (!startDate) return null;

    const details = lessonDetails[appt.id] || {};
    const timezoneAbbr = getTimezoneAbbreviation(startDate);

    return (
      <div key={appt.id} className="bg-gray-50 rounded-lg p-4 mb-4 border-l-4 border-blue-500">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 mb-1">
              {appt.title || "English Lesson"}
            </h3>
            
            {/* Topic from lesson details */}
            {details.topic && (
              <p className="text-gray-700 text-sm mb-2 font-medium">
                Topic: {details.topic}
              </p>
            )}
            
            <p className="text-gray-600 text-sm mb-2">
              {formatDateInTimezone(startDate)} at {formatTimeInTimezone(startDate)} {timezoneAbbr}
            </p>
            
            {/* {endDate && (
              <p className="text-gray-500 text-xs">
                Duration: {formatTimeInTimezone(startDate)} - {formatTimeInTimezone(endDate)}
              </p>
            )} */}
          </div>
          <div className="text-right">
            <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              Scheduled
            </span>
          </div>
        </div>
        {appt.meetLink && (
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
  }, [lessonDetails, formatDateInTimezone, formatTimeInTimezone, getTimezoneAbbreviation]);

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
            ) : loadingLessonDetails ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-gray-600">Loading lesson details...</p>
              </div>
            ) : (
              <div>
                {upcoming.items.map(appt => renderUpcomingLesson(appt))}
              </div>
            )}
          </div>
        );
      
      case 'practice':
        return (
          <div>            
            {/* Hero's Journey Progress */}
            <div className="mb-8">
              <div className="bg-gray-100 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold text-gray-700">Current Level: {levelInfo.name}</span>
                  <span className="text-sm text-gray-500">{Math.round(progressPercentage)}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className={`bg-gradient-to-r ${levelInfo.color} h-4 rounded-full transition-all duration-500 ease-out`} 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-2 text-xs text-gray-600">
                  <span>{lessonsInCurrentLevel} lessons in current level</span>
                  <span>{50 - lessonsInCurrentLevel} lessons to next level</span>
                </div>
                <div className="text-center mt-2 text-xs text-gray-500">
                  Total: {completedLessons} lessons completed
                </div>
              </div>
            </div>


            {/* Interactive Flashcard Deck */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <Link
                  href={`/student/${encodeURIComponent(user.id)}/vocabulary`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                >
                  📚 Manage Vocabulary
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </Link>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200 overflow-hidden">
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
  }, [activeTab, past.items, upcoming.items, renderAppointment, user.id, completedLessons, lessonsInCurrentLevel, levelInfo.color, levelInfo.name, loadingLessonDetails, progressPercentage, selectedCreature, renderPastLesson, renderUpcomingLesson]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" style={{ backgroundImage: 'url(/gothic_full_cropped.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      {/* Floating Candles */}
      <div 
        className="absolute top-8 right-8 z-50 pointer-events-none"
        style={{
          animation: 'slowBounce 3s ease-in-out infinite'
        }}
      >
        <img
          src="/candle.png"
          alt="Floating Candle"
          className="w-[180px] h-[180px] object-contain"
        />
      </div>
      
      <div 
        className="absolute top-16 left-12 z-50 pointer-events-none"
        style={{
          animation: 'slowBounce 3.5s ease-in-out infinite'
        }}
      >
        <img
          src="/candle.png"
          alt="Floating Candle"
          className="w-[150px] h-[150px] object-contain"
        />
      </div>
      
      <div 
        className="absolute top-32 right-32 z-50 pointer-events-none"
        style={{
          animation: 'slowBounce 2.8s ease-in-out infinite'
        }}
      >
        <img
          src="/candle.png"
          alt="Floating Candle"
          className="w-[130px] h-[130px] object-contain"
        />
      </div>
      
      <div 
        className="absolute top-24 left-4 z-50 pointer-events-none"
        style={{
          animation: 'slowBounce 3.2s ease-in-out infinite'
        }}
      >
        <img
          src="/candle.png"
          alt="Floating Candle"
          className="w-[140px] h-[140px] object-contain"
        />
      </div>
      
      <div 
        className="absolute top-40 right-16 z-50 pointer-events-none"
        style={{
          animation: 'slowBounce 2.5s ease-in-out infinite'
        }}
      >
        <img
          src="/candle.png"
          alt="Floating Candle"
          className="w-[120px] h-[120px] object-contain"
        />
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slowBounce {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-15px);
            }
          }
        `
      }} />
      {/* Banner Header */}
      <section className="max-w-6xl mx-auto px-4 py-16 rounded-2xl" style={{ backgroundColor: '#000000' }}>
        <div className="bg-black bg-opacity-90 rounded-2xl p-8 mx-8 my-4 max-w-6xl relative">
          {/* Settings Gear Icon */}
          <button
            onClick={() => router.push(`/student/${encodeURIComponent(user.email)}/settings`)}
            className="absolute top-2 right-2 text-white hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-10 z-50"
            title="Settings"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>

          {/* Candles in Top Left Corner */}
          <div className="absolute -top-16 -left-12 z-50 pointer-events-none">
            <div
              className="absolute top-0 left-0"
              style={{
                animation: 'slowBounce 3.5s ease-in-out infinite',
                width: '150px',
                height: '150px'
              }}
            >
              <img
                src="/candle.png"
                alt="Floating Candle"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>

            <div
              className="absolute top-6 left-16"
              style={{
                animation: 'slowBounce 3.2s ease-in-out infinite',
                width: '130px',
                height: '130px'
              }}
            >
              <img
                src="/candle.png"
                alt="Floating Candle"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>
          </div>

          {/* Candles in Bottom Right Corner */}
          <div className="absolute bottom-12 right-0 z-50 pointer-events-none">
            <div 
              className="absolute -top-45 -right-50 candle-1"
              style={{
                animation: 'slowBounce 3s ease-in-out infinite',
                width: '300px',
                height: '300px'
              }}
            >
              <img
                src="/candle.png"
                alt="Floating Candle"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  maxWidth: 'none',
                  maxHeight: 'none'
                }}
              />
            </div>
            
            <div 
              className="absolute -top-25 -right-30 candle-2"
              style={{
                animation: 'slowBounce 2.8s ease-in-out infinite',
                width: '250px',
                height: '250px'
              }}
            >
              <img
                src="/candle.png"
                alt="Floating Candle"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  maxWidth: 'none',
                  maxHeight: 'none'
                }}
              />
            </div>
            
            <div 
              className="absolute -top-20 -right-45 candle-3"
              style={{
                animation: 'slowBounce 2.5s ease-in-out infinite',
                width: '200px',
                height: '200px'
              }}
            >
              <img
                src="/candle.png"
                alt="Floating Candle"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  maxWidth: 'none',
                  maxHeight: 'none'
                }}
              />
            </div>
          </div>

          {/* Top Section with Profile Image and Header Text */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
            {/* Student Avatar */}
            <div className="relative w-28 h-28 md:w-40 md:h-40 flex-shrink-0">
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-white border-opacity-30">
                {levelInfo.name === "Apprentice of Words" ? (
                  <img
                    src="/wizardsnail.png"
                    alt="Wizard Snail Avatar"
                    className="w-full h-full object-cover"
                    style={{ objectFit: 'contain' }}
                  />
                ) : levelInfo.name === "Adept of Phrases" ? (
                  <img
                    src="/wizardchipmunk.png"
                    alt="Wizard Chipmunk Avatar"
                    className="w-full h-full object-cover"
                    style={{ objectFit: 'contain' }}
                  />
                ) : levelInfo.name === "Scholar of Incantations" ? (
                  <img
                    src="/wizardrabbit.png"
                    alt="Wizard Rabbit Avatar"
                    className="w-full h-full object-cover"
                    style={{ objectFit: 'contain' }}
                  />
                ) : levelInfo.name === "Conjurer of Discourse" ? (
                  <img
                    src="/wizardraccoon.png"
                    alt="Wizard Raccoon Avatar"
                    className="w-full h-full object-cover"
                    style={{ objectFit: 'contain' }}
                  />
                ) : levelInfo.name === "Archmage of Expression" ? (
                  <img
                    src="/wizardfox.png"
                    alt="Wizard Fox Avatar"
                    className="w-full h-full object-cover"
                    style={{ objectFit: 'contain' }}
                  />
                ) : levelInfo.name === "Sage of Tongues" ? (
                  <img
                    src="/wizardbear.png"
                    alt="Wizard Bear Avatar"
                    className="w-full h-full object-cover"
                    style={{ objectFit: 'contain' }}
                  />
                ) : (
                  <div className="text-4xl lg:text-5xl text-gray-400 flex items-center justify-center h-full">
                    🧙‍♂️
                  </div>
                )}
              </div>
            </div>

            {/* Header Text */}
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 text-white">
                Welcome, {user.name ?? user.email.split('@')[0]}!
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl text-white max-w-2xl">
                Learning Goal: {user.goals || "Master conversational English and build confidence in speaking"}
              </p>
            </div>
          </div>

          {/* Buttons Section */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            {!hasCompletedAssessment && (
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
                📅 Schedule Lesson (0 remaining)
              </button>
            ) : (
              <SparkleButton
                href="https://calendly.com/msraasch27/50min"
                className="bg-white text-amber-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block text-center"
                title={sessionInfo ? `${sessionInfo.sessionsRemaining} sessions remaining` : "Schedule your lesson"}
              >
                📅 Schedule Lesson {sessionInfo && `(${sessionInfo.sessionsRemaining} remaining)`}
              </SparkleButton>
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


      {/* Main Content Area with Navigation (locked -> dim + overlay) */}
      <section className="max-w-6xl mx-auto px-6 pb-8 relative rounded-2xl" style={{ backgroundColor: '#475037' }}>
        {/* Navigation Buttons */}
        <div className="py-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => handleAnimatedTabChange('past')}
              className={`relative overflow-hidden rounded-lg transition-all duration-300 w-full sm:flex-1 ${
                activeTab === 'past' 
                  ? 'ring-4 ring-amber-400 ring-opacity-50 scale-105' 
                  : 'hover:scale-105 hover:shadow-lg'
              }`}
              style={{
                backgroundImage: 'url(/PastLessons.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                height: '80px'
              }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-lg transition-colors ${
                    activeTab === 'past' ? 'text-amber-200' : 'text-white'
                  }`}>
                    Past Lessons
                  </span>
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => handleAnimatedTabChange('upcoming')}
              className={`relative overflow-hidden rounded-lg transition-all duration-300 w-full sm:flex-1 ${
                activeTab === 'upcoming' 
                  ? 'ring-4 ring-amber-400 ring-opacity-50 scale-105' 
                  : 'hover:scale-105 hover:shadow-lg'
              }`}
              style={{
                backgroundImage: 'url(/PastLessons.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                height: '80px'
              }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-lg transition-colors ${
                    activeTab === 'upcoming' ? 'text-amber-200' : 'text-white'
                  }`}>
                    Upcoming Lessons
                  </span>
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => handleAnimatedTabChange('practice')}
              className={`relative overflow-hidden rounded-lg transition-all duration-300 w-full sm:flex-1 ${
                activeTab === 'practice' 
                  ? 'ring-4 ring-amber-400 ring-opacity-50 scale-105' 
                  : 'hover:scale-105 hover:shadow-lg'
              }`}
              style={{
                backgroundImage: 'url(/PastLessons.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                height: '80px'
              }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-lg transition-colors ${
                    activeTab === 'practice' ? 'text-amber-200' : 'text-white'
                  }`}>
                    Practice
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Floating Creature */}
        {selectedCreature && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
            <div className={`absolute transition-all duration-800 ${
              activeTab === 'past' ? 'left-[16.67%]' : 
              activeTab === 'upcoming' ? 'left-[50%]' : 
              'left-[83.33%]'
            } -top-28 transform -translate-x-1/2`}>
              <div className={`w-44 h-44 transition-all duration-500 ${
                creatureAnimation === 'hopping' ? 
                  hopDirection === 'right' ? 'animate-creature-arc-hop-right' :
                  hopDirection === 'left' ? 'animate-creature-arc-hop-left' :
                  hopDirection === 'center-right' ? 'animate-creature-arc-hop-center-right' :
                  hopDirection === 'center-left' ? 'animate-creature-arc-hop-center-left' :
                  'animate-creature-arc-hop-right' : // fallback
                creatureAnimation === 'wiggling' ? 'animate-creature-wiggle' : ''
              }`}>
                {/* Golden glow background */}
                <div className="absolute inset-0 rounded-full blur-sm" style={{
                  background: 'radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, rgba(252, 211, 77, 0.2) 50%, transparent 100%)'
                }}></div>
                <img
                  src={`/${selectedCreature}.png`}
                  alt="Selected Creature"
                  className="relative w-full h-full object-contain drop-shadow-lg"
                  onError={(e) => {
                    // Hide the creature if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        )}

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

      {/* Animal Familiar Popup */}
      <AnimalFamiliarPopup
        isOpen={showAnimalFamiliarPopup}
        onClose={handleAnimalFamiliarClose}
        onContinue={handleAnimalFamiliarContinue}
      />

      {/* Creature Selection Screen */}
      <CreatureSelectionScreen
        isOpen={showCreatureSelection}
        onClose={handleCreatureSelectionClose}
        onSelectCreature={handleCreatureSelection}
        isLoading={isSelectingCreature}
      />
    </main>
  );
}
