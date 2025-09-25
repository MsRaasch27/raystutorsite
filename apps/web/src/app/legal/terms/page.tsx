import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-xl text-purple-100">
            Enchanted English
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Terms of Service & Promotions</h2>
            
            <div className="space-y-8">
              {/* Service Scope */}
              <div className="border-l-4 border-blue-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Service Scope</h3>
                <p className="text-gray-700">
                  Enchanted English provides online 1-to-1 English tutoring services including live video sessions, custom lesson materials, and interactive dashboard access. Services are delivered digitally and require internet connectivity.
                </p>
              </div>

              {/* Age Requirements */}
              <div className="border-l-4 border-green-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Age Requirements</h3>
                <p className="text-gray-700">
                  Students must be at least 13 years old to use our services independently. Students under 13 must have parental consent and supervision.
                </p>
              </div>

              {/* Acceptable Use */}
              <div className="border-l-4 border-yellow-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Acceptable Use</h3>
                <p className="text-gray-700">
                  Students must use our services respectfully and appropriately. Any harassment, inappropriate behavior, or misuse of the platform may result in service termination.
                </p>
              </div>

              {/* Rescheduling Rules */}
              <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Rescheduling Rules</h3>
                <p className="text-gray-700">
                  Lessons may be rescheduled with at least 24 hours notice. Lessons canceled with less than 24 hours notice are subject to charges as outlined in our Refund Policy.
                </p>
              </div>

              {/* Governing Law */}
              <div className="border-l-4 border-red-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Governing Law</h3>
                <p className="text-gray-700">
                  These terms are governed by the laws of the jurisdiction where Enchanted English operates. Any disputes will be resolved in the appropriate courts of that jurisdiction.
                </p>
              </div>

              {/* Promotions */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Promotional Terms</h3>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <h4 className="font-semibold text-gray-800 mb-2">Promo Code X</h4>
                    <ul className="text-gray-700 space-y-1 text-sm">
                      <li>• Valid through 2025</li>
                      <li>• For new customers only</li>
                      <li>• Not combinable with other offers</li>
                      <li>• Non-transferable</li>
                    </ul>
                  </div>
                  <p className="text-sm text-gray-600">
                    Additional promotional terms and conditions may apply to specific offers. Please refer to individual promotion details for complete terms.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Contact Information</h3>
              <p className="text-gray-700">
                For questions about these terms or our services, please contact our site administrator: <a href="mailto:admin@enchantedenglish.org" className="text-blue-600 hover:text-blue-800 underline">admin@enchantedenglish.org</a>
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
