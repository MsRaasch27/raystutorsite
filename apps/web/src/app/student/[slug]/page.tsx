import { StudentPageClient } from "./StudentPageClient";
import ProtectedRoute from "@/components/ProtectedRoute";

// Helper function to fetch data from API
async function fetchUserData(userId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api-bzn2v7ik2a-uc.a.run.app'}/api/users/${encodeURIComponent(userId)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch user data: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

async function fetchAppointments(userId: string, type: 'upcoming' | 'past') {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api-bzn2v7ik2a-uc.a.run.app'}/api/users/${encodeURIComponent(userId)}/appointments?kind=${type}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${type} appointments: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${type} appointments:`, error);
    return { items: [] };
  }
}

async function fetchAssessments(userId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api-bzn2v7ik2a-uc.a.run.app'}/api/users/${encodeURIComponent(userId)}/assessments`);
    if (!response.ok) {
      throw new Error(`Failed to fetch assessments: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return { assessments: [] };
  }
}

// Server component with real data fetching
export default async function StudentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Decode the slug (it's the user's email)
  const userId = decodeURIComponent(slug);
  
  // Fetch real data from the API
  const [userData, upcomingData, pastData, assessmentsData] = await Promise.allSettled([
    fetchUserData(userId),
    fetchAppointments(userId, 'upcoming'),
    fetchAppointments(userId, 'past'),
    fetchAssessments(userId)
  ]);
  
  // Handle successful data fetching
  const user = userData.status === 'fulfilled' ? userData.value : null;
  const upcoming = upcomingData.status === 'fulfilled' ? upcomingData.value : { items: [] };
  const past = pastData.status === 'fulfilled' ? pastData.value : { items: [] };
  const assessments = assessmentsData.status === 'fulfilled' ? assessmentsData.value.assessments : [];
  
  // If user not found, show error or redirect
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center" style={{ backgroundImage: 'url(/gothic_full_cropped.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
        <div className="bg-black bg-opacity-90 rounded-2xl p-8 shadow-lg text-center max-w-md mx-4">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-2">User Not Found</h1>
          <p className="text-gray-200">The user profile you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }
  
  return (
    <ProtectedRoute studentEmail={userId}>
      <StudentPageClient 
        user={user}
        upcoming={upcoming}
        past={past}
        assessments={assessments}
      />
    </ProtectedRoute>
  );
}
