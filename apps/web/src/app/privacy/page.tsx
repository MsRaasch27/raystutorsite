import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Privacy Policy for Enchanted English
          </h1>
          
          <div className="text-sm text-gray-600 mb-6">
            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
              <p className="text-gray-700 mb-4">
                Ray&apos;s Tutor Site is a web application that helps manage English language tutoring services. 
                This privacy policy explains how we handle your information when you use our tutoring platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>
                  <strong>Student Information:</strong> We collect basic information from students 
                  (name, email, native language, age, goals, preferences) to create personalized learning experiences.
                </li>
                <li>
                  <strong>Learning Data:</strong> We store vocabulary words, lesson progress, and learning materials 
                  in our secure database to track student progress and customize lessons.
                </li>
                <li>
                  <strong>Assessment Data:</strong> We collect CEFR level assessments and learning progress data 
                  to provide appropriate lesson content.
                </li>
                <li>
                  <strong>Usage Data:</strong> We may collect basic usage information to improve our services.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
              <div className="text-gray-700">
                <p className="mb-4">
                  <strong>Learning Management:</strong> We use your information to:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Create personalized vocabulary collections with translations in your native language</li>
                  <li>Generate customized lesson plans based on your CEFR level and learning goals</li>
                  <li>Track your learning progress and adapt lesson difficulty accordingly</li>
                  <li>Provide flashcards and practice materials tailored to your needs</li>
                  <li>Schedule and manage tutoring sessions</li>
                </ul>
                <p>
                  <strong>Service Improvement:</strong> We use aggregated, anonymized data to improve our teaching methods and platform features.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information Sharing</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>
                  <strong>Google Services:</strong> We use Google Translate API to provide vocabulary translations 
                  and Google Calendar for lesson scheduling. We do not share your personal data with Google beyond 
                  what is necessary for these specific services.
                </li>
                <li>
                  <strong>Teacher Access:</strong> Your teacher has access to your learning progress, vocabulary, 
                  and lesson data to provide personalized instruction and track your development.
                </li>
                <li>
                  <strong>Third Parties:</strong> We do not sell, trade, or otherwise transfer your information to third parties 
                  except as necessary to provide our services (e.g., Google Translate for vocabulary translations).
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>We use Firebase&apos;s secure cloud infrastructure to store and protect your data</li>
                <li>Google OAuth 2.0 provides secure authentication for accessing your account</li>
                <li>All data transmission is encrypted using industry-standard SSL/TLS protocols</li>
                <li>We implement access controls to ensure only authorized personnel can access your data</li>
                <li>We regularly review and update our security practices to protect your information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Retention</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Student data is retained as long as needed to provide tutoring services and track learning progress</li>
                <li>Learning progress and vocabulary data is kept to maintain continuity in your education</li>
                <li>You can request deletion of your data at any time by contacting us</li>
                <li>We will delete your data within 30 days of receiving a deletion request, unless legal obligations require longer retention</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>
                  <strong>Access Your Data:</strong> You can view and download your learning data through our application
                </li>
                <li>
                  <strong>Update Information:</strong> You can update your personal information and learning preferences through our application
                </li>
                <li>
                  <strong>Delete Data:</strong> Contact us to request deletion of your data and account
                </li>
                <li>
                  <strong>Data Portability:</strong> You can request a copy of your data in a portable format
                </li>
                <li>
                  <strong>Opt Out:</strong> You can opt out of certain data processing activities while maintaining access to core services
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-gray-700">
                For questions about this privacy policy, contact:
              </p>
              <div className="mt-2 text-gray-700">
                <p><strong>Email:</strong> msraasch27@gmail.com</p>
                <p><strong>Website:</strong> raystutorsite.web.app</p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link 
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}