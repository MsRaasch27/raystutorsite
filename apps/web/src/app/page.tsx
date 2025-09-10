import FreeTrialButton from "@/components/FreeTrialButton";

export default async function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" style={{ backgroundImage: 'url(/gothic_full_cropped.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      {/* Floating Candles */}
      <div 
        className="absolute top-8 right-8 z-50 pointer-events-none"
        style={{
          animation: 'slowBounce 3s ease-in-out infinite'
        }}
      >
        <img
          src="/candle.png"
          alt="Floating Candle"
          className="w-[150px] h-[150px] object-contain"
        />
      </div>
      
      <div 
        className="absolute top-16 left-12 z-50 pointer-events-none"
        style={{
          animation: 'slowBounce 3.5s ease-in-out infinite'
        }}
      >
        <img
          src="/candle.png"
          alt="Floating Candle"
          className="w-[120px] h-[120px] object-contain"
        />
      </div>
      
      <div 
        className="absolute top-32 right-32 z-50 pointer-events-none"
        style={{
          animation: 'slowBounce 2.8s ease-in-out infinite'
        }}
      >
        <img
          src="/candle.png"
          alt="Floating Candle"
          className="w-[100px] h-[100px] object-contain"
        />
      </div>
      
      <div 
        className="absolute top-24 left-1/3 z-50 pointer-events-none"
        style={{
          animation: 'slowBounce 3.2s ease-in-out infinite'
        }}
      >
        <img
          src="/candle.png"
          alt="Floating Candle"
          className="w-[110px] h-[110px] object-contain"
        />
      </div>
      
      <div 
        className="absolute top-40 right-16 z-50 pointer-events-none"
        style={{
          animation: 'slowBounce 2.5s ease-in-out infinite'
        }}
      >
        <img
          src="/candle.png"
          alt="Floating Candle"
          className="w-[90px] h-[90px] object-contain"
        />
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slowBounce {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-15px);
            }
          }
        `
      }} />

<section className="max-w-6xl mx-auto px-4 py-16 rounded-2xl" style={{ backgroundColor: '#000000' }}>

          {/* Content Container with Black Background */}
          <div className="bg-black bg-opacity-90 rounded-2xl p-8 mx-8 my-4 max-w-6xl">
            {/* Top Section with Profile Image and Header Text */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
              {/* Profile Image */}
              <div className="w-28 h-28 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white border-opacity-30 flex-shrink-0">
                <img
                  src="/TEFLclass.jpg"
                  alt="TEFL Class Teaching"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Header Text */}
              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 text-white">
                  Level Up Your English
                </h1>
                <p className="text-lg md:text-xl lg:text-2xl text-white max-w-2xl">
                  Personalized gamified English language learning designed to help you crush your language goals fast
                </p>
              </div>
            </div>

            {/* Buttons Section */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <FreeTrialButton ctaText="Book a Free Trial Session" />
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
          </section>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-6 py-16 rounded-2xl" style={{ backgroundColor: '#475037' }}>
        {/* About Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Transform Your Learning Journey
          </h2>
          <p className="text-lg text-gray-200 mb-8 text-center max-w-3xl mx-auto">
            With over a decade of experience in the education industry as well as several years in the gaming industry, I specialize in making complex subjects fun and interesting to learn. With me as your TEFL-certified language tutor, you can be confident in achieving your language goals.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
              <span className="text-gray-200">One-on-one personalized instruction</span>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
              <span className="text-gray-200">Flexible scheduling to fit your needs</span>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
              <span className="text-gray-200">Proven track record of student success</span>
            </div>
          </div>
        </div>

        {/* Calendar Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            My Available Session Times
          </h2>

          {/* Google Calendar Embed */}
          <div className="bg-gray-100 rounded-lg p-2 md:p-4 relative">
            <div className="relative overflow-hidden rounded-lg" style={{ height: '400px', minHeight: '400px' }}>
              <iframe 
                src="https://calendar.google.com/calendar/embed?src=851d007aa799df38b9c1c26d7a66fbdd6401620026e6b7429e535849df9447dd%40group.calendar.google.com&ctz=Asia%2FBangkok" 
                style={{ border: 0, width: '100%', height: '100%', minHeight: '400px' }}
                frameBorder="0" 
                scrolling="no"
                title="Available Session Times"
              />
              
              {/* Optional: Transparent overlay to prevent direct booking */}
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
          <h3 className="text-2xl font-bold text-white mb-4">Ready to Get Started?</h3>
          <p className="text-gray-200 mb-6">
            Have questions? I&apos;m here to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:msraasch27@gmail.com" className="bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors">
              Email Me
            </a>
            <FreeTrialButton ctaText="Claim Free Trial" variant="secondary" />
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
