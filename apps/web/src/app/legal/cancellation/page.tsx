import Link from "next/link";

export default function CancellationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Cancellation Policy</h1>
          <p className="text-xl text-purple-100">
            Enchanted English
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Subscription Cancellation</h2>
            
            <div className="space-y-6">
              <div className="border-l-4 border-blue-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">How to Cancel</h3>
                <p className="text-gray-700">
                  Cancel anytime by emailing our site admin: <a href="mailto:admin@enchantedenglish.org" className="text-blue-600 hover:text-blue-800 underline">admin@enchantedenglish.org</a>. Cancellations take effect at the end of the current billing cycle; no automatic prorated refunds unless stated in our Refund Policy.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Notes</h3>
                <ul className="text-yellow-700 space-y-2">
                  <li>• Cancellations are processed at the end of your current billing period</li>
                  <li>• You will continue to have access to services until the end of your paid period</li>
                  <li>• No automatic prorated refunds are provided</li>
                  <li>• For refund eligibility, please refer to our Refund Policy</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Contact Information</h3>
              <p className="text-gray-700">
                To cancel your subscription, please email our site administrator with your account details: <a href="mailto:admin@enchantedenglish.org" className="text-blue-600 hover:text-blue-800 underline">admin@enchantedenglish.org</a>
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
