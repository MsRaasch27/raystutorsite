"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth, isTeacher } from "@/lib/auth";
import { useRouter } from "next/navigation";

type MasterLesson = {
  id: string;
  index: number;
  cefrLevel: string;
  unit: string;
  topic: string;
  learningActivity: string;
  vocabulary: string[];
  powerpoint: string[];
  grammarConcept: string;
  playlist: string;
  homework: string;
  teachingNotes: string;
  createdAt: string;
  updatedAt: string;
};

export default function AdminPage() {
  console.log('AdminPage component is loading...');
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [masterLessons, setMasterLessons] = useState<MasterLesson[]>([]);
  const [showLessons, setShowLessons] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [editingLesson, setEditingLesson] = useState<MasterLesson | null>(null);
  const [debugEventId, setDebugEventId] = useState('');
  const [debugResult, setDebugResult] = useState<{
    eventId: string;
    lessonDetailsExists: boolean;
    lessonDetails?: Record<string, unknown>;
    studentId?: string;
    studentLessons?: Record<string, unknown>[];
    message: string;
  } | null>(null);
  const [importSheetUrl, setImportSheetUrl] = useState('');
  const [showImportForm, setShowImportForm] = useState(false);

  // Check authentication and authorization
  useEffect(() => {
    console.log('Admin page auth check:', { loading, user, userEmail: user?.email, isTeacher: isTeacher(user) });
    
    // Only check auth after loading is complete
    if (!loading) {
      if (!user) {
        console.log('No user found, redirecting to home');
        router.push('/');
        return;
      }
      
      // Only allow teachers to access admin
      if (!isTeacher(user)) {
        console.log('User is not a teacher, redirecting to teacher dashboard:', { userEmail: user.email, isTeacher: isTeacher(user) });
        router.push('/teacher');
        return;
      }
      
      console.log('User is authorized for admin access');
    }
  }, [user, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authorized (redirect will happen)
  if (!user || !isTeacher(user)) {
    console.log('Admin page render check failed:', { user, userEmail: user?.email, isTeacher: isTeacher(user) });
    return null;
  }
  
  console.log('Admin page rendering for authorized user:', user.email);

  const initializeMasterLessons = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/admin/initialize-master-lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Master lessons initialized successfully!'
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

  const fetchMasterLessons = async (page: number = 1) => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch(`/api/master-lessons?page=${page}&limit=${pagination.limit}`);
      const data = await response.json();

      if (response.ok) {
        setMasterLessons(data.masterLessons || []);
        setPagination(data.pagination || pagination);
        setShowLessons(true);
        setMessage({
          type: 'success',
          text: `Loaded ${data.masterLessons?.length || 0} master lessons (${data.pagination?.totalCount || 0} total)`
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
        text: 'Please enter a student email'
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/admin/initialize-student-lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentEmail: studentEmail.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Student lessons initialized successfully for ${studentEmail}!`
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

  const triggerCalendarSync = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/admin/trigger-calendar-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Calendar sync triggered successfully!'
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to trigger calendar sync'
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Network error occurred while triggering calendar sync'
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
      const response = await fetch(`/api/admin/debug-lesson-details/${debugEventId.trim()}`);
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

  const updateMasterLesson = async (lessonId: string, updatedData: Partial<MasterLesson>) => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch(`/api/master-lessons/${lessonId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Master lesson updated successfully!'
        });
        setEditingLesson(null);
        // Refresh the current page
        await fetchMasterLessons(pagination.page);
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to update master lesson'
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Network error occurred while updating master lesson'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const importMasterLessonsFromSheet = async () => {
    if (!importSheetUrl.trim()) {
      setMessage({
        type: 'error',
        text: 'Please enter a Google Sheets URL'
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/admin/import-master-lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sheetUrl: importSheetUrl.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Successfully imported ${data.count} master lessons from Google Sheet!${data.errors ? ` (${data.errors.length} rows had errors)` : ''}`
        });
        setImportSheetUrl('');
        setShowImportForm(false);
        
        // Refresh the master lessons list
        await fetchMasterLessons();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to import master lessons from Google Sheet'
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Network error occurred while importing master lessons'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🎓 Master Lesson Library Admin
              </h1>
              <p className="text-gray-600">
                Manage master lessons and initialize student lesson libraries
              </p>
            </div>

            {message && (
              <div className={`mb-6 p-4 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            <div className="space-y-8">
              {/* Master Lessons Management */}
              <section className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  📚 Master Lessons Management
                </h2>
                
                <div className="space-y-4">
                  {/* Initialize Master Lessons */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Initialize with Template</h3>
                    <p className="text-gray-600 mb-3 text-sm">
                      Initialize the master lessons library with predefined template lessons.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={initializeMasterLessons}
                        disabled={isLoading}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Initializing...' : 'Initialize with Template'}
                      </button>
                      
                      <button
                        onClick={() => fetchMasterLessons(1)}
                        disabled={isLoading}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Loading...' : 'View Current Lessons'}
                      </button>
                    </div>
                  </div>

                  {/* Google Sheets Import */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Import from Google Sheet</h3>
                    <p className="text-gray-600 mb-3 text-sm">
                      Import master lessons from a Google Sheet. The sheet should have columns: CEFR Level, Unit, Topic, Learning Activity, Vocabulary, Powerpoint, Grammar Concept, Playlist, Homework, Teaching Notes. (Index column is optional - will be auto-generated)
                    </p>
                    
                    {!showImportForm ? (
                      <button
                        onClick={() => setShowImportForm(true)}
                        disabled={isLoading}
                        className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Import from Google Sheet
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label htmlFor="sheetUrl" className="block text-sm font-medium text-gray-700 mb-1">
                            Google Sheets URL
                          </label>
                          <input
                            id="sheetUrl"
                            type="url"
                            placeholder="https://docs.google.com/spreadsheets/d/..."
                            value={importSheetUrl}
                            onChange={(e) => setImportSheetUrl(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={importMasterLessonsFromSheet}
                            disabled={isLoading || !importSheetUrl.trim()}
                            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? 'Importing...' : 'Import Lessons'}
                          </button>
                          <button
                            onClick={() => {
                              setShowImportForm(false);
                              setImportSheetUrl('');
                            }}
                            disabled={isLoading}
                            className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Student Lessons Management */}
              <section className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  👥 Student Lessons Management
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="studentEmail" className="block text-sm font-medium text-gray-700 mb-1">
                      Student Email
                    </label>
                    <input
                      id="studentEmail"
                      type="email"
                      placeholder="student@example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const emailInput = document.getElementById('studentEmail') as HTMLInputElement;
                      initializeStudentLessons(emailInput.value);
                    }}
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Initializing...' : 'Initialize Student Lessons'}
                  </button>
                </div>
              </section>

              {/* Calendar Sync */}
              <section className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  📅 Calendar Sync
                </h2>
                
                <div className="space-y-4">
                  <p className="text-gray-600 text-sm">
                    Manually trigger calendar sync to populate lesson details from student lesson libraries into upcoming appointments.
                  </p>
                  <button
                    onClick={triggerCalendarSync}
                    disabled={isLoading}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Syncing...' : 'Trigger Manual Calendar Sync'}
                  </button>
                </div>
              </section>

              {/* Debug Section */}
              <section className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  🔍 Debug Lesson Details
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="debugEventId" className="block text-sm font-medium text-gray-700 mb-1">
                      Calendar Event ID
                    </label>
                    <input
                      id="debugEventId"
                      type="text"
                      placeholder="Enter calendar event ID"
                      value={debugEventId}
                      onChange={(e) => setDebugEventId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                  <button
                    onClick={debugLessonDetails}
                    disabled={isLoading}
                    className="bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Debugging...' : 'Debug Lesson Details'}
                  </button>
                  
                  {debugResult && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Debug Results:</h3>
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto">
                        {JSON.stringify(debugResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </section>

              {/* Master Lessons Display */}
              {showLessons && (
                <section className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold text-gray-900">
                      📋 Current Master Lessons ({pagination.totalCount} total)
                    </h2>
                    <button
                      onClick={() => setShowLessons(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕ Close
                    </button>
                  </div>
                  
                  {masterLessons.length > 0 ? (
                    <>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {masterLessons.map((lesson) => (
                          <div key={lesson.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-gray-900">
                                {lesson.index}. {lesson.topic}
                              </h3>
                              <div className="flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                  {lesson.cefrLevel}
                                </span>
                                <button
                                  onClick={() => setEditingLesson(lesson)}
                                  className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                                >
                                  Edit
                                </button>
                              </div>
                            </div>
                            
                            <div className="text-sm text-gray-600 space-y-1">
                              <p><strong>Unit:</strong> {lesson.unit}</p>
                              <p><strong>Activity:</strong> {lesson.learningActivity}</p>
                              <p><strong>Vocabulary:</strong> {lesson.vocabulary.join(', ')}</p>
                              <p><strong>Powerpoint:</strong> {lesson.powerpoint.join(', ')}</p>
                              <p><strong>Grammar Concept:</strong> {lesson.grammarConcept}</p>
                              <p><strong>Playlist:</strong> {lesson.playlist}</p>
                              <p><strong>Homework:</strong> {lesson.homework}</p>
                              <p><strong>Teaching Notes:</strong> {lesson.teachingNotes}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Pagination Controls */}
                      {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                          <div className="text-sm text-gray-600">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} lessons
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => fetchMasterLessons(pagination.page - 1)}
                              disabled={!pagination.hasPrevPage || isLoading}
                              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Previous
                            </button>
                            <span className="text-sm text-gray-600">
                              Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <button
                              onClick={() => fetchMasterLessons(pagination.page + 1)}
                              disabled={!pagination.hasNextPage || isLoading}
                              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No master lessons found. Import some lessons to get started.
                    </div>
                  )}
                </section>
              )}

              {/* Instructions */}
              <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-blue-900 mb-3">
                  📖 Instructions
                </h2>
                <div className="text-blue-800 space-y-2">
                  <p><strong>1. Initialize Master Lessons:</strong> Use either the predefined template or import from a Google Sheet to set up the master lessons library.</p>
                  <p><strong>2. Google Sheets Import:</strong> Create a Google Sheet with columns: CEFR Level, Unit, Topic, Learning Activity, Vocabulary (comma-separated), Powerpoint (comma-separated), Grammar Concept, Playlist, Homework, Teaching Notes. Index column is optional and will be auto-generated. Make sure the sheet is publicly accessible.</p>
                  <p><strong>3. View Master Lessons:</strong> Click &quot;View Current Lessons&quot; to see all current master lessons in the system.</p>
                  <p><strong>4. Initialize Student Lessons:</strong> Enter a student&apos;s email and click &quot;Initialize Student Lessons&quot; to create their personal lesson library from the master lessons.</p>
                  <p><strong>5. Calendar Sync:</strong> Click &quot;Trigger Manual Calendar Sync&quot; to populate lesson details from student lesson libraries into upcoming appointments.</p>
                  <p><strong>6. Debug:</strong> Use the debug section to check what lesson details exist for a specific calendar event ID.</p>
                  <p><strong>7. Re-initialize:</strong> You can re-initialize at any time to update the lessons with new content.</p>
                </div>
              </section>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link 
                href="/teacher"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                ← Back to Teacher Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Lesson Modal */}
      {editingLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Master Lesson: {editingLesson.topic}
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const updatedData = {
                cefrLevel: formData.get('cefrLevel') as string,
                unit: formData.get('unit') as string,
                topic: formData.get('topic') as string,
                learningActivity: formData.get('learningActivity') as string,
                vocabulary: (formData.get('vocabulary') as string).split(',').map(v => v.trim()).filter(v => v),
                powerpoint: (formData.get('powerpoint') as string).split(',').map(p => p.trim()).filter(p => p),
                grammarConcept: formData.get('grammarConcept') as string,
                playlist: formData.get('playlist') as string,
                homework: formData.get('homework') as string,
                teachingNotes: formData.get('teachingNotes') as string,
              };
              updateMasterLesson(editingLesson.id, updatedData);
            }}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CEFR Level</label>
                    <input
                      type="text"
                      name="cefrLevel"
                      defaultValue={editingLesson.cefrLevel}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <input
                      type="text"
                      name="unit"
                      defaultValue={editingLesson.unit}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                  <input
                    type="text"
                    name="topic"
                    defaultValue={editingLesson.topic}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Learning Activity</label>
                  <textarea
                    name="learningActivity"
                    defaultValue={editingLesson.learningActivity}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vocabulary (comma-separated)</label>
                  <input
                    type="text"
                    name="vocabulary"
                    defaultValue={editingLesson.vocabulary.join(', ')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Powerpoint (comma-separated)</label>
                  <input
                    type="text"
                    name="powerpoint"
                    defaultValue={editingLesson.powerpoint.join(', ')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grammar Concept</label>
                  <input
                    type="text"
                    name="grammarConcept"
                    defaultValue={editingLesson.grammarConcept}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Playlist</label>
                  <input
                    type="text"
                    name="playlist"
                    defaultValue={editingLesson.playlist}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Homework</label>
                  <textarea
                    name="homework"
                    defaultValue={editingLesson.homework}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teaching Notes</label>
                  <textarea
                    name="teachingNotes"
                    defaultValue={editingLesson.teachingNotes}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingLesson(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
