import FreeTrialButton from "@/components/FreeTrialButton";
import Link from "next/link";

export default async function HomePage() {
  return (
    <>
      {/* SEO-optimized content structure */}
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" style={{ backgroundImage: 'url(/gothic_full_cropped.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      {/* Floating Candles */}
      <div 
        className="absolute top-16 left-12 z-50 pointer-events-none"
        style={{
          animation: 'slowBounce 3.5s ease-in-out infinite'
        }}
      >
        <img
          src="/candle.png"
          alt="Floating Candle"
          className="w-[150px] h-[150px] object-contain"
        />
      </div>
      
      <div 
        className="absolute top-24 left-4 z-50 pointer-events-none"
        style={{
          animation: 'slowBounce 3.2s ease-in-out infinite'
        }}
      >
        <img
          src="/candle.png"
          alt="Floating Candle"
          className="w-[140px] h-[140px] object-contain"
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
          
          @media (max-width: 756px) {
            .candle-1 {
              top: -20px !important;
              right: -20px !important;
              width: 150px !important;
              height: 150px !important;
            }
            .candle-2 {
              top: -10px !important;
              right: -10px !important;
              width: 120px !important;
              height: 120px !important;
            }
            .candle-3 {
              top: -5px !important;
              right: -25px !important;
              width: 100px !important;
              height: 100px !important;
            }
          }
          
          @media (min-width: 757px) {
            .candle-1 {
              top: -180px !important;
              right: -100px !important;
              width: 300px !important;
              height: 300px !important;
            }
            .candle-2 {
              top: -100px !important;
              right: -20px !important;
              width: 250px !important;
              height: 250px !important;
            }
            .candle-3 {
              top: -80px !important;
              right: -80px !important;
              width: 200px !important;
              height: 200px !important;
            }
          }
        `
      }} />

<section className="max-w-6xl mx-auto px-4 py-16 rounded-2xl" style={{ backgroundColor: '#000000' }}>

          {/* Content Container with Black Background */}
          <div className="bg-black bg-opacity-90 rounded-2xl p-8 mx-8 my-4 max-w-6xl relative">
            {/* Candles in Bottom Right Corner */}
            <div className="absolute bottom-12 right-0 z-50 pointer-events-none">
              <div 
                className="absolute -top-45 -right-50 candle-1"
                style={{
                  animation: 'slowBounce 3s ease-in-out infinite',
                  width: '300px',
                  height: '300px'
                }}
              >
                <img
                  src="/candle.png"
                  alt="Floating Candle"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    maxWidth: 'none',
                    maxHeight: 'none'
                  }}
                />
              </div>
              
              <div 
                className="absolute -top-25 -right-30 candle-2"
                style={{
                  animation: 'slowBounce 2.8s ease-in-out infinite',
                  width: '250px',
                  height: '250px'
                }}
              >
                <img
                  src="/candle.png"
                  alt="Floating Candle"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    maxWidth: 'none',
                    maxHeight: 'none'
                  }}
                />
              </div>
              
              <div 
                className="absolute -top-20 -right-45 candle-3"
                style={{
                  animation: 'slowBounce 2.5s ease-in-out infinite',
                  width: '200px',
                  height: '200px'
                }}
              >
                <img
                  src="/candle.png"
                  alt="Floating Candle"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    maxWidth: 'none',
                    maxHeight: 'none'
                  }}
                />
              </div>
              
            </div>
            {/* Top Section with Profile Image and Header Text */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
              {/* Profile Image with Wizard Hat */}
              <div className="relative w-28 h-28 md:w-40 md:h-40 flex-shrink-0">
                {/* Profile Image */}
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-white border-opacity-30">
                  <img
                    src="/TEFLclass.jpg"
                    alt="TEFL Class Teaching"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Wizard Hat */}
                <div 
                  className="absolute -top-13 -left-10 z-10"
                  style={{
                    transform: 'rotate(-32deg)',
                    transformOrigin: 'center'
                  }}
                >
                  <img
                    src="/wizardhat.png"
                    alt="Wizard Hat"
                    className="w-19 h-19 md:w-23 md:h-23 object-contain drop-shadow-lg"
                  />
                </div>
              </div>

              {/* Header Text */}
              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 text-white">
                  Discover the Power of English
                </h1>
                <p className="text-lg md:text-xl lg:text-2xl text-white max-w-2xl">
                  Join me on a magical quest to unlock your English language abilities.
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
            Transform Your English Learning Journey
          </h2>
          <p className="text-lg text-gray-200 mb-8 text-center max-w-3xl mx-auto">
            With over a decade of experience in the education industry as well as several years in the gaming industry, I specialize in making complex subjects fun and interesting to learn. As your TEFL-certified English language tutor, I combine proven teaching methods with gamified learning experiences to help you achieve your language goals faster and more effectively.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
              <span className="text-gray-200">One-on-one personalized English instruction</span>
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
          <h3 className="text-2xl font-bold text-white mb-4">Ready to Start Your English Learning Journey?</h3>
          <p className="text-gray-200 mb-6">
            Have questions about English tutoring? I&apos;m here to help you succeed. Book your free trial session today and experience the difference personalized, gamified English learning can make.
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
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-6">
            <p>&copy; 2025 Enchanted English - TEFL Certified English Language Tutor. All rights reserved.</p>
            <p className="mt-2 text-sm text-gray-400">
              Professional English tutoring services with personalized, gamified learning experiences.
            </p>
          </div>
          
          {/* Footer Links */}
          <div className="border-t border-gray-700 pt-6">
            <div className="flex flex-wrap justify-center gap-6 text-center">
              <Link 
                href="/services" 
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Services & Pricing
              </Link>
              <span className="text-gray-600">•</span>
              <Link 
                href="/legal/terms" 
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Terms of Service
              </Link>
              <span className="text-gray-600">•</span>
              <Link 
                href="/legal/refund" 
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Refund Policy
              </Link>
              <span className="text-gray-600">•</span>
              <Link 
                href="/legal/cancellation" 
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Cancellation Policy
              </Link>
              <span className="text-gray-600">•</span>
              <Link 
                href="/legal/restrictions" 
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Export Restrictions
              </Link>
              <span className="text-gray-600">•</span>
              <Link 
                href="/privacy" 
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
    </>
  );
}
