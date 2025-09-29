"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Flashcard } from "./Flashcard";
import { useDailyImage } from "../hooks/useDailyImage";
import RewardAnimation from "./RewardAnimation";

type VocabularyWord = {
  id: string;
  english: string;
  [key: string]: string | undefined; // For native language field (dynamic key)
  createdAt: string;
  updatedAt: string;
};

type FlashcardProgress = {
  wordId: string;
  difficulty: "easy" | "medium" | "hard";
  interval: number;
  lastReviewed: string;
  nextReview: string;
  reviewCount: number;
  updatedAt: string;
};

type CustomIntervals = {
  easy: number;
  medium: number;
  hard: number;
};

type User = {
  id: string;
  name?: string | null;
  email: string;
  natLang?: string | null;
};

interface FlashcardDeckProps {
  userId: string;
  activeTab?: string; // Add activeTab prop to know where creature is positioned
  onRewardComplete?: () => void; // Callback when reward animation completes
  onReset?: () => void; // Callback when flashcard deck is reset
}

export function FlashcardDeck({ userId, activeTab = 'practice', onRewardComplete, onReset }: FlashcardDeckProps) {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [progress, setProgress] = useState<Record<string, FlashcardProgress>>({});
  const [user, setUser] = useState<User | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [showEnglishFirst, setShowEnglishFirst] = useState(true);
  const [isSimpleMode, setIsSimpleMode] = useState(false);
  const [currentCardFlipped, setCurrentCardFlipped] = useState(false);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [hasCompletedToday, setHasCompletedToday] = useState(false);
  const [cardsReviewedToday, setCardsReviewedToday] = useState(0);
  const [customIntervals, setCustomIntervals] = useState<CustomIntervals>({
    easy: 7,
    medium: 3,
    hard: 1,
  });
  const [forceAllCardsDue, setForceAllCardsDue] = useState(false);
  
  // Get daily background image
  const { imageUrl, prompt, source } = useDailyImage();

  // Load custom intervals
  useEffect(() => {
    const loadCustomIntervals = async () => {
      if (!userId) return;
      try {
        const response = await fetch(`/api/student/custom-intervals?userId=${encodeURIComponent(userId)}&t=${Date.now()}`);
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
          const stored = localStorage.getItem(`customIntervals_${userId}`);
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
  }, [userId]);

  // Reset daily counters at the start of each day
  useEffect(() => {
    const checkAndResetDailyCounters = () => {
      const today = new Date().toDateString();
      const lastReset = localStorage.getItem('flashcardLastReset');
      
      if (lastReset !== today) {
        setCardsReviewedToday(0);
        setHasCompletedToday(false);
        localStorage.setItem('flashcardLastReset', today);
        onReset?.(); // Notify parent component of daily reset
      }
    };

    checkAndResetDailyCounters();
  }, []); // Remove onReset from dependencies to prevent infinite re-runs

  // Detect mobile device and set simple mode as default
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     window.innerWidth <= 768;
    setIsSimpleMode(isMobile);
  }, []);

  // Check for review again flag on mount
  useEffect(() => {
    const useLocalOnce = localStorage.getItem('flashcardUseLocalProgressOnce');
    if (useLocalOnce) {
      console.log('Found review again flag, setting forceAllCardsDue to true');
      setForceAllCardsDue(true);
      localStorage.removeItem('flashcardUseLocalProgressOnce');
    }
  }, []);

  // Fetch vocabulary words and progress
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log("Fetching data for user:", userId);

        const [userRes, wordsRes, progressRes] = await Promise.all([
          fetch(`/api/users/${encodeURIComponent(userId)}?t=${Date.now()}`),
          fetch(`/api/vocabulary?userId=${encodeURIComponent(userId)}&t=${Date.now()}`),
          fetch(`/api/users/${encodeURIComponent(userId)}/flashcards?t=${Date.now()}`),
        ]);

        console.log("API responses:", {
          user: userRes.status,
          words: wordsRes.status,
          progress: progressRes.status
        });

        // Handle user data
        if (!userRes.ok) {
          console.error("User API error:", userRes.status, userRes.statusText);
          throw new Error(`Failed to fetch user data: ${userRes.status} ${userRes.statusText}`);
        }
        const userData = await userRes.json();
        setUser(userData);

        // Handle vocabulary data
        if (!wordsRes.ok) {
          console.error("Vocabulary API error:", wordsRes.status, wordsRes.statusText);
          throw new Error(`Failed to fetch vocabulary: ${wordsRes.status} ${wordsRes.statusText}`);
        }
        const wordsData = await wordsRes.json();
        setWords(wordsData.words || []);

        // Handle progress data (this might fail, but we can continue without it)
        if (!progressRes.ok) {
          console.warn("Progress API error:", progressRes.status, progressRes.statusText);
          setProgress({}); // Set empty progress if it fails
        } else {
          const progressData = await progressRes.json();
          const progressMap: Record<string, FlashcardProgress> = {};
          progressData.progress?.forEach((p: FlashcardProgress) => {
            progressMap[p.wordId] = p;
          });
          setProgress(progressMap);
        }

        console.log("Data loaded successfully:", {
          user: userData,
          wordsCount: wordsData.words?.length || 0,
          progressCount: Object.keys(progress).length
        });

      } catch (err) {
        console.error("Error fetching flashcard data:", err);
        setError(err instanceof Error ? err.message : "Failed to load flashcards. Please try again.");
        
        // Try to load from localStorage as fallback
        try {
          const storedWords = localStorage.getItem(`words_${userId}`);
          const storedProgress = localStorage.getItem(`progress_${userId}`);
          
          if (storedWords) {
            const words = JSON.parse(storedWords);
            setWords(words);
            console.log("Loaded words from localStorage:", words.length);
          }
          
          if (storedProgress) {
            const progress = JSON.parse(storedProgress);
            setProgress(progress);
            console.log("Loaded progress from localStorage");
          }
          
          if (storedWords || storedProgress) {
            setError("Loaded from local cache. Some features may be limited.");
          }
        } catch (localStorageError) {
          console.error("Error loading from localStorage:", localStorageError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Calculate which cards are due for review
  const dueCards = useMemo(() => {
    const now = new Date();
    console.log('dueCards calculation:', {
      wordsCount: words.length,
      progressCount: Object.keys(progress).length,
      forceAllCardsDue: forceAllCardsDue
    });
    
    const filtered = words.filter(word => {
      const wordProgress = progress[word.id];
      
      if (forceAllCardsDue) {
        // When forcing all cards due, only show cards that haven't been reviewed in this session
        // We can detect this by checking if the lastReviewed date is very recent (within last few minutes)
        if (!wordProgress) return true; // No progress = due
        
        const lastReviewed = new Date(wordProgress.lastReviewed);
        const timeSinceReview = now.getTime() - lastReviewed.getTime();
        const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        // If reviewed more than 5 minutes ago, it's due again
        return timeSinceReview > fiveMinutes;
      } else {
        // Normal logic: if no progress, card is due
        if (!wordProgress) return true;
        
        // Check if card is due for review
        const nextReview = new Date(wordProgress.nextReview);
        return nextReview <= now;
      }
    });
    
    console.log(forceAllCardsDue ? 'Force override due cards calculation:' : 'Normal due cards calculation:', {
      totalWords: words.length,
      dueCards: filtered.length,
      now: now.toISOString(),
      forceAllCardsDue: forceAllCardsDue
    });
    
    return filtered;
  }, [words, progress, forceAllCardsDue]);

  // Get current card (not used in scattered layout but kept for compatibility)
  // const currentCard = dueCards[currentCardIndex];

  // Handle card activation (bring to front)
  const handleCardActivate = useCallback((wordId: string) => {
    setActiveCardId(wordId);
  }, []);

  // Simple mode navigation handlers
  const handleNextCard = useCallback(() => {
    setCurrentCardIndex((prev) => (prev + 1) % dueCards.length);
    setCurrentCardFlipped(false); // Reset flip state when moving to next card
  }, [dueCards.length]);

  const handlePrevCard = useCallback(() => {
    setCurrentCardIndex((prev) => (prev - 1 + dueCards.length) % dueCards.length);
    setCurrentCardFlipped(false); // Reset flip state when moving to previous card
  }, [dueCards.length]);

  // Function to reset daily review and allow reviewing again
  const handleResetDailyReview = useCallback(() => {
    console.log('Review Again button clicked - resetting daily review');
    setCardsReviewedToday(0);
    setHasCompletedToday(false);
    // Clear the daily reset flag to allow immediate review
    localStorage.removeItem('flashcardLastReset');
    // Force all cards to be due for this session
    setForceAllCardsDue(true);
    console.log('Set forceAllCardsDue to true');
    console.log('Cleared localStorage flashcardLastReset');
    onReset?.(); // Notify parent component
  }, [onReset]);

  // Handle card rating
  const handleRate = useCallback(async (wordId: string, difficulty: "easy" | "medium" | "hard") => {
    try {
        const response = await fetch(`/api/users/${encodeURIComponent(userId)}/flashcards/${wordId}/rate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ difficulty }),
        });

      if (!response.ok) {
        throw new Error("Failed to save progress");
      }

      // Update local progress state
      const now = new Date();
      const currentProgress = progress[wordId];
      
      // Calculate next review date based on custom intervals
      let nextReviewDays = customIntervals.hard; // Default for hard
      if (difficulty === "easy") {
        nextReviewDays = customIntervals.easy;
      } else if (difficulty === "medium") {
        nextReviewDays = customIntervals.medium;
      } else {
        nextReviewDays = customIntervals.hard;
      }

      const nextReview = new Date(now.getTime() + nextReviewDays * 24 * 60 * 60 * 1000);

      setProgress(prev => ({
        ...prev,
        [wordId]: {
          wordId,
          difficulty,
          interval: nextReviewDays,
          lastReviewed: now.toISOString(),
          nextReview: nextReview.toISOString(),
          reviewCount: (currentProgress?.reviewCount || 0) + 1,
          updatedAt: now.toISOString(),
        },
      }));

      // Increment the counter for cards reviewed today
      setCardsReviewedToday(prev => prev + 1);

      // Move to next card
      if (isSimpleMode) {
        setCurrentCardFlipped(false); // Reset flip state before moving to next card
        handleNextCard();
      } else {
        // Remove the card from active cards (it will be scheduled for later review)
        setActiveCardId(null);
      }
    } catch (err) {
      console.error("Error rating card:", err);
      throw err;
    }
  }, [userId, progress, isSimpleMode, handleNextCard, customIntervals]);

  // Check if all due cards are completed and trigger reward animation
  useEffect(() => {
    console.log('Reward animation check:', {
      wordsLength: words.length,
      hasCompletedToday,
      isLoading,
      cardsReviewedToday,
      dueCardsLength: dueCards.length,
      shouldTrigger: words.length > 0 && 
                    !hasCompletedToday && 
                    !isLoading && 
                    cardsReviewedToday > 0 && 
                    dueCards.length === 0
    });

    // Trigger reward animation if:
    // 1. We have words loaded
    // 2. We haven't already shown the animation today
    // 3. We're not loading
    // 4. We have reviewed at least one card today
    // 5. There are no more due cards (all have been reviewed)
    if (words.length > 0 && 
        !hasCompletedToday && 
        !isLoading && 
        cardsReviewedToday > 0 && 
        dueCards.length === 0) {
      console.log('🎉 Triggering reward animation!');
      setShowRewardAnimation(true);
      setHasCompletedToday(true);
    }
  }, [dueCards.length, words.length, hasCompletedToday, isLoading, cardsReviewedToday]);

  // Handle reward animation completion
  const handleRewardComplete = useCallback(() => {
    setShowRewardAnimation(false);
    onRewardComplete?.(); // Notify parent component
  }, [onRewardComplete]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalWords = words.length;
    const reviewedWords = Object.keys(progress).length;
    const dueWords = dueCards.length;
    const masteredWords = Object.values(progress).filter(p => p.difficulty === "easy" && p.reviewCount >= 3).length;

    return {
      total: totalWords,
      reviewed: reviewedWords,
      due: dueWords,
      mastered: masteredWords,
      progress: totalWords > 0 ? Math.round((reviewedWords / totalWords) * 100) : 0,
    };
  }, [words, progress, dueCards]);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading flashcards...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <p className="text-red-600 mb-4">{error}</p>
        <div className="space-y-3">
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mr-3"
          >
            🔄 Try Again
          </button>
          <button
            onClick={() => {
              // Clear localStorage and try again
              localStorage.removeItem(`words_${userId}`);
              localStorage.removeItem(`progress_${userId}`);
              window.location.reload();
            }}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            🗑️ Clear Cache & Retry
          </button>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          <p>If the problem persists, please check:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Your internet connection</li>
            <li>Browser console for error details (F12)</li>
            <li>Try refreshing the page</li>
          </ul>
        </div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">📚</div>
        <p className="text-gray-600 mb-4">No vocabulary words available.</p>
        <p className="text-sm text-gray-500">Add some vocabulary words to get started with flashcards.</p>
      </div>
    );
  }

  if (dueCards.length === 0) {
    return (
      <>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">All caught up!</h3>
          <p className="text-gray-600 mb-6">You&apos;ve reviewed all your flashcards for today.</p>
          
          {/* Reset Button */}
          <div className="flex flex-col items-center space-y-3">
            <p className="text-sm text-gray-500">Want to review again?</p>
            <button
              onClick={handleResetDailyReview}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🔄 Review Again
            </button>
            <p className="text-xs text-gray-400 max-w-sm">
              This will reset your daily review and allow you to practice your flashcards again
            </p>
          </div>
        </div>
        
        {/* Reward Animation - moved here so it can show even when all cards are done */}
        <RewardAnimation
          isVisible={showRewardAnimation}
          onComplete={handleRewardComplete}
          activeTab={activeTab}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Vocabulary Builder</h3>
          <span className="text-sm text-gray-600">
            {dueCards.length} cards due for review
          </span>
        </div>
        
        {/* Toggle Switches - Horizontal Layout */}
        <div className="flex items-center justify-center gap-8 mb-3">
          {/* Language Toggle Switch */}
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${!showEnglishFirst ? 'text-blue-600' : 'text-gray-500'}`}>
              {user?.natLang || 'Native Language'}
            </span>
            <button
              onClick={() => setShowEnglishFirst(!showEnglishFirst)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                showEnglishFirst ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showEnglishFirst ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${showEnglishFirst ? 'text-blue-600' : 'text-gray-500'}`}>
              English
            </span>
          </div>
          
          {/* Interface Toggle Switch */}
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${!isSimpleMode ? 'text-purple-600' : 'text-gray-500'}`}>
              Scattered
            </span>
            <button
              onClick={() => setIsSimpleMode(!isSimpleMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                isSimpleMode ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isSimpleMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isSimpleMode ? 'text-purple-600' : 'text-gray-500'}`}>
              Simple
            </span>
          </div>
        </div>
        
      </div>

      {/* Card Interface */}
      {isSimpleMode ? (
        /* Simple Mode - Single Card */
        <div className="flex flex-col items-center space-y-6">
          {/* Card Counter */}
          <div className="text-center">
            <span className="text-lg font-semibold text-gray-700">
              Card {currentCardIndex + 1} of {dueCards.length}
            </span>
          </div>
          
          {/* Single Card */}
          {dueCards.length > 0 && (
            <div className="w-full max-w-2xl mx-auto">
              <Flashcard
                word={dueCards[currentCardIndex]}
                user={user!}
                onRate={handleRate}
                progress={progress[dueCards[currentCardIndex].id]}
                showEnglishFirst={showEnglishFirst}
                isSimpleMode={true}
                onFlip={(isFlipped) => {
                  // Track if card is flipped to show rating buttons
                  setCurrentCardFlipped(isFlipped);
                }}
              />
            </div>
          )}
          
          {/* Rating buttons - only show when card is flipped */}
          {currentCardFlipped && dueCards.length > 0 && (
            <div className="flex justify-center gap-3 mb-4">
              <button
                onClick={() => handleRate(dueCards[currentCardIndex].id, "hard")}
                className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors"
              >
                ❌ Hard
              </button>
              <button
                onClick={() => handleRate(dueCards[currentCardIndex].id, "medium")}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
              >
                ⚡ Medium
              </button>
              <button
                onClick={() => handleRate(dueCards[currentCardIndex].id, "easy")}
                className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors"
              >
                ✅ Easy
              </button>
            </div>
          )}
          
          {/* Navigation Controls */}
          <div className="flex gap-4">
            <button
              onClick={handlePrevCard}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={handleNextCard}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      ) : (
        /* Scattered Mode - Multiple Cards with Background */
        <div 
          className="relative h-96 overflow-visible rounded-lg p-12"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="relative w-full h-full">
            {dueCards.map((card, index) => {
              // Generate random positions and rotations for each card
              // Keep cards more centered to avoid edge cutoff issues
              const randomX = Math.random() * 50 + 20; // 20% to 70% from left
              const randomY = Math.random() * 50 + 20; // 20% to 70% from top
              const randomRotation = (Math.random() - 0.5) * 60; // -30 to +30 degrees
              const isActive = activeCardId === card.id;
              
              return (
                <div
                  key={card.id}
                  className="absolute transition-all duration-300 ease-in-out"
                  style={{
                    left: `${randomX}%`,
                    top: `${randomY}%`,
                    transform: `rotate(${randomRotation}deg)`,
                    zIndex: isActive ? 1000 : index + 1, // High z-index when active
                  }}
                >
                  <Flashcard
                    word={card}
                    user={user!}
                    onRate={handleRate}
                    progress={progress[card.id]}
                    onActivate={handleCardActivate}
                    showEnglishFirst={showEnglishFirst}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Reward Animation */}
      <RewardAnimation
        isVisible={showRewardAnimation}
        onComplete={handleRewardComplete}
        activeTab={activeTab}
      />
    </div>
  );
}
