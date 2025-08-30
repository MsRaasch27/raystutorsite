"use client";

import { useState, useEffect } from "react";

interface VocabularySettingsProps {
  userId: string;
  currentSheetId?: string | null;
  onSheetIdUpdate?: (sheetId: string) => void;
}

export function VocabularySettings({ userId, currentSheetId, onSheetIdUpdate }: VocabularySettingsProps) {
  const [sheetId, setSheetId] = useState(currentSheetId || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setSheetId(currentSheetId || "");
  }, [currentSheetId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sheetId.trim()) {
      setError("Please enter a Google Sheet ID");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/users/${encodeURIComponent(userId)}/vocabulary-sheet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vocabularySheetId: sheetId.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update vocabulary sheet");
      }

      setSuccess("Vocabulary sheet updated successfully!");
      onSheetIdUpdate?.(sheetId.trim());
    } catch (err) {
      console.error("Error updating vocabulary sheet:", err);
      setError(err instanceof Error ? err.message : "Failed to update vocabulary sheet");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/users/${encodeURIComponent(userId)}/vocabulary-sheet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vocabularySheetId: "" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reset vocabulary sheet");
      }

      setSheetId("");
      setSuccess("Reset to default vocabulary sheet!");
      onSheetIdUpdate?.("");
    } catch (err) {
      console.error("Error resetting vocabulary sheet:", err);
      setError(err instanceof Error ? err.message : "Failed to reset vocabulary sheet");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">📚 Vocabulary Settings</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="sheetId" className="block text-sm font-medium text-gray-700 mb-2">
            Google Sheet ID
          </label>
          <input
            type="text"
            id="sheetId"
            value={sheetId}
            onChange={(e) => setSheetId(e.target.value)}
            placeholder="Enter your Google Sheet ID (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to use the default vocabulary sheet, or enter your own Google Sheet ID for personalized vocabulary.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Updating..." : "Update Sheet"}
          </button>
          
          {currentSheetId && (
            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset to Default
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h4 className="font-medium text-blue-800 mb-2">How to set up your vocabulary sheet:</h4>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. Create a new Google Sheet with columns: English | Thai | Part of Speech | Example</li>
          <li>2. Add your vocabulary words (skip the header row)</li>
          <li>3. Share the sheet with your teacher&apos;s service account</li>
          <li>4. Copy the Sheet ID from the URL (between /d/ and /edit)</li>
          <li>5. Paste it above and click &quot;Update Sheet&quot;</li>
        </ol>
      </div>
    </div>
  );
}
