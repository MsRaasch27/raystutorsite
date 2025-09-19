"use client";

import { useState } from "react";
import Link from "next/link";

type MasterLesson = {
  id: string;
  index: number;
  cefrLevel: string;
  unit: string;
  topic: string;
  learningActivity: string;
  vocabulary: string[];
  resources: string[];
  homework: string;
  teachingNotes: string;
  createdAt: string;
  updatedAt: string;
};

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [masterLessons, setMasterLessons] = useState<MasterLesson[]>([]);
  const [showLessons, setShowLessons] = useState(false);
  const [debugEventId, setDebugEventId] = useState('');
  const [debugResult, setDebugResult] = useState<{
    eventId: string;
    lessonDetailsExists: boolean;
    lessonDetails?: Record<string, unknown>;
    studentId?: string;
    studentLessons?: Record<string, unknown>[];
    message: string;
  } | null>(null);

  const initializeMasterLessons = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/admin/init-master-lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Successfully initialized ${data.count} master lessons!`
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to initialize master lessons'
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Network error occurred while initializing master lessons'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMasterLessons = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/master-lessons');
      const data = await response.json();

      if (response.ok) {
        setMasterLessons(data.lessons || []);
        setShowLessons(true);
        setMessage({
          type: 'success',
          text: `Loaded ${data.lessons?.length || 0} master lessons`
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to fetch master lessons'
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Network error occurred while fetching master lessons'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const initializeStudentLessons = async (studentEmail: string) => {
    if (!studentEmail.trim()) {
      setMessage({
        type: 'error',
        text: 'Please enter a student email address'
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(studentEmail.trim().toLowerCase())}/init-lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Successfully initialized ${data.count} lessons for student ${studentEmail}`
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to initialize student lessons'
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Network error occurred while initializing student lessons'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerManualCalendarSync = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/admin/manual-calendar-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Calendar sync completed! Found ${data.eventsFound} events, processed ${data.eventsProcessed}, populated ${data.lessonDetailsPopulated} lesson details.`
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to sync calendar'
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Network error occurred while syncing calendar'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const debugLessonDetails = async () => {
    if (!debugEventId.trim()) {
      setMessage({
        type: 'error',
        text: 'Please enter an event ID'
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch(`/api/debug/lesson-details/${encodeURIComponent(debugEventId.trim())}`);

      const data = await response.json();

      if (response.ok) {
        setDebugResult(data);
        setMessage({
          type: 'success',
          text: `Debug completed for event ${debugEventId}`
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to debug lesson details'
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Network error occurred while debugging'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🔧 Admin Panel - Master Lessons Management
          </h1>
          
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <div className="space-y-8">
            {/* Master Lessons Management */}
            <section className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                📚 Master Lessons Library
              </h2>
              <p className="text-gray-600 mb-6">
                Initialize or re-initialize the master lessons library. This will clear existing lessons and create new ones from the predefined template.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={initializeMasterLessons}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Initializing...' : 'Initialize Master Lessons'}
                </button>
                
                <button
                  onClick={fetchMasterLessons}
                  disabled={isLoading}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Loading...' : 'View Master Lessons'}
                </button>
              </div>
            </section>

            {/* Student Lessons Management */}
            <section className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                👨‍🎓 Student Lessons Management
              </h2>
              <p className="text-gray-600 mb-6">
                Initialize or re-initialize a specific student&apos;s lesson library from the master lessons.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  placeholder="Enter student email address"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  id="studentEmail"
                />
                <button
                  onClick={() => {
                    const emailInput = document.getElementById('studentEmail') as HTMLInputElement;
                    initializeStudentLessons(emailInput.value);
                  }}
                  disabled={isLoading}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Initializing...' : 'Initialize Student Lessons'}
                </button>
              </div>
            </section>

            {/* Calendar Sync Management */}
            <section className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                📅 Calendar Sync Management
              </h2>
              <p className="text-gray-600 mb-6">
                Manually trigger calendar sync to populate lesson details from student lesson libraries into upcoming appointments.
              </p>
              
              <button
                onClick={triggerManualCalendarSync}
                disabled={isLoading}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Syncing...' : 'Trigger Manual Calendar Sync'}
              </button>
            </section>

            {/* Debug Section */}
            <section className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                🔍 Debug Lesson Details
              </h2>
              <p className="text-gray-600 mb-6">
                Enter a calendar event ID to debug lesson details and see what data is stored.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Enter calendar event ID"
                  value={debugEventId}
                  onChange={(e) => setDebugEventId(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
                <button
                  onClick={debugLessonDetails}
                  disabled={isLoading}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Debugging...' : 'Debug Event'}
                </button>
              </div>

              {debugResult && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Debug Results:</h3>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto max-h-96">
                    {JSON.stringify(debugResult, null, 2)}
                  </pre>
                </div>
              )}
            </section>

            {/* Master Lessons Display */}
            {showLessons && masterLessons.length > 0 && (
              <section className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  📋 Current Master Lessons ({masterLessons.length})
                </h2>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {masterLessons.map((lesson) => (
                    <div key={lesson.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {lesson.index}. {lesson.topic}
                        </h3>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {lesson.cefrLevel}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Unit:</strong> {lesson.unit}</p>
                        <p><strong>Activity:</strong> {lesson.learningActivity}</p>
                        <p><strong>Vocabulary:</strong> {lesson.vocabulary.join(', ')}</p>
                        <p><strong>Resources:</strong> {lesson.resources.join(', ')}</p>
                        <p><strong>Homework:</strong> {lesson.homework}</p>
                        <p><strong>Teaching Notes:</strong> {lesson.teachingNotes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Instructions */}
            <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-3">
                📖 Instructions
              </h2>
              <div className="text-blue-800 space-y-2">
                <p><strong>1. Initialize Master Lessons:</strong> Click &quot;Initialize Master Lessons&quot; to set up the master lessons library with predefined content.</p>
                <p><strong>2. View Master Lessons:</strong> Click &quot;View Master Lessons&quot; to see all current master lessons in the system.</p>
                <p><strong>3. Initialize Student Lessons:</strong> Enter a student&apos;s email and click &quot;Initialize Student Lessons&quot; to create their personal lesson library.</p>
                <p><strong>4. Calendar Sync:</strong> Click &quot;Trigger Manual Calendar Sync&quot; to populate lesson details from student lesson libraries into upcoming appointments.</p>
                <p><strong>5. Debug:</strong> Use the debug section to check what lesson details exist for a specific calendar event ID.</p>
                <p><strong>6. Re-initialize:</strong> You can re-initialize at any time to update the lessons with new content.</p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link 
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
