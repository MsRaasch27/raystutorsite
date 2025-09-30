"use client";

import { useState, useEffect } from "react";

type CEFRLevels = {
  understanding?: string;
  speaking?: string;
  reading?: string;
  writing?: string;
};

interface CEFRLevelsProps {
  userId: string;
}

const CEFR_DESCRIPTIONS: Record<string, string> = {
  A1: "Beginner - Can understand and use familiar everyday expressions",
  A2: "Elementary - Can communicate in simple and routine tasks",
  B1: "Intermediate - Can deal with most situations while traveling",
  B2: "Upper Intermediate - Can interact with fluency and spontaneity",
  C1: "Advanced - Can express ideas fluently and spontaneously",
  C2: "Proficient - Can understand virtually everything heard or read"
};

const CEFR_COLORS: Record<string, string> = {
  A1: "bg-red-100 text-red-800 border-red-200",
  A2: "bg-orange-100 text-orange-800 border-orange-200",
  B1: "bg-yellow-100 text-yellow-800 border-yellow-200",
  B2: "bg-green-100 text-green-800 border-green-200",
  C1: "bg-blue-100 text-blue-800 border-blue-200",
  C2: "bg-purple-100 text-purple-800 border-purple-200"
};

export function CEFRLevels({ userId }: CEFRLevelsProps) {
  const [cefrLevels, setCefrLevels] = useState<CEFRLevels | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCEFRLevels = async () => {
      try {
        setLoading(true);
        const apiUrl = `/api/users/${encodeURIComponent(userId)}/cefr-levels`;
        console.log('Fetching CEFR levels from:', apiUrl);
        
        const response = await fetch(apiUrl);
        console.log('CEFR levels response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('CEFR levels data received:', data);
          console.log('CEFR levels object:', data.cefrLevels);
          console.log('CEFR levels keys:', Object.keys(data.cefrLevels || {}));
          console.log('Has assessment:', data.hasAssessment);
          setCefrLevels(data.cefrLevels);
        } else {
          const errorText = await response.text();
          console.error('CEFR levels API error:', response.status, errorText);
          setError(`Failed to load CEFR levels: ${response.status}`);
        }
      } catch (err) {
        setError("Failed to load CEFR levels");
        console.error("Error fetching CEFR levels:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCEFRLevels();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📊 CEFR Levels</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-red-800 mb-2">📊 CEFR Levels</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!cefrLevels || Object.keys(cefrLevels).length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📊 CEFR Levels</h3>
        <div className="text-center py-4">
          <div className="text-4xl mb-2">📝</div>
          <p className="text-gray-600 mb-2">No CEFR levels available</p>
          <p className="text-sm text-gray-500">Complete an assessment to see your language proficiency levels</p>
        </div>
      </div>
    );
  }

  const categories = [
    { key: 'understanding', label: 'Understanding', icon: '👂' },
    { key: 'speaking', label: 'Speaking', icon: '🗣️' },
    { key: 'reading', label: 'Reading', icon: '📖' },
    { key: 'writing', label: 'Writing', icon: '✍️' }
  ];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
      <h3 className="text-xl font-bold text-gray-800 mb-4">📊 CEFR Language Proficiency Levels</h3>
      <p className="text-sm text-gray-600 mb-4">
        Your current levels based on the Common European Framework of Reference for Languages
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category) => {
          const level = cefrLevels[category.key as keyof CEFRLevels];
          
          return (
            <div key={category.key} className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-2">{category.icon}</span>
                <h4 className="font-semibold text-gray-800">{category.label}</h4>
              </div>
              
              {level ? (
                <div className="space-y-2">
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${CEFR_COLORS[level] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                    {level}
                  </div>
                  <p className="text-xs text-gray-600">
                    {CEFR_DESCRIPTIONS[level] || 'Level description not available'}
                  </p>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">
                  <span className="inline-block px-3 py-1 rounded-full bg-gray-100 border border-gray-200">
                    Not assessed
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 p-3 bg-blue-100 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>CEFR Levels:</strong> A1 (Beginner) → A2 (Elementary) → B1 (Intermediate) → B2 (Upper Intermediate) → C1 (Advanced) → C2 (Proficient)
        </p>
      </div>
    </div>
  );
}
