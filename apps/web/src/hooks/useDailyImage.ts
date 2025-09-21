import { useState, useEffect } from 'react';

interface DailyImageData {
  imageUrl: string;
  prompt: string;
  source: 'ai-generated' | 'fallback';
  date: string;
  generatedAt: string;
}

interface UseDailyImageReturn {
  imageUrl: string;
  prompt: string;
  source: 'ai-generated' | 'fallback';
  isLoading: boolean;
  error: string | null;
  refreshImage: () => Promise<void>;
}

export function useDailyImage(): UseDailyImageReturn {
  const [imageData, setImageData] = useState<DailyImageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDailyImage = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/daily-image');
      
      if (!response.ok) {
        throw new Error('Failed to fetch daily image');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setImageData({
          imageUrl: data.imageUrl,
          prompt: data.prompt,
          source: data.source,
          date: data.date,
          generatedAt: data.generatedAt
        });
      } else {
        throw new Error(data.error || 'Failed to get daily image');
      }
    } catch (err) {
      console.error('Error fetching daily image:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Set fallback image
      setImageData({
        imageUrl: '/fujimoto.png',
        prompt: 'A magical learning environment',
        source: 'fallback',
        date: new Date().toISOString().split('T')[0],
        generatedAt: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshImage = async () => {
    await fetchDailyImage();
  };

  useEffect(() => {
    fetchDailyImage();
  }, []);

  return {
    imageUrl: imageData?.imageUrl || '/fujimoto.png',
    prompt: imageData?.prompt || 'A magical learning environment',
    source: imageData?.source || 'fallback',
    isLoading,
    error,
    refreshImage
  };
}
