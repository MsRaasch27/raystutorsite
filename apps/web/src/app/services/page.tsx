import Link from "next/link";

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Services</h1>
          <p className="text-xl text-purple-100">
            Enchanted English - Online 1-to-1 English Tutoring
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* What We Offer */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">What We Offer</h2>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <p className="text-lg text-gray-700 leading-relaxed">
              Online 1-to-1 English tutoring. Each plan includes live videos, custom lesson materials, and interactive dashboard.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">How It Works</h2>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <p className="text-lg text-gray-700 leading-relaxed">
              New students start with a free 30-minute trial. After the trial you can choose a plan below.
            </p>
          </div>
        </section>

        {/* Example Plans */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Example Plans</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Starter Plan */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Starter</h3>
              <div className="text-3xl font-bold text-purple-600 mb-2">$X / month</div>
              <p className="text-gray-600 mb-4">1×50-min / week</p>
              <ul className="text-gray-700 space-y-2">
                <li>• Live video sessions</li>
                <li>• Custom lesson materials</li>
                <li>• Interactive dashboard</li>
                <li>• Progress tracking</li>
              </ul>
            </div>

            {/* Standard Plan */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-purple-300 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Popular
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Standard</h3>
              <div className="text-3xl font-bold text-purple-600 mb-2">$Y / month</div>
              <p className="text-gray-600 mb-4">2×50-min / week</p>
              <ul className="text-gray-700 space-y-2">
                <li>• Live video sessions</li>
                <li>• Custom lesson materials</li>
                <li>• Interactive dashboard</li>
                <li>• Progress tracking</li>
                <li>• Priority scheduling</li>
              </ul>
            </div>

            {/* Coaching Add-on */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Coaching Add-on</h3>
              <div className="text-3xl font-bold text-purple-600 mb-2">$Z / month</div>
              <p className="text-gray-600 mb-4">Async feedback</p>
              <ul className="text-gray-700 space-y-2">
                <li>• Written feedback</li>
                <li>• Practice exercises</li>
                <li>• Progress reports</li>
                <li>• Email support</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Billing Note */}
        <section className="mb-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Billing Information</h3>
            <p className="text-yellow-700">
              Subscriptions bill monthly on the purchase date. You can cancel any time from your account or by contacting us.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Link
            href="/"
            className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
          >
            Get Started with Free Trial
          </Link>
        </section>
      </div>
    </div>
  );
}
