"use client";

import { useState, useEffect } from "react";

type StudentImagePromptProps = {
  studentId: string;
  studentName: string;
};

export default function StudentImagePrompt({ studentId, studentName }: StudentImagePromptProps) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Load existing prompt on component mount
  useEffect(() => {
    const loadExistingPrompt = async () => {
      try {
        const response = await fetch(`/api/student-image-prompt?studentId=${encodeURIComponent(studentId)}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
          setPrompt(data.customImagePrompt || '');
          setLastUpdated(data.imagePromptUpdatedAt || null);
        }
      } catch (error) {
        console.error('Error loading existing prompt:', error);
      } finally {
        setIsLoadingPrompt(false);
      }
    };

    loadExistingPrompt();
  }, [studentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setMessage({ type: 'error', text: 'Please enter a prompt' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/student-image-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          prompt: prompt.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Successfully set custom image prompt for ${studentName}! A new image will be generated for tomorrow.`
        });
        setLastUpdated(new Date().toISOString());
        // Don't clear the prompt - keep it visible for editing
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to set image prompt'
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Network error occurred while setting image prompt'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
        🎨 Custom Flashcard Background
      </h4>
      <p className="text-sm text-gray-600 mb-4">
        Set a custom AI prompt to generate unique daily background images for {studentName}&apos;s flashcard deck.
      </p>
      
      {isLoadingPrompt && (
        <div className="text-sm text-gray-500 mb-4">Loading current prompt...</div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor={`prompt-${studentId}`} className="block text-sm font-medium text-gray-700 mb-1">
            AI Image Prompt
          </label>
          <textarea
            id={`prompt-${studentId}`}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A magical forest with glowing mushrooms and fireflies, or A serene Japanese garden with cherry blossoms"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 bg-white"
            rows={3}
            disabled={isLoading}
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isLoading ? 'Updating Prompt...' : (prompt ? 'Update Custom Prompt' : 'Set Custom Prompt')}
        </button>
      </form>

      {message && (
        <div className={`mt-3 p-3 rounded-lg text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500">
        <p><strong>Tip:</strong> Be descriptive! The AI will generate images based on your prompt. Examples:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>&ldquo;A cozy library with floating books and warm candlelight&rdquo;</li>
          <li>&ldquo;A mystical mountain landscape with aurora borealis&rdquo;</li>
          <li>&ldquo;A peaceful beach at sunset with gentle waves&rdquo;</li>
        </ul>
      </div>
    </div>
  );
}
