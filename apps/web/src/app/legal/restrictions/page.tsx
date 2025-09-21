import Link from "next/link";

export default function RestrictionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Export Restrictions</h1>
          <p className="text-xl text-purple-100">
            Enchanted English
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Export Restrictions Policy</h2>
            
            <div className="space-y-6">
              <div className="border-l-4 border-green-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Export Status</h3>
                <p className="text-gray-700">
                  No export restrictions apply to our digital English tutoring services.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Service Availability</h3>
                <p className="text-green-700">
                  Our online English tutoring services are available globally without export restrictions. Students from any country may access our digital platform and services.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Digital Services</h3>
                <p className="text-blue-700">
                  As digital services, our English tutoring platform, lesson materials, and interactive dashboard are not subject to traditional export restrictions that apply to physical goods or certain software technologies.
                </p>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Contact Information</h3>
              <p className="text-gray-700">
                For questions about service availability in your region, please contact our site administrator.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Link
            href="/legal"
            className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors mr-4"
          >
            ← Back to Legal
          </Link>
          <Link
            href="/"
            className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
