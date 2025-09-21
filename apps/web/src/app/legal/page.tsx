import Link from "next/link";

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Legal Information</h1>
          <p className="text-xl text-purple-100">
            Enchanted English
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Legal Documents</h2>
            <p className="text-gray-700 mb-8">
              Please review our legal documents to understand our policies and terms of service.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Link
                href="/legal/terms"
                className="block p-6 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all"
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Terms of Service</h3>
                <p className="text-gray-600">
                  Service scope, age requirements, acceptable use, rescheduling rules, governing law, and promotional terms.
                </p>
              </Link>

              <Link
                href="/legal/refund"
                className="block p-6 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all"
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Refund Policy</h3>
                <p className="text-gray-600">
                  Digital services refund policy, including lesson delivery issues, subscription refunds, and no-show policies.
                </p>
              </Link>

              <Link
                href="/legal/cancellation"
                className="block p-6 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all"
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Cancellation Policy</h3>
                <p className="text-gray-600">
                  How to cancel your subscription and when cancellations take effect.
                </p>
              </Link>

              <Link
                href="/legal/restrictions"
                className="block p-6 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all"
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Export Restrictions</h3>
                <p className="text-gray-600">
                  Information about export restrictions and global service availability.
                </p>
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
