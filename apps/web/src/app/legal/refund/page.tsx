import Link from "next/link";

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Refund Policy</h1>
          <p className="text-xl text-purple-100">
            Digital Services - Enchanted English
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Refund Policy for Digital Services</h2>
            
            <div className="space-y-6">
              <div className="border-l-4 border-blue-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Lesson Delivery Issues</h3>
                <p className="text-gray-700">
                  If a paid lesson can&apos;t be delivered due to our fault, we&apos;ll refund or reschedule at your choice.
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Monthly Subscriptions</h3>
                <p className="text-gray-700">
                  Request a pro-rata refund within 7 days of the first charge of a new billing period if no lessons were taken in that period.
                </p>
              </div>

              <div className="border-l-4 border-yellow-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No-Show Policy</h3>
                <p className="text-gray-700">
                  Lessons canceled with &lt;24h notice are charged.
                </p>
              </div>

              <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">How to Request a Refund</h3>
                <p className="text-gray-700">
                  Email site administrator with your name, purchase email, and date.
                </p>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Contact Information</h3>
              <p className="text-gray-700">
                For refund requests or questions about this policy, please contact our site administrator.
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
