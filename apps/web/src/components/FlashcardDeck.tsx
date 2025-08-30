"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Flashcard } from "./Flashcard";

type VocabularyWord = {
  id: string;
  english: string;
  thai: string;
  partOfSpeech: string;
  example: string;
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

interface FlashcardDeckProps {
  userId: string;
}

export function FlashcardDeck({ userId }: FlashcardDeckProps) {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [progress, setProgress] = useState<Record<string, FlashcardProgress>>({});
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch vocabulary words and progress
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [wordsRes, progressRes] = await Promise.all([
          fetch(`/api/vocabulary?userId=${encodeURIComponent(userId)}`),
          fetch(`/api/users/${encodeURIComponent(userId)}/flashcards`),
        ]);

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
        <p className="text-sm text-gray-500">Please check your Google Sheets configuration.</p>
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
            {currentCardIndex + 1} of {dueCards.length} due
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentCardIndex + 1) / dueCards.length) * 100}%` }}
          ></div>
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

      {/* Current Card */}
      {currentCard && (
        <Flashcard
          word={currentCard}
          onRate={handleRate}
          progress={progress[currentCard.id]}
        />
      )}

      {/* Navigation */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setCurrentCardIndex(Math.max(0, currentCardIndex - 1))}
          disabled={currentCardIndex === 0}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        <button
          onClick={() => setCurrentCardIndex(Math.min(dueCards.length - 1, currentCardIndex + 1))}
          disabled={currentCardIndex === dueCards.length - 1}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
