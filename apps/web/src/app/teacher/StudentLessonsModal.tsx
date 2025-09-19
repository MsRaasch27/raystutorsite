"use client";

import { useState, useEffect } from "react";

type StudentLesson = {
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
  completed: boolean;
  debriefNotes: string;
  studentId: string;
  createdAt: string;
  updatedAt: string;
};

interface StudentLessonsModalProps {
  student: {
    id: string;
    name?: string | null;
    email: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function StudentLessonsModal({ student, isOpen, onClose }: StudentLessonsModalProps) {
  const [lessons, setLessons] = useState<StudentLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // const [editingLesson, setEditingLesson] = useState<StudentLesson | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchLessons();
    }
  }, [isOpen, student.id]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/users/${encodeURIComponent(student.id)}/lessons`);
      if (!response.ok) {
        throw new Error("Failed to fetch lessons");
      }
      const data = await response.json();
      setLessons(data.lessons || []);
    } catch (err) {
      console.error("Error fetching lessons:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch lessons");
    } finally {
      setLoading(false);
    }
  };

  const updateLesson = async (lessonId: string, updates: Partial<StudentLesson>) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/users/${encodeURIComponent(student.id)}/lessons/${lessonId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update lesson");
      }

      // Update local state
      setLessons(prev => prev.map(lesson => 
        lesson.id === lessonId ? { ...lesson, ...updates } : lesson
      ));
      // setEditingLesson(null);
    } catch (err) {
      console.error("Error updating lesson:", err);
      setError(err instanceof Error ? err.message : "Failed to update lesson");
    } finally {
      setSaving(false);
    }
  };

  const toggleCompleted = async (lessonId: string, completed: boolean) => {
    await updateLesson(lessonId, { completed });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                📚 Lessons Library - {student.name || student.email}
              </h2>
              <p className="text-gray-600 mt-1">
                Manage lesson content and track completion
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading lessons...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchLessons}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className={`border rounded-lg p-4 ${
                    lesson.completed ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {lesson.cefrLevel}
                        </span>
                        <span className="text-sm text-gray-600">#{lesson.index}</span>
                        <h3 className="font-semibold text-gray-800">{lesson.topic}</h3>
                        {lesson.completed && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            ✓ Completed
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{lesson.unit}</p>
                      <p className="text-sm text-gray-700 mb-2">{lesson.learningActivity}</p>
                      
                      {lesson.vocabulary.length > 0 && (
                        <div className="mb-2">
                          <span className="text-xs font-medium text-gray-500">Vocabulary:</span>
                          <span className="text-xs text-gray-600 ml-1">
                            {lesson.vocabulary.join(", ")}
                          </span>
                        </div>
                      )}
                      
                      {lesson.resources.length > 0 && (
                        <div className="mb-2">
                          <span className="text-xs font-medium text-gray-500">Resources:</span>
                          <span className="text-xs text-gray-600 ml-1">
                            {lesson.resources.join(", ")}
                          </span>
                        </div>
                      )}
                      
                      {lesson.homework && (
                        <div className="mb-2">
                          <span className="text-xs font-medium text-gray-500">Homework:</span>
                          <span className="text-xs text-gray-600 ml-1">{lesson.homework}</span>
                        </div>
                      )}
                      
                      {lesson.teachingNotes && (
                        <div className="mb-2">
                          <span className="text-xs font-medium text-gray-500">Teaching Notes:</span>
                          <span className="text-xs text-gray-600 ml-1">{lesson.teachingNotes}</span>
                        </div>
                      )}
                      
                      {lesson.debriefNotes && (
                        <div className="mb-2">
                          <span className="text-xs font-medium text-gray-500">Debrief Notes:</span>
                          <span className="text-xs text-gray-600 ml-1">{lesson.debriefNotes}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => {/* setEditingLesson(lesson) */}}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                        disabled={saving}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleCompleted(lesson.id, !lesson.completed)}
                        className={`text-sm px-3 py-1 rounded ${
                          lesson.completed
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                        disabled={saving}
                      >
                        {lesson.completed ? "Mark Incomplete" : "Mark Complete"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {lessons.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">📚</div>
                  <p className="text-gray-600">No lessons found for this student.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={saving}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
