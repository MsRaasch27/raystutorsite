"use client";

import { useState, useCallback } from "react";

type VocabularyWord = {
  id: string;
  english: string;
  [key: string]: string | undefined; // For native language field (dynamic key)
  example: string;
  createdAt: string;
  updatedAt: string;
};

type User = {
  id: string;
  name?: string | null;
  email: string;
  natLang?: string | null;
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

interface FlashcardProps {
  word: VocabularyWord;
  user: User;
  onRate: (wordId: string, difficulty: "easy" | "medium" | "hard") => Promise<void>;
  progress?: FlashcardProgress;
}

export function Flashcard({ word, user, onRate, progress }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isRating, setIsRating] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Get the native language value from the word
  const getNativeLanguageValue = useCallback(() => {
    const nativeLangKey = user?.natLang || "nativeLanguage";
    return word[nativeLangKey] || "";
  }, [word, user?.natLang]);

  const handleFlip = useCallback(() => {
    setIsFlipped(!isFlipped);
  }, [isFlipped]);

  const handleRate = useCallback(async (difficulty: "easy" | "medium" | "hard") => {
    setIsRating(true);
    try {
      await onRate(word.id, difficulty);
      // Reset card for next review
      setIsFlipped(false);
    } catch (error) {
      console.error("Error rating card:", error);
    } finally {
      setIsRating(false);
    }
  }, [word.id, onRate]);

  const handleTextToSpeech = useCallback(async (text: string, language: string = "en-US") => {
    if (isPlayingAudio) return;
    
    setIsPlayingAudio(true);
    try {
      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate audio");
      }

      const data = await response.json();
      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))],
        { type: "audio/mp3" }
      );
      const url = URL.createObjectURL(audioBlob);

      const audio = new Audio(url);
      audio.onended = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(url);
      };
      await audio.play();
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlayingAudio(false);
    }
  }, [isPlayingAudio]);

  const getDifficultyColor = (difficulty: "easy" | "medium" | "hard") => {
    switch (difficulty) {
      case "easy": return "text-green-600 bg-green-100";
      case "medium": return "text-yellow-600 bg-yellow-100";
      case "hard": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Flashcard */}
      <div 
        className={`relative w-full h-64 cursor-pointer perspective-1000 ${
          isRating ? "pointer-events-none opacity-75" : ""
        }`}
        onClick={handleFlip}
      >
        <div 
          className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front of card */}
          <div className="absolute inset-0 w-full h-full backface-hidden">
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 flex flex-col justify-center items-center text-white relative">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">{word.english}</h3>
                <p className="text-blue-200 text-xs italic">Tap to reveal answer</p>
              </div>
              
              {/* Audio button for English */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTextToSpeech(word.english, "en-US");
                }}
                disabled={isPlayingAudio}
                className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all duration-200 disabled:opacity-50"
                title="Listen to pronunciation"
              >
                {isPlayingAudio ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.5 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.5l4.883-3.793a1 1 0 011.617.793zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Back of card */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
            <div className="w-full h-full bg-gradient-to-br from-green-500 to-teal-600 rounded-xl shadow-lg p-6 flex flex-col justify-center items-center text-white relative">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">{getNativeLanguageValue()}</h3>
                <p className="text-green-100 text-sm mb-2">{word.english}</p>
                {word.example && (
                  <p className="text-green-200 text-xs italic mb-4">&ldquo;{word.example}&rdquo;</p>
                )}
                <p className="text-green-200 text-xs">Tap to flip back</p>
              </div>
              
              {/* Audio button for native language */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const nativeValue = getNativeLanguageValue();
                  if (nativeValue) {
                    // Use a generic language code for now, could be enhanced to detect specific languages
                    handleTextToSpeech(nativeValue, "en-US");
                  }
                }}
                disabled={isPlayingAudio}
                className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all duration-200 disabled:opacity-50"
                title={`Listen to ${user?.natLang || "native language"} pronunciation`}
              >
                {isPlayingAudio ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.5 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.5l4.883-3.793a1 1 0 011.617.793zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              
              {/* Audio button for English (on back) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTextToSpeech(word.english, "en-US");
                }}
                disabled={isPlayingAudio}
                className="absolute top-4 left-4 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all duration-200 disabled:opacity-50"
                title="Listen to English pronunciation"
              >
                {isPlayingAudio ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.5 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.5l4.883-3.793a1 1 0 011.617.793zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      {progress && (
        <div className="mt-4 text-center">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(progress.difficulty)}`}>
            Last rated: {progress.difficulty} ({progress.reviewCount} reviews)
          </span>
        </div>
      )}

      {/* Rating buttons - only show when card is flipped */}
      {isFlipped && (
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => handleRate("hard")}
            disabled={isRating}
            className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ❌ Hard
          </button>
          <button
            onClick={() => handleRate("medium")}
            disabled={isRating}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ⚡ Medium
          </button>
          <button
            onClick={() => handleRate("easy")}
            disabled={isRating}
            className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Easy
          </button>
        </div>
      )}

      {/* Loading indicator */}
      {isRating && (
        <div className="mt-4 text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600 mt-2">Saving progress...</p>
        </div>
      )}
    </div>
  );
}
