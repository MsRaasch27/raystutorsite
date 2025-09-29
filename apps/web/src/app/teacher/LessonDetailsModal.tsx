"use client";

import { useState, useEffect } from "react";

type Student = {
  id: string;
  name?: string | null;
  email: string;
  age?: string | null;
  photo?: string | null;
  cefrLevels?: {
    understanding?: string;
    speaking?: string;
    reading?: string;
    writing?: string;
  } | null;
  billing?: {
    active?: boolean;
    planType?: string;
  } | null;
  recentLessons: unknown[];
  upcomingLessons: unknown[];
  createdAt?: unknown;
};

type Lesson = {
  id: string;
  calendarEventId: string;
  title?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  startTimestamp?: unknown;
  endTimestamp?: unknown;
  meetLink?: string | null;
  status?: string | null;
};

type LessonDetails = {
  topic?: string | null;
  vocabulary?: string[];
  homework?: string | null;
  learningActivity?: string | null;
  powerpoint?: string[];
  grammarConcept?: string | null;
  playlist?: string | null;
  teacherNotes?: string | null;
};

interface LessonDetailsModalProps {
  lesson: Lesson;
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function LessonDetailsModal({ 
  lesson, 
  student, 
  isOpen, 
  onClose, 
  onSave 
}: LessonDetailsModalProps) {
  const [details, setDetails] = useState<LessonDetails>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newVocabulary, setNewVocabulary] = useState("");
  const [newResource, setNewResource] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchLessonDetails();
    }
  }, [isOpen, lesson.calendarEventId]);

  const fetchLessonDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching lesson details for:', lesson.calendarEventId);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api-bzn2v7ik2a-uc.a.run.app'}/api/teacher/lessons/${lesson.calendarEventId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched lesson details:', data);
        setDetails(data.details || {});
      } else {
        console.error('Failed to fetch lesson details:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('Error fetching lesson details:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveLessonDetails = async () => {
    try {
      setSaving(true);
      console.log('Saving lesson details for:', lesson.calendarEventId);
      console.log('Details to save:', details);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api-bzn2v7ik2a-uc.a.run.app'}/api/teacher/lessons/${lesson.calendarEventId}/details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(details),
      });
      
      if (response.ok) {
        console.log('Successfully saved lesson details');
        onSave();
      } else {
        console.error('Failed to save lesson details:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (err) {
      console.error('Error saving lesson details:', err);
    } finally {
      setSaving(false);
    }
  };

  const addVocabulary = () => {
    if (newVocabulary.trim()) {
      setDetails(prev => ({
        ...prev,
        vocabulary: [...(prev.vocabulary || []), newVocabulary.trim()]
      }));
      setNewVocabulary("");
    }
  };

  const removeVocabulary = (index: number) => {
    setDetails(prev => ({
      ...prev,
      vocabulary: prev.vocabulary?.filter((_, i) => i !== index) || []
    }));
  };

  const addResource = () => {
    if (newResource.trim()) {
      setDetails(prev => ({
        ...prev,
        powerpoint: [...(prev.powerpoint || []), newResource.trim()]
      }));
      setNewResource("");
    }
  };

  const removeResource = (index: number) => {
    setDetails(prev => ({
      ...prev,
      powerpoint: prev.powerpoint?.filter((_, i) => i !== index) || []
    }));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Lesson Details
              </h2>
              <p className="text-gray-600">
                {student.name || student.email} • {formatDate(lesson.startTime || null)}
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

        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading lesson details...</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Lesson Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Lesson Information</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Title:</span>
                  <p className="font-medium">{lesson.title || 'English Lesson'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Time:</span>
                  <p className="font-medium">{formatDate(lesson.startTime || null)}</p>
                </div>
                {lesson.meetLink && (
                  <div className="md:col-span-2">
                    <span className="text-gray-600">Meeting Link:</span>
                    <a 
                      href={lesson.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-600 hover:underline"
                    >
                      🎥 Join Meeting
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 Lesson Topic
              </label>
              <textarea
                value={details.topic || ""}
                onChange={(e) => setDetails(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="Enter the lesson topic..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                rows={2}
              />
            </div>

            {/* Vocabulary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📚 Vocabulary Words
              </label>
              <div className="space-y-2">
                {details.vocabulary?.map((word, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="flex-1 p-2 bg-gray-100 rounded text-gray-900">{word}</span>
                    <button
                      onClick={() => removeVocabulary(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newVocabulary}
                    onChange={(e) => setNewVocabulary(e.target.value)}
                    placeholder="Add vocabulary word..."
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    onKeyPress={(e) => e.key === 'Enter' && addVocabulary()}
                  />
                  <button
                    onClick={addVocabulary}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Learning Activity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎯 Learning Activity
              </label>
              <textarea
                value={details.learningActivity || ""}
                onChange={(e) => setDetails(prev => ({ ...prev, learningActivity: e.target.value }))}
                placeholder="Describe the main learning activity..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                rows={3}
              />
            </div>

            {/* Resources */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📖 Resources & Materials
              </label>
              <div className="space-y-2">
                {details.powerpoint?.map((resource, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="flex-1 p-2 bg-gray-100 rounded text-gray-900">{resource}</span>
                    <button
                      onClick={() => removeResource(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newResource}
                    onChange={(e) => setNewResource(e.target.value)}
                    placeholder="Add resource or material..."
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    onKeyPress={(e) => e.key === 'Enter' && addResource()}
                  />
                  <button
                    onClick={addResource}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Homework */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 Homework Assignment
              </label>
              <textarea
                value={details.homework || ""}
                onChange={(e) => setDetails(prev => ({ ...prev, homework: e.target.value }))}
                placeholder="Enter homework assignment..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                rows={3}
              />
            </div>

            {/* Teacher Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📋 Teacher Notes
              </label>
              <textarea
                value={details.teacherNotes || ""}
                onChange={(e) => setDetails(prev => ({ ...prev, teacherNotes: e.target.value }))}
                placeholder="Add notes about the lesson, student progress, or observations..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                rows={4}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={saveLessonDetails}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
