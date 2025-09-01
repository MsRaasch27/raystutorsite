import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Privacy Policy for Ray&apos;s Tutor Site
          </h1>
          
          <div className="text-sm text-gray-600 mb-6">
            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
              <p className="text-gray-700 mb-4">
                Ray&apos;s Tutor Site is a web application that helps manage English language tutoring services. 
                This privacy policy explains how we handle your information when you use our Google Drive/Sheets integration.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>
                  <strong>Teacher&apos;s Google Account:</strong> Our application is authorized to access the Teacher/Site Author&apos;s Google Drive 
                  and Google Sheets to create and manage vocabulary spreadsheets for students.
                </li>
                <li>
                  <strong>Student Information:</strong> We collect basic information from students 
                  (name, email, native language) to create personalized vocabulary sheets.
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
                  <strong>Teacher&apos;s Google Drive/Sheets Access:</strong> We use the Teacher/Site Author&apos;s Google Drive access to:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Copy template vocabulary spreadsheets from the Teacher/Site Author&apos;s Drive</li>
                  <li>Create personalized vocabulary sheets for students in the Teacher/Site Author&apos;s Drive</li>
                  <li>Update spreadsheet content with translations</li>
                  <li>Share spreadsheets with students via Google Drive sharing</li>
                </ul>
                <p>
                  <strong>Student Data:</strong> We use student information to create personalized learning materials.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information Sharing</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>
                  <strong>Google Services:</strong> We share data with Google services (Drive, Sheets, Translate) 
                  as necessary to provide our functionality, specifically within the Teacher/Site Author&apos;s Google account.
                </li>
                <li>
                  <strong>Students:</strong> We share vocabulary spreadsheets with students via Google Drive sharing 
                  from the Teacher/Site Author&apos;s account.
                </li>
                <li>
                  <strong>Third Parties:</strong> We do not sell, trade, or otherwise transfer your information to third parties.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>We use Firebase&apos;s secure infrastructure to store data</li>
                <li>Google OAuth 2.0 provides secure authentication</li>
                <li>We only request the minimum permissions necessary</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Retention</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Student data is retained as long as needed to provide tutoring services</li>
                <li>Google Drive files are managed according to your Google account settings</li>
                <li>You can revoke our access to your Google Drive at any time</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>
                  <strong>Revoke Access:</strong> The Teacher/Site Author can revoke our Google Drive access in their Google Account settings
                </li>
                <li>
                  <strong>Delete Data:</strong> Contact us to request deletion of your data
                </li>
                <li>
                  <strong>Update Information:</strong> You can update your information through our application
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
