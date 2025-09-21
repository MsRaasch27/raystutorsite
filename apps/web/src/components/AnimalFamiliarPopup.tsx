"use client";

import React from "react";

interface AnimalFamiliarPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export default function AnimalFamiliarPopup({ isOpen, onClose, onContinue }: AnimalFamiliarPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white text-center">
          <div className="text-4xl mb-3">🦄</div>
          <h2 className="text-2xl font-bold mb-2">Choose Your Animal Familiar!</h2>
          <p className="text-purple-100">
            Your magical learning companion awaits
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-700 text-lg mb-4">
              Congratulations on completing your first lesson! 🎉
            </p>
            <p className="text-gray-600">
              It&apos;s time to select your animal familiar - a magical creature that will accompany you on your English learning journey.
            </p>
          </div>

          {/* Magical elements */}
          <div className="flex justify-center space-x-4 mb-6">
            <div className="text-2xl animate-bounce">✨</div>
            <div className="text-2xl animate-bounce" style={{ animationDelay: '0.1s' }}>🌟</div>
            <div className="text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>✨</div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm text-center">
              <strong>What&apos;s an Animal Familiar?</strong><br />
              Your familiar will appear in your dashboard and help guide your learning progress. Each creature has its own personality and magical abilities!
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Purchase Subscription
          </button>
          <button
            onClick={onContinue}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold"
          >
            Purchase Subscription to Continue! ✨
          </button>
        </div>
      </div>
    </div>
  );
}
