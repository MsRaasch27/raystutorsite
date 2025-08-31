export default async function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative min-h-[500px] md:h-96 flex items-center justify-center overflow-hidden py-8">
        {/* Background Image */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700">
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-center text-white px-6 gap-8">
          {/* Profile Image */}
          <div className="w-28 h-28 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white border-opacity-30">
            <img 
              src="/TEFLclass.jpg" 
              alt="TEFL Class Teaching" 
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Text Content */}
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4">
              Level Up Your Language Skills
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl mb-6 max-w-2xl">
              Personalized gamified English language learning designed to help you crush your language goals fast
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <a 
                href="https://forms.gle/kMfysT3gYQ1PsqLQ8" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block text-center"
              >
                Book a Free Trial Session
              </a>
              <a 
                href="https://forms.gle/kMfysT3gYQ1PsqLQ8" 
                target="_blank" 
                rel="noopener noreferrer"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-block text-center"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        {/* About Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Transform Your Learning Journey
          </h2>
          <p className="text-lg text-gray-600 mb-8 text-center max-w-3xl mx-auto">
            With over a decade of experience in the education industry as well as several years in the gaming industry, I specialize in making complex subjects fun and interesting to learn. With me as your TEFL-certified language tutor, you can be confident in achieving your language goals.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              <span className="text-gray-700">One-on-one personalized instruction</span>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              <span className="text-gray-700">Flexible scheduling to fit your needs</span>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              <span className="text-gray-700">Proven track record of student success</span>
            </div>
          </div>
        </div>

        {/* Calendar Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            My Available Session Times
          </h2>
  
          
                    {/* Google Calendar Embed with Read-only Overlay */}
          <div className="bg-gray-100 rounded-lg p-2 md:p-4 relative">
            <div className="relative overflow-hidden rounded-lg" style={{ height: '400px', minHeight: '400px' }}>
              <iframe 
                src="https://calendly.com/msraasch27/50min" 
                style={{ 
                  border: 0,
                  width: '100%',
                  height: '100%',
                  minHeight: '400px'
                }} 
                frameBorder="0" 
                scrolling="no"
              />
              {/* Transparent overlay to prevent clicks */}
              <div 
                className="absolute inset-0 bg-transparent cursor-not-allowed"
                style={{ zIndex: 10 }}
                title="Contact to book appointments"
              ></div>
            </div>
            <div className="text-center mt-2 md:mt-4">
              <p className="text-gray-600 text-xs md:text-sm px-2">
                <strong>Note:</strong> This is a preview of available times. Please contact me to book an appointment.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Ready to Get Started?</h3>
          <p className="text-gray-600 mb-6">
            Have questions? I&apos;m here to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:msraasch27@gmail.com" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Email Me
            </a>
            <a 
              href="https://forms.gle/kMfysT3gYQ1PsqLQ8" 
              target="_blank" 
              rel="noopener noreferrer"
              className="border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Claim Free Trial
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p>&copy; 2025 Ray Raasch. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
