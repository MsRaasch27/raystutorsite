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
  powerpoint: string[];
  grammarConcept: string;
  playlist: string;
  homework: string;
  teachingNotes: string;
  completed: boolean;
  debriefNotes: string;
  studentId: string;
  createdAt: string;
  updatedAt: string;
};

type HomeworkSubmission = {
  id: string;
  lessonId: string;
  studentId: string;
  content: string;
  submittedAt: string;
  status: 'submitted' | 'graded';
  grade?: string;
  feedback?: string;
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
  const [editingLesson, setEditingLesson] = useState<StudentLesson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingPowerpoint, setEditingPowerpoint] = useState<string | null>(null);
  const [homeworkSubmissions, setHomeworkSubmissions] = useState<HomeworkSubmission[]>([]);
  const [loadingHomework, setLoadingHomework] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLessons();
      fetchHomeworkSubmissions();
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

  const fetchHomeworkSubmissions = async () => {
    try {
      setLoadingHomework(true);
      const response = await fetch(`/api/users/${encodeURIComponent(student.id)}/homework`);
      if (!response.ok) {
        throw new Error("Failed to fetch homework submissions");
      }
      const data = await response.json();
      setHomeworkSubmissions(data || []);
    } catch (err) {
      console.error("Error fetching homework submissions:", err);
      setHomeworkSubmissions([]);
    } finally {
      setLoadingHomework(false);
    }
  };

  const gradeHomework = async (homeworkId: string, grade: string, feedback: string) => {
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(student.id)}/homework/${homeworkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grade,
          feedback,
          status: 'graded',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to grade homework');
      }

      // Refresh homework submissions
      await fetchHomeworkSubmissions();
    } catch (err) {
      console.error('Error grading homework:', err);
      alert('Failed to grade homework. Please try again.');
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
      setEditingLesson(null);
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

  const downloadPowerpoint = async (url: string) => {
    try {
      const response = await fetch(`/api/download-powerpoint?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error('Failed to download PowerPoint');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = url.split('/').pop() || 'presentation.pptx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading PowerPoint:', error);
      alert('Failed to download PowerPoint. Please try again.');
    }
  };

  const openEditModal = (url: string) => {
    setEditingPowerpoint(url);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editingPowerpoint) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('originalUrl', editingPowerpoint);

      const response = await fetch('/api/upload-powerpoint', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload PowerPoint');
      }

      const result = await response.json();
      alert('PowerPoint updated successfully!');
      setEditingPowerpoint(null);
      
      // Refresh the lessons to show updated resources
      fetchLessons();
    } catch (error) {
      console.error('Error uploading PowerPoint:', error);
      alert('Failed to upload PowerPoint. Please try again.');
    }
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
                        {(() => {
                          const submission = homeworkSubmissions.find(h => h.lessonId === lesson.id);
                          if (lesson.homework && lesson.homework.trim() !== '') {
                            return submission ? (
                              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                                📝 Homework Submitted
                              </span>
                            ) : (
                              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
                                ⏳ Homework Not Complete
                              </span>
                            );
                          }
                          return null;
                        })()}
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
                      
                      {lesson.powerpoint.length > 0 && (
                        <div className="mb-2">
                          <span className="text-xs font-medium text-gray-500">Powerpoint:</span>
                          <div className="text-xs text-gray-600 ml-1">
                            {lesson.powerpoint.map((resource, index) => (
                              <div key={index} className="flex items-center gap-2 mt-1">
                                <span className="flex-1">{resource}</span>
                                {resource.includes('storage.googleapis.com') && resource.includes('.pptx') && (
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => downloadPowerpoint(resource)}
                                      className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-300 rounded"
                                    >
                                      📥 Download
                                    </button>
                                    <button
                                      onClick={() => openEditModal(resource)}
                                      className="text-green-600 hover:text-green-800 text-xs px-2 py-1 border border-green-300 rounded"
                                    >
                                      ✏️ Edit
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {lesson.homework && (
                        <div className="mb-2">
                          <span className="text-xs font-medium text-gray-500">Homework Assignment:</span>
                          <span className="text-xs text-gray-600 ml-1">{lesson.homework}</span>
                        </div>
                      )}

                      {/* Homework Submission */}
                      {(() => {
                        const submission = homeworkSubmissions.find(h => h.lessonId === lesson.id);
                        if (lesson.homework && lesson.homework.trim() !== '') {
                          return submission ? (
                            <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-blue-700">📝 Student Submission:</span>
                                <span className="text-xs text-blue-600">
                                  {new Date(submission.submittedAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="text-xs text-gray-700 mb-2 bg-white p-2 rounded border max-h-32 overflow-y-auto">
                                {submission.content}
                              </div>
                              {submission.status === 'graded' ? (
                                <div className="text-xs">
                                  <span className="font-medium text-green-700">Grade: {submission.grade}</span>
                                  {submission.feedback && (
                                    <div className="mt-1 text-gray-600 bg-green-50 p-2 rounded">
                                      <span className="font-medium">Feedback:</span> {submission.feedback}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Grade (e.g., A, B+, 85%)"
                                    className="text-xs px-2 py-1 border border-gray-300 rounded flex-1"
                                    id={`grade-${submission.id}`}
                                  />
                                  <button
                                    onClick={() => {
                                      const gradeInput = document.getElementById(`grade-${submission.id}`) as HTMLInputElement;
                                      const feedbackInput = document.getElementById(`feedback-${submission.id}`) as HTMLTextAreaElement;
                                      if (gradeInput.value.trim()) {
                                        gradeHomework(submission.id, gradeInput.value.trim(), feedbackInput.value.trim());
                                      }
                                    }}
                                    className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                  >
                                    Grade
                                  </button>
                                </div>
                              )}
                              {submission.status !== 'graded' && (
                                <textarea
                                  placeholder="Add feedback..."
                                  className="text-xs w-full mt-2 px-2 py-1 border border-gray-300 rounded"
                                  rows={2}
                                  id={`feedback-${submission.id}`}
                                />
                              )}
                            </div>
                          ) : (
                            <div className="mb-2 p-3 bg-orange-50 border border-orange-200 rounded">
                              <span className="text-xs font-medium text-orange-700">⏳ No homework submission yet</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
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
                        onClick={() => setEditingLesson(lesson)}
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

        {/* Edit Lesson Modal */}
        {editingLesson && (
          <EditLessonModal
            lesson={editingLesson}
            onSave={(updates) => updateLesson(editingLesson.id, updates)}
            onCancel={() => setEditingLesson(null)}
          />
        )}

        {/* Edit PowerPoint Modal */}
        {editingPowerpoint && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  Edit PowerPoint
                </h3>
                <button
                  onClick={() => setEditingPowerpoint(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Upload a new PowerPoint file to replace the existing one. The file will be uploaded to the same location.
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select PowerPoint File (.pptx)
                  </label>
                  <input
                    type="file"
                    accept=".pptx"
                    onChange={handleFileUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setEditingPowerpoint(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit Lesson Modal Component
interface EditLessonModalProps {
  lesson: StudentLesson;
  onSave: (updates: Partial<StudentLesson>) => void;
  onCancel: () => void;
}

function EditLessonModal({ lesson, onSave, onCancel }: EditLessonModalProps) {
  const [formData, setFormData] = useState({
    topic: lesson.topic,
    learningActivity: lesson.learningActivity,
    vocabulary: lesson.vocabulary.join(", "),
    powerpoint: lesson.powerpoint.join(", "),
    homework: lesson.homework,
    teachingNotes: lesson.teachingNotes,
    debriefNotes: lesson.debriefNotes,
  });
  const [generatingPowerpoint, setGeneratingPowerpoint] = useState(false);

  const generatePowerpoint = async (vocabularyWords: string[]) => {
    if (vocabularyWords.length === 0) {
      alert("Please add vocabulary words first");
      return;
    }

    try {
      setGeneratingPowerpoint(true);
      
      const response = await fetch('/api/generate-powerpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: lesson.studentId,
          lessonId: lesson.id,
          vocabularyWords,
          lessonTopic: lesson.topic,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PowerPoint');
      }

      const result = await response.json();
      
      // Add the PowerPoint link to powerpoint
      const newPowerpoint = [...lesson.powerpoint, result.powerpointUrl];
      setFormData(prev => ({
        ...prev,
        powerpoint: newPowerpoint.join(", ")
      }));
      
      // Update the lesson with the new powerpoint
      onSave({
        powerpoint: newPowerpoint,
      });

      // Show detailed results
      const { imageSearchSummary, failedWords } = result;
      let message = `PowerPoint generated successfully!\n\n`;
      message += `📊 Stock Image Search Results:\n`;
      message += `✅ Successful: ${imageSearchSummary.successful}/${imageSearchSummary.total}\n`;
      message += `❌ Failed: ${imageSearchSummary.failed}/${imageSearchSummary.total}\n`;
      message += `📈 Success Rate: ${imageSearchSummary.successRate}\n`;
      message += `🖼️ Image Source: ${imageSearchSummary.imageSource}\n\n`;
      
      if (failedWords && failedWords.length > 0) {
        message += `❌ Failed words: ${failedWords.join(', ')}\n\n`;
        
        // Check if all images failed
        if (imageSearchSummary.failed === imageSearchSummary.total) {
          message += `🚨 All images failed to load. This is likely due to:\n`;
          message += `• Unsplash API key missing or invalid\n`;
          message += `• Network connectivity issues\n`;
          message += `• No suitable images found for the vocabulary words\n\n`;
          message += `💡 Solutions:\n`;
          message += `• Check Unsplash API configuration\n`;
          message += `• Try with different vocabulary words\n`;
          message += `• Check network connection`;
        } else {
          message += `💡 Some images failed to load. The PowerPoint will show placeholder text for failed words.`;
        }
      } else {
        message += `🎉 All stock images loaded successfully!`;
      }
      
      alert(message);
    } catch (error) {
      console.error('Error generating PowerPoint:', error);
      alert('Failed to generate PowerPoint. Please try again.');
    } finally {
      setGeneratingPowerpoint(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      topic: formData.topic,
      learningActivity: formData.learningActivity,
      vocabulary: formData.vocabulary.split(",").map(v => v.trim()).filter(v => v),
      powerpoint: formData.powerpoint.split(",").map(r => r.trim()).filter(r => r),
      homework: formData.homework,
      teachingNotes: formData.teachingNotes,
      debriefNotes: formData.debriefNotes,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">
              Edit Lesson: {lesson.topic}
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic
            </label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Learning Activity
            </label>
            <textarea
              value={formData.learningActivity}
              onChange={(e) => setFormData({ ...formData, learningActivity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vocabulary (comma-separated)
            </label>
            <textarea
              value={formData.vocabulary}
              onChange={(e) => setFormData({ ...formData, vocabulary: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              rows={2}
            />
            {formData.vocabulary.trim() && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => generatePowerpoint(formData.vocabulary.split(",").map(v => v.trim()).filter(v => v))}
                  disabled={generatingPowerpoint}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    generatingPowerpoint
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-purple-600 text-white hover:bg-purple-700"
                  }`}
                >
                  {generatingPowerpoint ? (
                    <>
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                      Generating...
                    </>
                  ) : (
                    "📊 Generate Powerpoint"
                  )}
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Powerpoint (comma-separated)
            </label>
            <textarea
              value={formData.powerpoint}
              onChange={(e) => setFormData({ ...formData, powerpoint: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Homework
            </label>
            <textarea
              value={formData.homework}
              onChange={(e) => setFormData({ ...formData, homework: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teaching Notes
            </label>
            <textarea
              value={formData.teachingNotes}
              onChange={(e) => setFormData({ ...formData, teachingNotes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Debrief Notes
            </label>
            <textarea
              value={formData.debriefNotes}
              onChange={(e) => setFormData({ ...formData, debriefNotes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
