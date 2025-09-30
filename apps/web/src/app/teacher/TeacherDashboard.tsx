"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LessonDetailsModal } from "./LessonDetailsModal";
import { StudentLessonsModal } from "./StudentLessonsModal";
import StudentImagePrompt from "@/components/StudentImagePrompt";

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
  recentLessons: Lesson[];
  upcomingLessons: Lesson[];
  createdAt?: unknown;
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



export function TeacherDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<{ lesson: Lesson; student: Student } | null>(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentLessonsModal, setShowStudentLessonsModal] = useState(false);
  const [expandedRecentStudents, setExpandedRecentStudents] = useState<Set<string>>(new Set());
  const [expandedUpcomingStudents, setExpandedUpcomingStudents] = useState<Set<string>>(new Set());
  const [lessonDetails, setLessonDetails] = useState<Record<string, LessonDetails>>({});
  const [homeworkSubmissions, setHomeworkSubmissions] = useState<Record<string, HomeworkSubmission[]>>({});

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api-bzn2v7ik2a-uc.a.run.app'}/api/teacher/students`);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      
      // Sort students: active subscribers first, then by name
      const sortedStudents = (data.students || []).sort((a: Student, b: Student) => {
        const aBilling = a.billing as Record<string, unknown> | null;
        const bBilling = b.billing as Record<string, unknown> | null;
        const aActive = aBilling?.active === true;
        const bActive = bBilling?.active === true;
        
        // First sort by active status (active first)
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        
        // Then sort by name
        const aName = a.name || a.email.split('@')[0];
        const bName = b.name || b.email.split('@')[0];
        return aName.localeCompare(bName);
      });
      
      setStudents(sortedStudents);
      
      // Fetch lesson details for all upcoming lessons
      await fetchLessonDetailsForStudents(sortedStudents);
      
      // Fetch lesson details and homework submissions for recent lessons
      await fetchRecentLessonDetailsAndHomework(sortedStudents);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const fetchLessonDetailsForStudents = async (studentsList: Student[]) => {
    const details: Record<string, LessonDetails> = {};
    
    for (const student of studentsList) {
      for (const lesson of student.upcomingLessons) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api-bzn2v7ik2a-uc.a.run.app'}/api/teacher/lessons/${lesson.calendarEventId}`);
          if (response.ok) {
            const data = await response.json();
            details[lesson.calendarEventId] = data.details || {};
          }
        } catch (err) {
          console.error(`Error fetching details for lesson ${lesson.calendarEventId}:`, err);
          details[lesson.calendarEventId] = {};
        }
      }
    }
    
    setLessonDetails(details);
  };

  const fetchRecentLessonDetailsAndHomework = async (studentsList: Student[]) => {
    const details: Record<string, LessonDetails> = {};
    const homeworkData: Record<string, HomeworkSubmission[]> = {};
    
    for (const student of studentsList) {
      // Fetch homework submissions for this student
      try {
        const homeworkResponse = await fetch(`/api/users/${encodeURIComponent(student.id)}/homework`);
        if (homeworkResponse.ok) {
          const homeworkSubmissions = await homeworkResponse.json();
          homeworkData[student.id] = homeworkSubmissions || [];
        } else {
          homeworkData[student.id] = [];
        }
      } catch (err) {
        console.error(`Error fetching homework for student ${student.id}:`, err);
        homeworkData[student.id] = [];
      }
      
      // Fetch lesson details for recent lessons
      for (const lesson of student.recentLessons) {
        try {
          const response = await fetch(`/api/users/${encodeURIComponent(student.id)}/lesson-details/${lesson.id}`);
          if (response.ok) {
            const data = await response.json();
            details[lesson.id] = data.details || {};
          }
        } catch (err) {
          console.error(`Error fetching details for lesson ${lesson.id}:`, err);
          details[lesson.id] = {};
        }
      }
    }
    
    setLessonDetails(prev => ({ ...prev, ...details }));
    setHomeworkSubmissions(homeworkData);
  };

  const handleLessonClick = (lesson: Lesson, student: Student) => {
    setSelectedLesson({ lesson, student });
    setShowLessonModal(true);
  };

  const handleOpenStudentLessons = (student: Student) => {
    setSelectedStudent(student);
    setShowStudentLessonsModal(true);
  };

  const handleEmailStudent = (email: string) => {
    window.open(`mailto:${email}`, '_blank');
  };

  const toggleRecentExpansion = (studentId: string) => {
    const newExpanded = new Set(expandedRecentStudents);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedRecentStudents(newExpanded);
  };

  const toggleUpcomingExpansion = (studentId: string) => {
    const newExpanded = new Set(expandedUpcomingStudents);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedUpcomingStudents(newExpanded);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getCEFRDisplay = (cefrLevels: unknown) => {
    if (!cefrLevels || typeof cefrLevels !== 'object') return 'Not assessed';
    const levels = cefrLevels as Record<string, string>;
    const result = [];
    if (levels.understanding) result.push(`U: ${levels.understanding}`);
    if (levels.speaking) result.push(`S: ${levels.speaking}`);
    if (levels.reading) result.push(`R: ${levels.reading}`);
    if (levels.writing) result.push(`W: ${levels.writing}`);
    return result.length > 0 ? result.join(', ') : 'Not assessed';
  };

    const getPaymentStatus = (billing: unknown) => {
    if (!billing || typeof billing !== 'object') return { 
      status: 'No Plan', 
      color: 'bg-gray-100 text-gray-700',
      planType: null,
      nextBilling: null
    };
    const billingData = billing as Record<string, unknown>;
    if (billingData.active) {
        const planType = billingData.planType as string;
        const trialCode = billingData.trialCode as string;
        const trialEndDate = billingData.trialEndDate ? new Date(billingData.trialEndDate as string) : null;
        const currentPeriodEnd = billingData.currentPeriodEnd ? new Date(billingData.currentPeriodEnd as number * 1000) : null;
        
        // Check if this is a trial subscription
        if (trialCode && trialEndDate && trialEndDate > new Date()) {
          return { 
            status: 'Trial',
            color: 'bg-green-100 text-green-700',
            planType: null,
            nextBilling: trialEndDate
          };
        }
        
        return { 
          status: planType ? planType.charAt(0).toUpperCase() + planType.slice(1) : 'Active',
          color: 'bg-green-100 text-green-700',
          planType: planType || 'Active',
          nextBilling: currentPeriodEnd
        };
      }
    return { 
      status: 'Inactive', 
      color: 'bg-red-100 text-red-700',
      planType: null,
      nextBilling: null
    };
  };

  const isLessonComplete = (lesson: Lesson): boolean => {
    const details = lessonDetails[lesson.calendarEventId];
    if (!details) return false;
    
    return !!(
      details.topic &&
      details.homework &&
      details.learningActivity &&
      details.vocabulary &&
      details.vocabulary.length > 0
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" style={{ backgroundImage: 'url(/gothic_full_cropped.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-white">Loading students...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" style={{ backgroundImage: 'url(/gothic_full_cropped.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="text-red-400 text-2xl mb-4">⚠️</div>
            <p className="text-red-400">{error}</p>
            <button 
              onClick={fetchStudents}
              className="mt-4 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" style={{ backgroundImage: 'url(/gothic_full_cropped.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 py-16 rounded-2xl" style={{ backgroundColor: '#000000' }}>
        <div className="bg-black bg-opacity-90 rounded-2xl p-8 mx-8 my-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-white">👨‍🏫 Teacher Dashboard</h1>
              <p className="text-gray-200">Manage your students and lessons</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/teacher/admin"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm flex items-center gap-2"
              >
                🔧 Admin Panel
              </Link>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{students.length}</div>
                <div className="text-gray-200 text-sm">Total Students</div>
                <div className="text-gray-200 text-xs mt-1">
                  {students.filter(s => (s.billing as Record<string, unknown>)?.active === true).length} Active
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Students List */}
      <section className="max-w-7xl mx-auto px-6 py-8 rounded-2xl" style={{ backgroundColor: '#475037' }}>
        <div className="grid gap-6">
          {students.map((student) => (
            <div key={student.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Main Student Info */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  {/* Student Photo */}
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {student.photo ? (
                      <img 
                        src={student.photo} 
                        alt="Student photo" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-2xl">👤</div>
                    )}
                  </div>

                  {/* Student Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h2 className="text-xl font-bold text-gray-800">
                        {student.name || student.email.split('@')[0]}
                      </h2>
                      {student.age && (
                        <span className="text-gray-600">Age: {student.age}</span>
                      )}
                      <button
                        onClick={() => handleOpenStudentLessons(student)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        📚 Lessons Library
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPaymentStatus(student.billing).color}`}>
                        {getPaymentStatus(student.billing).status}
                      </span>
                      <span className="text-gray-600">
                        CEFR: {getCEFRDisplay(student.cefrLevels)}
                      </span>
                    </div>
                    
                    {/* Plan Details */}
                    {getPaymentStatus(student.billing).planType && getPaymentStatus(student.billing).planType !== 'Active' && (
                      <div className="flex items-center gap-4 text-sm mt-1">
                        <span className="text-gray-600">
                          Plan: <span className="font-medium">{getPaymentStatus(student.billing).planType}</span>
                        </span>
                        {getPaymentStatus(student.billing).nextBilling && (
                          <span className="text-gray-600">
                            Next Billing: <span className="font-medium">
                              {getPaymentStatus(student.billing).nextBilling?.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Trial/Next Billing Info */}
                    {getPaymentStatus(student.billing).status === 'Trial' && getPaymentStatus(student.billing).nextBilling && (
                      <div className="flex items-center gap-4 text-sm mt-1">
                        <span className="text-gray-600">
                          Trial Ends: <span className="font-medium">
                            {getPaymentStatus(student.billing).nextBilling?.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEmailStudent(student.email)}
                      className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors text-sm"
                    >
                      📧 Email
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Image Prompt Section */}
              <div className="px-6 pb-4">
                <StudentImagePrompt 
                  studentId={student.id} 
                  studentName={student.name || student.email.split('@')[0]} 
                />
              </div>

              {/* Lessons Section */}
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Recent Lessons */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        📚 Recent Lessons
                      </h3>
                      {student.recentLessons.length > 2 && (
                        <button
                          onClick={() => toggleRecentExpansion(student.id)}
                          className="text-blue-600 text-sm hover:text-blue-800 font-medium"
                        >
                          {expandedRecentStudents.has(student.id) 
                            ? 'Show Less' 
                            : `Show ${student.recentLessons.length - 2} More`
                          }
                        </button>
                      )}
                    </div>
                    {student.recentLessons.length === 0 ? (
                      <p className="text-gray-500 text-sm">No recent lessons</p>
                    ) : (
                      <div className="space-y-2">
                        {student.recentLessons
                          .slice(0, expandedRecentStudents.has(student.id) ? undefined : 2)
                          .map((lesson) => {
                            const details = lessonDetails[lesson.id] || {};
                            const studentHomework = homeworkSubmissions[student.id] || [];
                            const homeworkSubmission = studentHomework.find(h => h.lessonId === lesson.id);
                            const hasHomework = details.homework && details.homework.trim() !== '';
                            
                            return (
                              <div 
                                key={lesson.id}
                                className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleLessonClick(lesson, student)}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="font-medium text-gray-800">
                                    {lesson.title || 'English Lesson'}
                                  </div>
                                  {hasHomework && (
                                    <div className="flex gap-1">
                                      {homeworkSubmission ? (
                                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                                          📝 Submitted
                                        </span>
                                      ) : (
                                        <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
                                          ⏳ Not Complete
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {formatDate(lesson.startTime || null)}
                                </div>
                                {hasHomework && homeworkSubmission && (
                                  <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-2 rounded border">
                                    <div className="font-medium text-blue-700 mb-1">Student Submission:</div>
                                    <div className="text-gray-700 max-h-16 overflow-y-auto">
                                      {homeworkSubmission.content}
                                    </div>
                                    <div className="text-blue-600 mt-1">
                                      Submitted: {new Date(homeworkSubmission.submittedAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* Upcoming Lessons */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        🗓️ Upcoming Lessons
                      </h3>
                      {student.upcomingLessons.length > 2 && (
                        <button
                          onClick={() => toggleUpcomingExpansion(student.id)}
                          className="text-blue-600 text-sm hover:text-blue-800 font-medium"
                        >
                          {expandedUpcomingStudents.has(student.id) 
                            ? 'Show Less' 
                            : `Show ${student.upcomingLessons.length - 2} More`
                          }
                        </button>
                      )}
                    </div>
                    {student.upcomingLessons.length === 0 ? (
                      <p className="text-gray-500 text-sm">No upcoming lessons</p>
                    ) : (
                      <div className="space-y-2">
                        {student.upcomingLessons
                          .slice(0, expandedUpcomingStudents.has(student.id) ? undefined : 2)
                          .map((lesson) => (
                          <div 
                            key={lesson.id}
                            className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
                              !isLessonComplete(lesson) ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                            }`}
                            onClick={() => handleLessonClick(lesson, student)}
                          >
                            <div className="font-medium text-gray-800">
                              {lesson.title || 'English Lesson'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatDate(lesson.startTime || null)}
                            </div>
                            {lesson.meetLink && (
                              <a 
                                href={lesson.meetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 text-xs hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                🎥 Join Meeting
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {students.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">👥</div>
            <p className="text-gray-600">No students found</p>
          </div>
        )}
      </section>

      {/* Lesson Details Modal */}
      {showLessonModal && selectedLesson && (
        <LessonDetailsModal
          lesson={selectedLesson.lesson}
          student={selectedLesson.student}
          isOpen={showLessonModal}
          onClose={() => {
            setShowLessonModal(false);
            setSelectedLesson(null);
          }}
          onSave={() => {
            setShowLessonModal(false);
            setSelectedLesson(null);
            // Refresh lesson details for the updated lesson
            if (selectedLesson) {
              fetchLessonDetailsForStudents(students);
            }
          }}
        />
      )}

      {/* Student Lessons Modal */}
      {selectedStudent && (
        <StudentLessonsModal
          student={selectedStudent}
          isOpen={showStudentLessonsModal}
          onClose={() => {
            setShowStudentLessonsModal(false);
            setSelectedStudent(null);
          }}
        />
      )}
    </main>
  );
}
