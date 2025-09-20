"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Flashcard } from "./Flashcard";

type VocabularyWord = {
  id: string;
  english: string;
  [key: string]: string | undefined; // For native language field (dynamic key)
  example: string;
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

type User = {
  id: string;
  name?: string | null;
  email: string;
  natLang?: string | null;
};

interface FlashcardDeckProps {
  userId: string;
}

export function FlashcardDeck({ userId }: FlashcardDeckProps) {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [progress, setProgress] = useState<Record<string, FlashcardProgress>>({});
  const [user, setUser] = useState<User | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  // Fetch vocabulary words and progress
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [userRes, wordsRes, progressRes] = await Promise.all([
          fetch(`/api/users/${encodeURIComponent(userId)}`),
          fetch(`/api/vocabulary?userId=${encodeURIComponent(userId)}`),
          fetch(`/api/users/${encodeURIComponent(userId)}/flashcards`),
        ]);

        if (!userRes.ok) {
          throw new Error("Failed to fetch user data");
        }
        const userData = await userRes.json();
        setUser(userData);

        if (!wordsRes.ok) {
          throw new Error("Failed to fetch vocabulary");
        }

        const wordsData = await wordsRes.json();
        setWords(wordsData.words || []);

        if (progressRes.ok) {
          const progressData = await progressRes.json();
          const progressMap: Record<string, FlashcardProgress> = {};
          progressData.progress?.forEach((p: FlashcardProgress) => {
            progressMap[p.wordId] = p;
          });
          setProgress(progressMap);
        }
      } catch (err) {
        console.error("Error fetching flashcard data:", err);
        setError("Failed to load flashcards. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Calculate which cards are due for review
  const dueCards = useMemo(() => {
    const now = new Date();
    return words.filter(word => {
      const wordProgress = progress[word.id];
      
      // If no progress, card is due
      if (!wordProgress) return true;
      
      // Check if card is due for review
      const nextReview = new Date(wordProgress.nextReview);
      return nextReview <= now;
    });
  }, [words, progress]);

  // Get current card
  const currentCard = dueCards[currentCardIndex];

  // Handle card activation (bring to front)
  const handleCardActivate = useCallback((wordId: string) => {
    setActiveCardId(wordId);
  }, []);

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
      
      // Calculate next review date based on spaced repetition
      let nextReviewDays = 1; // Default for hard
      if (difficulty === "easy") {
        nextReviewDays = currentProgress ? Math.min(currentProgress.interval * 2, 365) : 7;
      } else if (difficulty === "medium") {
        nextReviewDays = currentProgress ? Math.min(currentProgress.interval * 1.5, 30) : 3;
      } else {
        nextReviewDays = 1; // Hard - review tomorrow
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

      // Move to next card
      if (currentCardIndex < dueCards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
      } else {
        // All cards reviewed, reset to beginning
        setCurrentCardIndex(0);
      }
    } catch (err) {
      console.error("Error rating card:", err);
      throw err;
    }
  }, [userId, progress, currentCardIndex, dueCards.length]);

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
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
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
      <div className="text-center py-8">
        <div className="text-4xl mb-4">🎉</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">All caught up!</h3>
        <p className="text-gray-600 mb-4">You&apos;ve reviewed all your flashcards for today.</p>
        <div className="bg-green-50 rounded-lg p-4 max-w-md mx-auto">
          <h4 className="font-semibold text-green-800 mb-2">Your Progress</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-green-600 font-semibold">{stats.mastered}</span>
              <span className="text-gray-600"> words mastered</span>
            </div>
            <div>
              <span className="text-blue-600 font-semibold">{stats.progress}%</span>
              <span className="text-gray-600"> complete</span>
            </div>
          </div>
        </div>
      </div>
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
        
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="text-center">
            <div className="font-semibold text-purple-600">{stats.total}</div>
            <div className="text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-600">{stats.reviewed}</div>
            <div className="text-gray-500">Reviewed</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-orange-600">{stats.due}</div>
            <div className="text-gray-500">Due</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-green-600">{stats.mastered}</div>
            <div className="text-gray-500">Mastered</div>
          </div>
        </div>
      </div>

      {/* Scattered Card Pile */}
      <div className="relative h-96 overflow-visible bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-12">
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
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
