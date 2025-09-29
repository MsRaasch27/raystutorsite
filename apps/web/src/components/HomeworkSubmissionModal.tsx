'use client';

import React, { useState } from 'react';

interface HomeworkSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: {
    id: string;
    topic: string;
    homeworkPrompt?: string;
    studentId: string;
  };
  onSubmissionComplete?: () => void;
}

interface HomeworkSubmission {
  id: string;
  lessonId: string;
  studentId: string;
  content: string;
  submittedAt: string;
  status: 'submitted' | 'graded';
  grade?: string;
  feedback?: string;
}

const HomeworkSubmissionModal: React.FC<HomeworkSubmissionModalProps> = ({
  isOpen,
  onClose,
  lesson,
  onSubmissionComplete
}) => {
  const [homeworkContent, setHomeworkContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [existingHomework, setExistingHomework] = useState<HomeworkSubmission | null>(null);

  const loadExistingHomework = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${lesson.studentId}/homework?lessonId=${lesson.id}`);
      if (response.ok) {
        const homework = await response.json();
        setExistingHomework(homework);
        if (homework) {
          setHomeworkContent(homework.content);
        }
      }
    } catch (error) {
      console.error('Error loading existing homework:', error);
    }
  }, [lesson.studentId, lesson.id]);

  // Load existing homework when modal opens
  React.useEffect(() => {
    if (isOpen && lesson.id) {
      loadExistingHomework();
    }
  }, [isOpen, lesson.id, loadExistingHomework]);

  const handleSubmit = async () => {
    if (!homeworkContent.trim()) {
      alert('Please write your homework assignment before submitting.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/users/${lesson.studentId}/homework`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId: lesson.id,
          content: homeworkContent.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit homework');
      }

      const result = await response.json();
      setExistingHomework(result);
      
      // Show reward animation
      setShowReward(true);
      setTimeout(() => {
        setShowReward(false);
        onSubmissionComplete?.();
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Error submitting homework:', error);
      alert('Failed to submit homework. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">
                {existingHomework ? 'Edit Homework Assignment' : 'Homework Assignment'}
              </h2>
              <p className="text-purple-100 mt-1">Lesson: {lesson.topic}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Homework Prompt */}
          {lesson.homeworkPrompt && (
            <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Assignment Instructions:</h3>
              <p className="text-blue-700 whitespace-pre-wrap">{lesson.homeworkPrompt}</p>
            </div>
          )}

          {/* Existing Homework Status */}
          {existingHomework && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Submission Status:</h3>
              <p className="text-green-700">
                ✅ Submitted on {new Date(existingHomework.submittedAt).toLocaleDateString()}
                {existingHomework.status === 'graded' && existingHomework.grade && (
                  <span className="ml-2 font-semibold">Grade: {existingHomework.grade}</span>
                )}
              </p>
              {existingHomework.feedback && (
                <div className="mt-2 p-3 bg-white rounded border">
                  <h4 className="font-semibold text-gray-800">Teacher Feedback:</h4>
                  <p className="text-gray-700 mt-1 whitespace-pre-wrap">{existingHomework.feedback}</p>
                </div>
              )}
            </div>
          )}

          {/* Text Editor */}
          <div className="mb-6">
            <label htmlFor="homework-content" className="block text-lg font-semibold text-gray-800 mb-2">
              Your Assignment:
            </label>
            <textarea
              id="homework-content"
              value={homeworkContent}
              onChange={(e) => setHomeworkContent(e.target.value)}
              placeholder="Write your homework assignment here..."
              className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              disabled={isSubmitting}
            />
            <div className="text-sm text-gray-500 mt-2">
              {homeworkContent.length} characters
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {existingHomework ? 'Update your homework submission' : 'Submit your homework assignment'}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !homeworkContent.trim()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  📝 {existingHomework ? 'Update Submission' : 'Submit Homework'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Simple Reward Animation */}
      {showReward && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] pointer-events-none">
          <div className="text-center">
            <div className="text-8xl mb-4 animate-bounce">🎉</div>
            <div className="text-3xl font-bold text-white bg-purple-600 px-6 py-3 rounded-lg shadow-lg">
              {existingHomework ? 'Homework Updated!' : 'Homework Submitted!'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeworkSubmissionModal;
