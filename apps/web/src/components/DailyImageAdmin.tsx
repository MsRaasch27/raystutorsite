"use client";

import { useState } from 'react';

interface DailyImageAdminProps {
  onClose: () => void;
}

export function DailyImageAdmin({ onClose }: DailyImageAdminProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setMessage('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/daily-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Daily image updated successfully!');
        setPrompt('');
        // Refresh the page to show the new image
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage(data.error || 'Failed to update daily image');
      }
    } catch (error) {
      console.error('Error updating daily image:', error);
      setMessage('Failed to update daily image');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Set Daily Image Prompt</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              AI Image Prompt
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate for today's flashcard background..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              disabled={isLoading}
            />
          </div>

          <div className="text-sm text-gray-600">
            <p className="mb-2">Examples:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>&ldquo;A magical forest with glowing mushrooms and fairy lights&rdquo;</li>
              <li>&ldquo;A cozy wizard&apos;s study with floating books and potions&rdquo;</li>
              <li>&ldquo;A mystical mountain peak with ancient ruins&rdquo;</li>
            </ul>
          </div>

          {message && (
            <div className={`p-3 rounded-md text-sm ${
              message.includes('successfully') 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Generating...' : 'Generate Image'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
