import { notFound } from "next/navigation";

function getBaseUrl() {
  // Firebase Hosting frameworks sets VERCEL_URL to your site host (no scheme).
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  // Local dev fallback:
  return "http://localhost:3000";
}

type User = {
  id: string;
  name?: string | null;
  email: string;
  goals?: string | null;
};

type Assessment = {
  id: string;
  userId: string;
  email: string;
  submittedAt: string;
  answers: Record<string, string | number | boolean>;
  createdAt: FirebaseFirestore.Timestamp;
};

export default async function StudentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const id = decodeURIComponent(slug).trim().toLowerCase();
  const res = await fetch(`${getBaseUrl()}/api/users/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });

  if (res.status === 404) {
    notFound(); // shows Next.js 404 page
  }
  if (!res.ok) {
    throw new Error(`Failed to load user: ${res.status}`);
  }

  const user = (await res.json()) as User;

  // Fetch user's assessments
  const assessmentsRes = await fetch(`${getBaseUrl()}/api/users/${encodeURIComponent(id)}/assessments`, {
    cache: "no-store",
  });
  
  let assessments: Assessment[] = [];
  if (assessmentsRes.ok) {
    const assessmentsData = await assessmentsRes.json();
    assessments = assessmentsData.assessments || [];
  }

  const hasCompletedAssessment = assessments.length > 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Banner Header */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Profile Image */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white bg-opacity-20 flex items-center justify-center border-4 border-white border-opacity-30">
              <div className="text-center">
                <div className="text-3xl md:text-4xl mb-1">👤</div>
                <p className="text-xs font-semibold">Photo</p>
              </div>
            </div>
            
            {/* Welcome Content */}
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Welcome, {user.name ?? user.email.split('@')[0]}!
              </h1>
              <p className="text-lg md:text-xl text-blue-100">
                Learning Goal: {user.goals || "Master conversational English and build confidence in speaking"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <section className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {hasCompletedAssessment ? (
            <button 
              disabled
              className="bg-gray-400 text-gray-600 px-8 py-3 rounded-lg font-semibold cursor-not-allowed shadow-lg inline-block text-center"
              title="Assessment already completed"
            >
              ✅ Assessment Completed
            </button>
          ) : (
            <a 
              href="https://forms.gle/396aRWwtMGvLgiwX6" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-lg inline-block text-center"
            >
              📝 Take Assessment
            </a>
          )}
          <a 
            href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1YL7elo0lkIxv6Su3_AInKisXz3XdiRbJ_iEc6bxs2UCBGV9TZy8Z61AxhTj3cN8idri6VX8LA" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg inline-block text-center"
          >
            📅 Schedule Lesson
          </a>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="max-w-6xl mx-auto px-6">
        <div className="bg-white rounded-t-xl shadow-lg">
          <div className="flex border-b">
            <button className="flex-1 py-4 px-6 text-center font-semibold text-blue-600 border-b-2 border-blue-600 bg-blue-50">
              📚 Past Lessons
            </button>
            <button className="flex-1 py-4 px-6 text-center font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors">
              🗓️ Upcoming Lessons
            </button>
            <button className="flex-1 py-4 px-6 text-center font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors">
              🎯 Extra Practice
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="max-w-6xl mx-auto px-6 pb-8">
        <div className="bg-white rounded-b-xl shadow-lg p-6">
          {/* Hero's Journey Progress */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🏆 My Progress</h2>
            <div className="bg-gray-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold text-gray-700">Current Level: Beginner Explorer</span>
                <span className="text-sm text-gray-500">0% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-4 rounded-full" style={{ width: '0.5%' }}></div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div className="bg-green-100 rounded-lg p-3">
                  <div className="text-2xl mb-1">✅</div>
                  <p className="text-sm font-semibold text-green-700">Completed</p>
                  <p className="text-xs text-green-600">0 Lessons</p>
                </div>
                <div className="bg-blue-100 rounded-lg p-3">
                  <div className="text-2xl mb-1">🎯</div>
                  <p className="text-sm font-semibold text-blue-700">Scheduled</p>
                  <p className="text-xs text-blue-600">0 Lessons</p>
                </div>
                <div className="bg-purple-100 rounded-lg p-3">
                  <div className="text-2xl mb-1">⭐</div>
                  <p className="text-sm font-semibold text-purple-700">Achievements</p>
                  <p className="text-xs text-purple-600">0 Badges</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Flashcard Deck */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🃏 My Flashcard Deck</h2>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
              <div className="text-center">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Vocabulary Builder</h3>
                <p className="text-gray-600 mb-6">Practice essential words and phrases for daily conversation</p>
                
                {/* Flashcard Placeholder */}
                <div className="bg-white rounded-lg shadow-lg p-8 mb-6 max-w-md mx-auto">
                  <div className="text-center">
                    <div className="text-4xl mb-4">💬</div>
                    <p className="text-lg font-semibold text-gray-800 mb-2">&quot;How are you feeling today?&quot;</p>
                    <p className="text-gray-600 text-sm">Tap to reveal answer</p>
                  </div>
                </div>
                
                {/* Flashcard Controls */}
                <div className="flex justify-center gap-4">
                  <button className="bg-red-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors">
                    ❌ Hard
                  </button>
                  <button className="bg-yellow-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition-colors">
                    ⚡ Again
                  </button>
                  <button className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors">
                    ✅ Easy
                  </button>
                </div>
                
                <div className="mt-4 text-sm text-gray-500">
                  <p>Progress: 15/50 cards reviewed</p>
                  <p>Next review: 2 hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
